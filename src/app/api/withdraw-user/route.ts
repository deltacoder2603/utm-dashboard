import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, validateGoogleConfig } from '@/lib/config';

export async function POST(request: NextRequest) {
  try {
    // Validate Google configuration first
    validateGoogleConfig();

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
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

    // Read the approved users sheet to find the user's row
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet1!A:D',
    });

    const values = response.data.values || [];
    let userRowIndex = -1;

    // Find the row with the matching username (column A)
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === username) { // Username is in column A (index 0)
        userRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (userRowIndex === -1) {
      return NextResponse.json(
        { error: 'User not found in approved users list' },
        { status: 404 }
      );
    }

    // Clear the row in Sheet1 (approved users)
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: `Sheet1!A${userRowIndex}:D${userRowIndex}`,
    });

    return NextResponse.json({
      message: `User ${username} withdrawn successfully`,
      username
    });

  } catch (error) {
    console.error('Error in withdraw-user API:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
