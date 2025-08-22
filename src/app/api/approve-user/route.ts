import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS } from '../../../lib/config';

// Initialize Google Sheets API client
async function getGoogleSheetsClient() {
  const jwtClient = new JWT({
    email: googleConfig.client_email,
    key: googleConfig.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await jwtClient.authorize();
  
  return google.sheets({ version: 'v4', auth: jwtClient });
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Approve User API Called ===');
    
    const body = await request.json();
    const { username, utmId } = body;
    
    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (!utmId) {
      return NextResponse.json(
        { error: 'UTM ID is required for approval' },
        { status: 400 }
      );
    }

    console.log(`Attempting to approve user: ${username} with UTM ID: ${utmId}`);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    // First, find the row number for the user and get their details
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'User_Registrations!A:G',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No users found in sheet' },
        { status: 404 }
      );
    }

    // Find the row index for the username (column E) and get user details
    let userRowIndex = -1;
    let userDetails = null;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] === username) { // Column E (index 4) contains username
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        userDetails = {
          name: rows[i][0],      // Column A: Name
          email: rows[i][1],     // Column B: Email
          socialMedia: rows[i][2], // Column C: Social Media
          mobile: rows[i][3],    // Column D: Mobile
          username: rows[i][4],  // Column E: Username
          password: rows[i][5],  // Column F: Password
        };
        break;
      }
    }

    if (userRowIndex === -1 || !userDetails) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Found user at row ${userRowIndex}, processing approval...`);

    // Step 1: Add user to the credentials sheet (Sheet1)
    try {
      const credentialsData = [
        [userDetails.username, userDetails.password, utmId, userDetails.name]
      ];

      console.log('Adding user to credentials sheet:', credentialsData);

      const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: credentialsData
        }
      });

      console.log('User added to credentials sheet:', appendResult.data);
    } catch (credentialsError) {
      console.error('Error adding user to credentials sheet:', credentialsError);
      return NextResponse.json(
        { error: 'Failed to add user to credentials sheet', details: credentialsError instanceof Error ? credentialsError.message : String(credentialsError) },
        { status: 500 }
      );
    }

    // Step 2: Update the Approved column (column G) in User_Registrations
    try {
      const updateResult = await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: `User_Registrations!G${userRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Yes']]
        }
      });

      console.log('Approval status updated:', updateResult.data);
    } catch (approvalError) {
      console.error('Error updating approval status:', approvalError);
      // Even if approval status update fails, the user is already in credentials sheet
      console.log('Note: User added to credentials but approval status update failed');
    }

    console.log(`User ${username} approved successfully and added to credentials sheet`);

    return NextResponse.json({
      success: true,
      message: `User ${username} has been approved successfully and added to credentials sheet with UTM ID: ${utmId}`,
      user: {
        username: userDetails.username,
        name: userDetails.name,
        utmId: utmId
      }
    });

  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json(
      { error: 'Failed to approve user', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
