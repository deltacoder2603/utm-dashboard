import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS } from '@/lib/config';

interface RemoveUserRequest {
  username: string;
}

// Initialize Google Sheets API client
async function getGoogleSheetsClient() {
  try {
    const jwtClient = new JWT({
      email: googleConfig.client_email,
      key: googleConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    await jwtClient.authorize();
    return google.sheets({ version: 'v4', auth: jwtClient });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw new Error('Failed to initialize Google Sheets client');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Remove User API Call ===');

    const { username }: RemoveUserRequest = await request.json();
    console.log('Request data:', { username });

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    if (!googleConfig.private_key || !googleConfig.client_email) {
      console.error('Missing Google Sheets configuration');
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 });
    }

    const sheets = await getGoogleSheetsClient();

    // Get the correct sheet IDs
    const sheet1Id = 0; // Sheet1
    const userRegistrationsId = 99552550; // User_Registrations (from the test)

    // Step 1: First remove user from User_Registrations sheet (this is what the user registrations API reads from)
    const registrationsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'User_Registrations!A:H',
      majorDimension: 'ROWS',
    });

    const registrationsValues = registrationsResponse.data.values as string[][] || [];
    if (registrationsValues.length === 0) {
      console.error('No data found in User_Registrations sheet');
      return NextResponse.json({ error: 'No data found in User_Registrations sheet' }, { status: 404 });
    }

    // Find the user in the registrations sheet
    let registrationRowIndex = -1;
    for (let i = 0; i < registrationsValues.length; i++) {
      const row = registrationsValues[i];
      if (row && row.length > 4 && row[4] === username) { // Username is in column E (index 4)
        registrationRowIndex = i;
        break;
      }
    }

    if (registrationRowIndex === -1) {
      console.error('User not found in User_Registrations sheet:', username);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Found user in registrations at row:', registrationRowIndex + 1);

    // Step 2: Remove user from User_Registrations sheet
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: userRegistrationsId,
                dimension: 'ROWS',
                startIndex: registrationRowIndex,
                endIndex: registrationRowIndex + 1
              }
            }
          }
        ]
      }
    });

    console.log('User removed from User_Registrations sheet');

    // Step 3: Check if user exists in credentials sheet and remove them if they do
    let userUtmId = '';
    try {
      const credentialsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:E',
        majorDimension: 'ROWS',
      });

      const credentialsValues = credentialsResponse.data.values as string[][] || [];
      
      // Find the user row and their UTM ID
      let userRowIndex = -1;
      
      for (let i = 0; i < credentialsValues.length; i++) {
        const row = credentialsValues[i];
        if (row && row.length > 0 && row[0] === username) {
          userRowIndex = i;
          userUtmId = row[2] || ''; // UTM ID is in column C (index 2)
          break;
        }
      }

      if (userRowIndex !== -1) {
        // Remove user from credentials sheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: sheet1Id,
                    dimension: 'ROWS',
                    startIndex: userRowIndex,
                    endIndex: userRowIndex + 1
                  }
                }
              }
            ]
          }
        });

        console.log('User removed from credentials sheet (Sheet1)');
      } else {
        console.log('User not found in credentials sheet (Sheet1)');
      }
    } catch (credentialsError) {
      console.error('Error accessing credentials sheet:', credentialsError);
      // Don't fail the main operation if credentials access fails
    }



    // Note: User registrations are stored in a separate sheet that the user registrations API reads from
    // For now, we're only removing from the credentials sheet (Sheet1/creds)
    // The user registrations API will continue to show the user until they're manually removed from that sheet

    // Step 3: If user had a UTM ID, remove it from the UTM summary sheet
    if (userUtmId && userUtmId !== 'NA') {
      try {
        const summaryResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
          range: 'summary!A:C',
          majorDimension: 'ROWS',
        });

        const summaryValues = summaryResponse.data.values as string[][] || [];
        
        // Find the row with the UTM ID
        let utmRowIndex = -1;
        for (let i = 0; i < summaryValues.length; i++) {
          const row = summaryValues[i];
          if (row && row.length > 1 && row[1] === userUtmId) {
            utmRowIndex = i;
            break;
          }
        }

        if (utmRowIndex !== -1) {
          // Delete the UTM row from summary sheet
          await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
            requestBody: {
              requests: [
                {
                  deleteDimension: {
                    range: {
                      sheetId: 0, // summary sheet
                      dimension: 'ROWS',
                      startIndex: utmRowIndex,
                      endIndex: utmRowIndex + 1
                    }
                  }
                }
              ]
            }
          });

          console.log('UTM ID removed from summary sheet:', userUtmId);
        } else {
          console.log('UTM ID not found in summary sheet:', userUtmId);
        }
      } catch (utmError) {
        console.error('Error removing UTM ID from summary sheet:', utmError);
        // Don't fail the main operation if UTM removal fails
      }
    }

    console.log('User removed successfully from both sheets');
    return NextResponse.json({ 
      success: true, 
      message: 'User removed successfully from both sheets',
      removedUser: username,
      removedUtmId: userUtmId
    });

  } catch (error) {
    console.error('Error removing user:', error);
    return NextResponse.json({ 
      error: 'Failed to remove user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
