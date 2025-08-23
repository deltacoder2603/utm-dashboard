import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS } from '../../../lib/config';
import { updateAccountRemovalStatus } from '@/lib/account-removal-store';

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
    console.log('=== Approve/Reject Account Removal API Called ===');
    
    const body = await request.json();
    const { requestId, username, utmId, status } = body;

    console.log('Request body:', body);

    // Validate required fields
    if (!requestId || !username || !status) {
      return NextResponse.json(
        { error: 'Request ID, username, and status are required' },
        { status: 400 }
      );
    }

    // Update the status in our store
    const updateSuccess = updateAccountRemovalStatus(requestId, status);
    if (!updateSuccess) {
      return NextResponse.json(
        { error: 'Account removal request not found' },
        { status: 404 }
      );
    }

    console.log(`Processing account removal ${status} for user: ${username}`);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    if (status === 'approved') {
      // For approved account removals, remove user from both sheets
      console.log('Approved account removal - removing user from both sheets...');

      // Remove from User_Registrations sheet
      const usersResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:H',
      });

      const userRows = usersResponse.data.values;
      if (userRows && userRows.length > 0) {
        for (let i = 1; i < userRows.length; i++) {
          if (userRows[i][4] === username) { // Column E (index 4) contains username
            // Delete the row
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              requestBody: {
                requests: [{
                  deleteDimension: {
                    range: {
                      sheetId: 0, // Assuming User_Registrations is the first sheet
                      dimension: 'ROWS',
                      startIndex: i,
                      endIndex: i + 1
                    }
                  }
                }]
              }
            });
            console.log(`Removed user ${username} from User_Registrations sheet`);
            break;
          }
        }
      }

      // Remove from credentials sheet (Sheet1)
      const credentialsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
      });

      const credentialRows = credentialsResponse.data.values;
      if (credentialRows && credentialRows.length > 0) {
        for (let i = 1; i < credentialRows.length; i++) {
          if (credentialRows[i][0] === username) { // Column A contains username
            // Delete the row
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              requestBody: {
                requests: [{
                  deleteDimension: {
                    range: {
                      sheetId: 1, // Assuming Sheet1 is the second sheet
                      dimension: 'ROWS',
                      startIndex: i,
                      endIndex: i + 1
                    }
                  }
                }]
              }
            });
            console.log(`Removed user ${username} from credentials sheet`);
            break;
          }
        }
      }

      console.log(`Account removal approved and user ${username} removed from both sheets`);
    }

    return NextResponse.json({
      success: true,
      message: `Account removal request ${status} successfully`,
      status: status
    });

  } catch (error) {
    console.error('Error processing account removal:', error);
    
    return NextResponse.json(
      { error: 'Failed to process account removal', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
