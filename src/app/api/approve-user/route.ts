import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, validateGoogleConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Validate Google configuration first
    validateGoogleConfig();

    const { username, password, utmId, name } = await request.json();

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Username, password, and name are required' },
        { status: 400 }
      );
    }

    // Create JWT client
    const auth = new JWT({
      email: googleConfig.client_email,
      key: googleConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Authorize the client
    await auth.authorize();

    const sheets = google.sheets({ version: 'v4', auth });

    // Step 1: Add user to Sheet1 (approved users)
    const userData = [
      [username, password, utmId || '', name]
    ];

    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: userData
        }
      });
    } catch (appendError) {
      console.error('Error appending user:', appendError);
      throw new Error(`Failed to add user to Sheet1: ${appendError.message}`);
    }

    // Step 2: Remove user from User_Registrations sheet
    try {
      // Read the registrations sheet to find the user's row
      const registrationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:F',
      });

      const registrationsData = registrationsResponse.data.values || [];
      let userRowIndex = -1;

      // Find the row with the matching username (column E)
      for (let i = 1; i < registrationsData.length; i++) {
        if (registrationsData[i][4] === username) { // Username is in column E (index 4)
          userRowIndex = i + 1; // +1 because sheet rows are 1-indexed
          break;
        }
      }

      if (userRowIndex > 0) {
        try {
          // Instead of deleting the row, clear the data
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
            range: `User_Registrations!A${userRowIndex}:F${userRowIndex}`,
          });
        } catch (clearError) {
          console.error('Error clearing row data:', clearError);
          // Continue with the process even if clearing fails
        }
      }
    } catch (clearError) {
      console.error('Error clearing registration:', clearError);
      // Continue with the process even if clearing fails
    }

    return NextResponse.json({ 
      message: `User ${username} approved successfully`,
      username,
      password,
      utmId: utmId || '',
      name
    });

  } catch (error) {
    console.error('Error in approve-user API:', error);
    return NextResponse.json(
      { error: 'Failed to approve user', details: error.message },
      { status: 500 }
    );
  }
}
