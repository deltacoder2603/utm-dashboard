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
    console.log('=== Withdrawal Request API Called ===');
    
    const body = await request.json();
    const { username, utmId, name } = body;
    
    if (!username || !utmId || !name) {
      return NextResponse.json(
        { error: 'Username, UTM ID, and name are required' },
        { status: 400 }
      );
    }

    console.log(`Processing withdrawal request for user: ${username}, UTM ID: ${utmId}`);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    // First, find the user in the User_Registrations sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'User_Registrations!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'No users found in sheet' },
        { status: 404 }
      );
    }

    // Find the row index for the username (column E)
    let userRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][4] === username) { // Column E (index 4) contains username
        userRowIndex = i + 1; // Google Sheets is 1-indexed
        break;
      }
    }

    if (userRowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    console.log(`Found user at row ${userRowIndex}, updating withdraw column...`);

    // Update the Withdraw column (column H) for the specific user
    const updateResult = await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: `User_Registrations!H${userRowIndex}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [['Yes']]
      }
    });

    console.log('Withdraw column updated:', updateResult.data);

    // Generate a unique request ID
    const requestId = `req_${Date.now()}`;
    const requestDate = new Date().toISOString();

    console.log(`Withdrawal request submitted for user ${username}:`, {
      id: requestId,
      username,
      utmId,
      name,
      requestDate,
      status: 'pending'
    });

    return NextResponse.json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      request: {
        id: requestId,
        username,
        utmId,
        name,
        requestDate,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error submitting withdrawal request:', error);
    return NextResponse.json(
      { error: 'Failed to submit withdrawal request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
