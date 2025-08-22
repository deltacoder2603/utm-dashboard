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
    console.log('=== Fetching User Registrations ===');
    
    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    // Fetch data from User_Registrations sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'User_Registrations!A:G', // A=Name, B=Email, C=Social Media, D=Mobile, E=Username, F=Password, G=Approved
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in sheet');
      return NextResponse.json({ users: [] });
    }

    // Skip header row and process data
    const users = rows.slice(1).map((row, index) => {
      const [name, email, socialMedia, mobile, username, , approved] = row;
      return {
        id: index + 1,
        name: name || '',
        email: email || '',
        socialMedia: socialMedia || '',
        mobile: mobile || '',
        username: username || '',
        approved: approved === 'Yes' || approved === 'yes' || approved === 'YES'
      };
    });

    console.log(`Fetched ${users.length} users from sheet`);
    
    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching user registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user registrations', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
