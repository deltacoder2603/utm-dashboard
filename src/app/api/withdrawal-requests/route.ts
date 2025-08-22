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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log('=== Fetching Withdrawal Requests ===');
    if (username) {
      console.log(`Filtering by username: ${username}`);
    }

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    // Read from User_Registrations sheet including the Withdraw column
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'User_Registrations!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet');
      return NextResponse.json({ requests: [] });
    }

    // Process rows to find withdrawal requests (where Withdraw column = 'Yes')
    const withdrawalRequests = [];
    
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 8 && row[7] === 'Yes') { // Column H (index 7) contains Withdraw status
        // For UTM ID, we need to check if user is approved and get UTM ID from credentials sheet
        let utmId = '';
        
        // If user is approved (column G = 'Yes'), try to get UTM ID from credentials sheet
        if (row[6] === 'Yes') {
          try {
            const credentialsResponse = await sheets.spreadsheets.values.get({
              spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
              range: 'Sheet1!A:D',
            });
            
            const credentialRows = credentialsResponse.data.values;
            if (credentialRows && credentialRows.length > 0) {
              for (let j = 1; j < credentialRows.length; j++) {
                if (credentialRows[j][0] === row[4]) { // Column A: Username
                  utmId = credentialRows[j][2] || ''; // Column C: UTM ID
                  break;
                }
              }
            }
          } catch (error) {
            console.log('Could not fetch UTM ID from credentials sheet:', error);
          }
        }
        
        const request = {
          id: `req_${i}_${Date.now()}`, // Generate unique ID
          username: row[4] || '', // Column E: Username
          utmId: utmId, // UTM ID from credentials sheet or empty if not approved
          name: row[0] || '', // Column A: Name
          requestDate: new Date().toISOString(), // Current date since we don't store request date
          status: 'pending'
        };
        
        // Only add if username matches the filter (if provided)
        if (!username || request.username === username) {
          withdrawalRequests.push(request);
        }
      }
    }

    console.log(`Found ${withdrawalRequests.length} withdrawal requests${username ? ` for user ${username}` : ' total'}`);
    
    return NextResponse.json({ requests: withdrawalRequests });

  } catch (error) {
    console.error('Fetch withdrawal requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
