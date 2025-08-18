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
    const body = await request.json();
    const { username, utmId } = body;

    // Validation
    if (!username || !utmId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    try {
      // First, find and remove user from User_Registrations sheet
      const registrationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:G',
      });

      const registrationsData = registrationsResponse.data.values || [];
      let userRowIndex = -1;

      // Find the row containing the user's data
      for (let i = 0; i < registrationsData.length; i++) {
        if (registrationsData[i][4] === username && registrationsData[i][6] === utmId) {
          userRowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }

      if (userRowIndex > 0) {
        // Delete the user's registration row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 99552550, // User_Registrations sheet ID
                    dimension: 'ROWS',
                    startIndex: userRowIndex - 1,
                    endIndex: userRowIndex
                  }
                }
              }
            ]
          }
        });
      }

      // Now find and remove user from Sheet1
      const sheet1Response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
      });

      const sheet1Data = sheet1Response.data.values || [];
      let utmRowIndex = -1;

      // Find the row containing the user's UTM data
      for (let i = 0; i < sheet1Data.length; i++) {
        if (sheet1Data[i][1] === utmId) {
          utmRowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }

      if (utmRowIndex > 0) {
        // Delete the user's UTM data row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // Sheet1 sheet ID
                    dimension: 'ROWS',
                    startIndex: utmRowIndex - 1,
                    endIndex: utmRowIndex
                  }
                }
              }
            ]
          }
        });
      }

      console.log(`User ${username} with UTM ID ${utmId} withdrawn successfully`);

      return NextResponse.json({
        success: true,
        message: 'User withdrawn successfully',
        data: {
          username,
          utmId,
          withdrawnAt: new Date().toISOString()
        }
      });

    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to remove user data from Google Sheets' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
