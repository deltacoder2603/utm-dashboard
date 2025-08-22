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
    console.log('=== Approve/Reject Withdrawal API Called ===');
    
    const body = await request.json();
    const { requestId, status, username } = body;
    
    if (!requestId || !status || !username) {
      return NextResponse.json(
        { error: 'Request ID, status, and username are required' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    console.log(`Processing withdrawal ${status} for user: ${username}`);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    if (status === 'approved') {
      // For approved withdrawals, remove user from both sheets
      console.log('Approved withdrawal - removing user from both sheets...');

      // Step 1: Find and remove user from User_Registrations sheet
      const registrationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:H',
      });

      const registrationRows = registrationsResponse.data.values;
      if (registrationRows && registrationRows.length > 0) {
        for (let i = 1; i < registrationRows.length; i++) {
          if (registrationRows[i][4] === username) { // Column E: Username
            const userRowIndex = i + 1; // Google Sheets is 1-indexed
            console.log(`Found user in User_Registrations at row ${userRowIndex}, removing...`);
            
            // Clear the entire row
            await sheets.spreadsheets.values.clear({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              range: `User_Registrations!A${userRowIndex}:H${userRowIndex}`,
            });
            
            console.log(`User removed from User_Registrations sheet`);
            break;
          }
        }
      }

      // Step 2: Remove user from Sheet1 (credentials sheet)
      const credentialsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
      });

      const credentialRows = credentialsResponse.data.values;
      if (credentialRows && credentialRows.length > 0) {
        for (let i = 1; i < credentialRows.length; i++) {
          if (credentialRows[i][0] === username) { // Column A: Username
            const credentialRowIndex = i + 1; // Google Sheets is 1-indexed
            console.log(`Found user in Sheet1 at row ${credentialRowIndex}, removing...`);
            
            // Clear the entire row
            await sheets.spreadsheets.values.clear({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              range: `Sheet1!A${credentialRowIndex}:D${credentialRowIndex}`,
            });
            
            console.log(`User removed from Sheet1 (credentials) sheet`);
            break;
          }
        }
      }

      console.log(`User ${username} completely removed from system after approved withdrawal`);
    } else {
      // For rejected withdrawals, just clear the Withdraw column
      console.log('Rejected withdrawal - clearing withdraw status...');
      
      const registrationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:H',
      });

      const registrationRows = registrationsResponse.data.values;
      if (registrationRows && registrationRows.length > 0) {
        for (let i = 1; i < registrationRows.length; i++) {
          if (registrationRows[i][4] === username) { // Column E: Username
            const userRowIndex = i + 1; // Google Sheets is 1-indexed
            console.log(`Found user in User_Registrations at row ${userRowIndex}, clearing withdraw status...`);
            
            // Clear the Withdraw column (column H)
            await sheets.spreadsheets.values.update({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              range: `User_Registrations!H${userRowIndex}`,
              valueInputOption: 'RAW',
              requestBody: {
                values: [['']]
              }
            });
            
            console.log(`Withdraw status cleared for user ${username}`);
            break;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Withdrawal request ${status} successfully`,
      requestId,
      status,
      username
    });

  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
