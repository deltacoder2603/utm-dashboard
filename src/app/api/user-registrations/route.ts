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
      range: 'User_Registrations!A:F',
    });
    
    const values = response.data.values || [];
    const registrations = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.length >= 6 && row[0] && row[1] && row[2] && row[3] && row[4] && row[5]) {
        registrations.push({
          name: row[0],
          email: row[1],
          socialMediaLink: row[2] || '',
          mobileNumber: row[3],
          username: row[4],
          password: row[5]
        });
      }
    }
    
    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user registrations from Google Sheets' },
      { status: 500 }
    );
  }
}
