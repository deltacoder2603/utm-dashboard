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
    const { name, email, socialMediaLink, mobileNumber, username, password } = body;

    // Validation
    if (!name || !email || !mobileNumber || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    try {
      // Add user to User_Registrations sheet only
      const registrationData = [
        [name, email, socialMediaLink || '', mobileNumber, username, password, ''] // Empty UTM ID field
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:G',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: registrationData
        }
      });

      console.log(`User ${username} registered successfully`);

      return NextResponse.json({
        success: true,
        message: 'Registration successful, we will come back to you soon',
        user: {
          username: username,
          name: name,
          email: email
        }
      });

    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to save user data to Google Sheets' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
