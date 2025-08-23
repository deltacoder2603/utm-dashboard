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

export async function GET(request: Request) {
  try {
    console.log('=== Admin Withdrawal Requests GET ===');
    
    const sheets = await getGoogleSheetsClient();
    
    // Read all withdrawal requests from Sheet3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet3!A:I', // Withdrawal requests section
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ withdrawalRequests: [] });
    }

    // Skip header row and map all withdrawal requests
    const withdrawalRequests = rows.slice(1)
      .filter(row => row[0] && row[1]) // Must have username and amount
      .map(row => ({
        username: row[0] || '',
        amount: row[1] || '',
        accountHolderName: row[2] || '',
        accountNumber: row[3] || '',
        bankName: row[4] || '',
        ifscCode: row[5] || '',
        status: row[6] || 'Pending',
        timestamp: row[7] || '',
        approved: row[8] || '', // Approved column
        rowIndex: rows.indexOf(row) + 1 // For updating status later
      }));

    console.log('Raw rows from sheet:', rows);
    console.log('Mapped withdrawal requests:', withdrawalRequests);

    return NextResponse.json({ withdrawalRequests });

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
