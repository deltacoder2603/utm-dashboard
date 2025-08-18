import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet1!A:D',
    });
    
    const values = response.data.values || [];
    const users = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row && row.length >= 4 && row[0] && row[1]) { // username, password, utmId, name
        users.push({
          username: row[0],
          password: row[1],
          utmId: row[2] || '',
          name: row[3] || ''
        });
      }
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users from Google Sheets' },
      { status: 500 }
    );
  }
}
