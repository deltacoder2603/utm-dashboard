import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS } from '@/lib/config';

interface UpdateUTMRequest {
  originalUtmId: string;
  updatedData: {
    utmId: string;
    count: number;
    earnings: number;
    ratePerLead: number;
  };
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
    console.log('=== Update UTM Data API Call ===');

    const { originalUtmId, updatedData }: UpdateUTMRequest = await request.json();
    console.log('Request data:', { originalUtmId, updatedData });

    if (!originalUtmId || !updatedData) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
    }

    if (!googleConfig.private_key || !googleConfig.client_email) {
      console.error('Missing Google Sheets configuration');
      return NextResponse.json({ error: 'Google Sheets configuration missing' }, { status: 500 });
    }

    const sheets = await getGoogleSheetsClient();

    // First, get the current summary sheet data to find the row (including rate column D)
    const summaryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
      range: 'summary!A:D',
      majorDimension: 'ROWS',
    });

    const summaryValues = summaryResponse.data.values as string[][] || [];
    if (summaryValues.length === 0) {
      console.error('No data found in summary sheet');
      return NextResponse.json({ error: 'No data found in summary sheet' }, { status: 404 });
    }

    // Find the row with the original UTM ID
    let targetRowIndex = -1;
    for (let i = 0; i < summaryValues.length; i++) {
      const row = summaryValues[i];
      // Check if this row contains the UTM ID we're looking for
      if (row && row.length > 1 && row[1] === originalUtmId) {
        targetRowIndex = i;
        break;
      }
    }

    if (targetRowIndex === -1) {
      console.error('UTM ID not found in summary sheet:', originalUtmId);
      return NextResponse.json({ error: 'UTM ID not found' }, { status: 404 });
    }

    console.log('Found UTM ID at row:', targetRowIndex + 1);

    // Update the UTM data in the summary sheet including the rate column (D)
    // Note: We need to use 1-based indexing for the API
    const updateRange = `summary!A${targetRowIndex + 1}:D${targetRowIndex + 1}`;
    const updateValues = [
      ['', updatedData.utmId, updatedData.count.toString(), updatedData.ratePerLead.toString()]
    ];

    console.log('Updating range:', updateRange, 'with values:', updateValues);

    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: updateValues
      }
    });

    // If UTM ID changed or rate changed, also update the users sheet
    if (originalUtmId !== updatedData.utmId || updatedData.ratePerLead !== 45) {
      try {
        // Get the credentials sheet data
        const credentialsResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
          range: 'Sheet1!A:E',
          majorDimension: 'ROWS',
        });

        const credentialsValues = credentialsResponse.data.values as string[][] || [];
        
        // Find user with the UTM ID and update their rate
        for (let i = 0; i < credentialsValues.length; i++) {
          const row = credentialsValues[i];
          if (row && row.length > 2 && (row[2] === originalUtmId || row[2] === updatedData.utmId)) {
            // Update the rate column (column E, index 4)
            const updateUserRange = `Sheet1!E${i + 1}`;
            const updateUserValues = [[updatedData.ratePerLead.toString()]];
            
            await sheets.spreadsheets.values.update({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              range: updateUserRange,
              valueInputOption: 'RAW',
              requestBody: {
                values: updateUserValues
              }
            });

            // If UTM ID changed, also update the UTM ID column
            if (originalUtmId !== updatedData.utmId) {
              const updateUtmRange = `Sheet1!C${i + 1}`;
              const updateUtmValues = [[updatedData.utmId]];
              
              await sheets.spreadsheets.values.update({
                spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
                range: updateUtmRange,
                valueInputOption: 'RAW',
                requestBody: {
                  values: updateUtmValues
                }
              });
            }

            console.log('Updated user rate and UTM ID for row:', i + 1);
            break;
          }
        }
      } catch (userUpdateError) {
        console.error('Error updating user rate:', userUpdateError);
        // Don't fail the main operation if user rate update fails
      }
    }

    console.log('UTM data updated successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'UTM data updated successfully',
      updatedData 
    });

  } catch (error) {
    console.error('Error updating UTM data:', error);
    return NextResponse.json({ 
      error: 'Failed to update UTM data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
