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
    const { username, bankDetails } = await request.json();

    console.log('=== Bank Details POST ===');
    console.log('Username:', username);
    console.log('Bank Details:', bankDetails);

    if (!username || !bankDetails) {
      return NextResponse.json({ error: 'Username and bank details are required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // First, ensure proper headers exist in Sheet4 (bank details)
    // Check if headers exist, if not create them
    const headersResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet4!A1:G1',
    });

    const existingHeaders = headersResponse.data.values?.[0] || [];
    
    // If headers don't exist or are incomplete, create them
    if (existingHeaders.length === 0 || !existingHeaders[0]) {
      const bankDetailsHeaders = [
        'Username', 'Account Holder Name', 'Account Number', 'Bank Name', 'IFSC Code', 'Last Updated', 'Approved'
      ];

      // Set bank details headers (A1:G1)
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet4!A1:G1',
        valueInputOption: 'RAW',
        requestBody: { values: [bankDetailsHeaders] }
      });

      console.log('Created headers for bank details in Sheet4');
    }

    // Check if user already has bank details
    const existingResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet4!A:G',
    });

    const existingRows = existingResponse.data.values || [];
    let userRowIndex = -1;

    // Find if user already exists
    for (let i = 1; i < existingRows.length; i++) {
      if (existingRows[i][0] === username) {
        userRowIndex = i + 1; // +1 because sheet rows are 1-indexed
        break;
      }
    }

    if (userRowIndex !== -1) {
      // Update existing bank details
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: `Sheet4!A${userRowIndex}:G${userRowIndex}`,
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
      console.log(`Updated bank details for user ${username} at row ${userRowIndex}`);
    } else {
      // Add new bank details
      const nextRow = existingRows.length + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: `Sheet4!A${nextRow}:G${nextRow}`,
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
      console.log(`Added new bank details for user ${username} at row ${nextRow}`);
    }

    return NextResponse.json({ success: true, message: 'Bank details saved successfully' });

  } catch (error) {
    console.error('Error saving bank details:', error);
    return NextResponse.json(
      { error: 'Failed to save bank details', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log('=== Bank Details GET ===');
    console.log('Username:', username);

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const sheets = await getGoogleSheetsClient();
    
    // Read bank details from Sheet4
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet4!A:G',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json({ bankDetails: null });
    }

    // Skip header row and find user's bank details
    const userRow = rows.slice(1).find(row => row[0] === username);
    
    if (!userRow) {
      return NextResponse.json({ bankDetails: null });
    }

    const bankDetails = {
      username: userRow[0] || '',
      accountHolderName: userRow[1] || '',
      accountNumber: userRow[2] || '',
      bankName: userRow[3] || '',
      ifscCode: userRow[4] || '',
      timestamp: userRow[5] || '',
      approved: userRow[6] || ''
    };

    console.log('Found bank details:', bankDetails);

    return NextResponse.json({ bankDetails });

  } catch (error) {
    console.error('Error fetching bank details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bank details', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
