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

    // Test reading from the UTM data sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1HMROFgEXlyPU5gXCl60B3fAC0D3sR_uW5OD7srGf-Ig',
      range: 'summary!A1:C1000',
    });

    return NextResponse.json({
      success: true,
      data: response.data.values || [],
      message: 'Successfully fetched UTM data from Google Sheets'
    });

  } catch (error) {
    console.error('Error in test-utm API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Failed to test UTM data API', 
        details: errorMessage,
        stack: errorStack
      },
      { status: 500 }
    );
  }
}
