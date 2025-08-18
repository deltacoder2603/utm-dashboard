import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

export async function GET() {
  try {
    // Create JWT client
    const auth = new JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    // Authorize the client
    await auth.authorize();

    const sheets = google.sheets({ version: 'v4', auth });

    // Test reading from the users sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1wjlhARQyUFwuBr4gLnPHchTlvrE2ub9eslXzd_yAUpA',
      range: 'Sheet1!A:D',
    });

    return NextResponse.json({
      success: true,
      data: response.data.values || [],
      message: 'Successfully fetched data from Google Sheets'
    });

  } catch (error) {
    console.error('Error in test-sheets API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test Google Sheets API', 
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
