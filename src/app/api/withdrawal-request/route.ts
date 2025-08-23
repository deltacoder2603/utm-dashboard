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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, amount, bankDetails } = body;

    console.log('=== Withdrawal Request POST ===');
    console.log('Request body:', { username, amount, bankDetails });

    if (!username || !amount || !bankDetails) {
      return NextResponse.json({ error: 'Username, amount, and bank details are required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // First, ensure proper headers exist in Sheet3 (withdrawal requests only)
    // Check if headers exist, if not create them
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet3!A1:I1',
    });

    const existingHeaders = headersResponse.data.values?.[0] || [];
    
    // If headers don't exist or are incomplete, create them
    if (existingHeaders.length === 0 || !existingHeaders[0]) {
      const withdrawalHeaders = [
        'Username', 'Amount', 'Account Holder Name', 'Account Number', 'Bank Name', 'IFSC Code', 'Status', 'Timestamp', 'Approved'
      ];

      // Set withdrawal request headers (A1:I1)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet3!A1:I1',
        valueInputOption: 'RAW',
        requestBody: { values: [withdrawalHeaders] }
      });

      console.log('Created headers for withdrawal requests in Sheet3');
    }

    // Add withdrawal request to Sheet3 (withdrawal requests section) - columns A:I
    // First, find the next available row in the withdrawal requests section
    const withdrawalResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet3!A:I', // Withdrawal requests section
    });

    const withdrawalRows = withdrawalResponse.data.values || [];
    const nextRow = withdrawalRows.length + 1; // +1 because we want to append after existing rows

    console.log('Current withdrawal rows:', withdrawalRows.length);
    console.log('Next row to insert:', nextRow);

    // Insert the withdrawal request at the next available row
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: `Sheet3!A${nextRow}`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          username, 
          amount, 
          bankDetails.accountHolderName,
          bankDetails.accountNumber,
          bankDetails.bankName,
          bankDetails.ifscCode,
          'Pending', // Status
          new Date().toISOString(), // Timestamp
          '' // Approved column (empty initially)
        ]]
      }
    });

    // Also save/update bank details in Sheet4
    const bankDetailsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet4!A:G',
    });

    const bankRows = bankDetailsResponse.data.values || [];
    let bankRowIndex = -1;

    // Find if user already has bank details
    for (let i = 1; i < bankRows.length; i++) {
      if (bankRows[i][0] === username) {
        bankRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (bankRowIndex !== -1) {
      // Update existing bank details
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: `Sheet4!A${bankRowIndex}:G${bankRowIndex}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            username,
            bankDetails.accountHolderName,
            bankDetails.accountNumber,
            bankDetails.bankName,
            bankDetails.ifscCode,
            new Date().toISOString(),
            'Yes' // Approved by default when user provides details
          ]]
        }
      });
    } else {
      // Add new bank details
      const nextBankRow = bankRows.length + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: `Sheet4!A${nextBankRow}:G${nextBankRow}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[
            username,
            bankDetails.accountHolderName,
            bankDetails.accountNumber,
            bankDetails.bankName,
            bankDetails.ifscCode,
            new Date().toISOString(),
            'Yes' // Approved by default when user provides details
          ]]
        }
      });
    }

    return NextResponse.json({ success: true, message: 'Withdrawal request submitted successfully' });

  } catch (error) {
    console.error('Error submitting withdrawal request:', error);
    return NextResponse.json(
      { error: 'Failed to submit withdrawal request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log('=== Withdrawal Request GET ===');
    console.log('Username:', username);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // Read withdrawal requests from Sheet3
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet3!A:I', // Withdrawal requests section
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ withdrawalRequests: [] });
    }

    // Skip header row and filter user's withdrawal requests
    const userRequests = rows.slice(1)
      .filter(row => row[0] === username)
      .map(row => ({
        username: row[0] || '',
        amount: row[1] || '',
        accountHolderName: row[2] || '',
        accountNumber: row[3] || '',
        bankName: row[4] || '',
        ifscCode: row[5] || '',
        status: row[6] || 'Pending',
        timestamp: row[7] || '',
        approved: row[8] || '' // Approved column
      }));

    console.log('Raw rows from sheet:', rows);
    console.log('Filtered user requests:', userRequests);

    return NextResponse.json({ withdrawalRequests: userRequests });

  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch withdrawal requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
