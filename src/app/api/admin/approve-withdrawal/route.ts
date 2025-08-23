import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS } from '../../../../lib/config';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, amount, status, rowIndex } = body;

    if (!username || !amount || !status || !rowIndex) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['Approved', 'Rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Must be "Approved" or "Rejected"' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // Update the status in Sheet3 (columns A-I)
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: `Sheet3!G${rowIndex}`, // Status column (G) - 7th column in A:I range
      valueInputOption: 'RAW',
      requestBody: {
        values: [[status]]
      }
    });

    // Also update the approved column
    const approvedValue = status === 'Approved' ? 'Yes' : '';
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: `Sheet3!I${rowIndex}`, // Approved column (I) - 9th column in A:I range
      valueInputOption: 'RAW',
      requestBody: {
        values: [[approvedValue]]
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      rowIndex: rowIndex,
      status: status,
      approved: approvedValue
    });

  } catch (error) {
    console.error('Error updating withdrawal status:', error);
    return NextResponse.json(
      { error: 'Failed to update withdrawal status', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
