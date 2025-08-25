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
    console.log('=== Registration API Called ===');
    
    const body = await request.json();
    const { name, email, socialMediaLink, utmLink, mobileNumber, username, password } = body;
    
    console.log('Received data:', { name, email, mobileNumber, username, password: password ? '[HIDDEN]' : 'MISSING', utmLink });

    // Validation
    if (!name || !email || !mobileNumber || !username || !password || !utmLink) {
      console.log('Validation failed - missing fields');
      return NextResponse.json(
        { error: 'Missing required fields including UTM Link' },
        { status: 400 }
      );
    }

    console.log('Validation passed, attempting to get Google Sheets client...');

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();
    console.log('Google Sheets client obtained successfully');

    try {
      // Add user to User_Registrations sheet only
      const registrationData = [
        [name, email, socialMediaLink || '', utmLink, mobileNumber, username, password, ''] // UTM Link becomes UTM ID
      ];

      console.log('Attempting to append data to sheet:', SHEET_IDS.USERS_SHEET_ID);
      console.log('Data to append:', registrationData);

      const appendResult = await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:H',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: registrationData
        }
      });

      console.log('Append result:', appendResult.data);

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
        { error: 'Failed to save user data to Google Sheets', details: sheetsError instanceof Error ? sheetsError.message : String(sheetsError) },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
