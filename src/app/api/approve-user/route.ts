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
    const { username, utmId, ratePerLead } = body;
    
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

    if (!ratePerLead || ratePerLead <= 0) {
      return NextResponse.json(
        { error: 'Valid rate per lead is required for approval' },
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

    // Step 1: Check if UTM ID already exists in summary sheet and insert if new
    try {
      const utmResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
        range: 'summary!A:Z', // Use summary sheet to check for UTM ID
      });

      const utmRows = utmResponse.data.values;
      const utmIdExists = utmRows && utmRows.some(row => row[1] === utmId); // Column B contains UTM ID in summary sheet

      if (utmIdExists) {
        console.log(`UTM ID ${utmId} already exists in summary sheet, skipping insertion - not touching existing data`);
        
        // If UTM ID exists, we should update the rate column for that existing UTM ID
        // Find the row with the existing UTM ID and update its rate
        let existingUtmRowIndex = -1;
        for (let i = 0; i < utmRows.length; i++) {
          if (utmRows[i] && utmRows[i][1] === utmId) {
            existingUtmRowIndex = i;
            break;
          }
        }
        
        if (existingUtmRowIndex !== -1) {
          // Update the rate column (column D) for the existing UTM ID
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
            range: `summary!D${existingUtmRowIndex + 1}`, // Rate column D
            valueInputOption: 'RAW',
            requestBody: {
              values: [[ratePerLead.toString()]]
            }
          });
          console.log(`Updated rate for existing UTM ID ${utmId} to ${ratePerLead}`);
        }
      } else {
        // Insert new UTM ID to summary sheet with 0 leads and rate
        if (utmRows && utmRows.length > 0) {
          // Find the last UTM data row (before any empty rows or totals)
          let lastUTMRowIndex = 0;
          for (let i = utmRows.length - 1; i >= 0; i--) {
            if (utmRows[i] && utmRows[i][1] && (utmRows[i][1].startsWith('inf_') || utmRows[i][1].startsWith('divyanshu_'))) {
              lastUTMRowIndex = i;
              break;
            }
          }
          
          // Insert after the last UTM data row
          const insertRow = lastUTMRowIndex + 2; // +2 because sheets are 1-indexed and we want to insert after
          
          // Insert the new UTM ID with 0 leads in column C and rate in column D
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
            range: `summary!A${insertRow}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['', utmId, 0, ratePerLead]] // Empty A, UTM ID in B, 0 leads in C, Rate in D
            }
          });

          console.log(`New UTM ID ${utmId} inserted to summary sheet at row ${insertRow} with rate ${ratePerLead} and 0 leads`);
        } else {
          // If no rows exist, insert after header row
          await sheets.spreadsheets.values.update({
            spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
            range: 'summary!A11', // After header row (row 10)
            valueInputOption: 'RAW',
            requestBody: {
              values: [['', utmId, 0, ratePerLead]] // Empty A, UTM ID in B, 0 leads in C, Rate in D
            }
          });

          console.log(`New UTM ID ${utmId} inserted to summary sheet at row 11 with rate ${ratePerLead} and 0 leads`);
        }
      }
    } catch (utmError) {
      console.error('Error handling UTM summary sheet:', utmError);
      // Continue with approval even if UTM sheet update fails
    }

    // Step 2: Add user to the credentials sheet (Sheet1) with rate per lead
    try {
      const credentialsData = [
        [userDetails.username, userDetails.password, utmId, userDetails.name, ratePerLead]
      ];

      console.log('Adding user to credentials sheet:', credentialsData);

      const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:E', // Updated to include rate column
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
