import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, logGoogleConfigStatus } from '../../../lib/config';

// Initialize Google Sheets API client
async function getGoogleSheetsClient() {
  try {
    // Test basic network connectivity first
    try {
      const testResponse = await fetch('https://googleapis.com', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      console.log('Basic Google APIs connectivity test: SUCCESS');
    } catch (networkError) {
      console.error('Basic Google APIs connectivity test: FAILED', networkError);
      throw new Error(`Network connectivity issue: Unable to reach Google APIs. This may be due to DNS issues, network restrictions, or firewall settings. Error: ${networkError instanceof Error ? networkError.message : String(networkError)}`);
    }

    const jwtClient = new JWT({
      email: googleConfig.client_email,
      key: googleConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    console.log('Attempting to authorize JWT client...');
    await jwtClient.authorize();
    console.log('JWT client authorization: SUCCESS');
    
    return google.sheets({ version: 'v4', auth: jwtClient });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Network connectivity issue')) {
        throw error; // Re-throw network issues as-is
      } else if (error.message.includes('invalid_grant') || error.message.includes('unauthorized_client')) {
        throw new Error('Google authentication failed: Invalid service account credentials. Please check your private key and client email.');
      } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        throw new Error('DNS resolution failed: Unable to resolve Google API endpoints. This may be due to network restrictions or DNS configuration issues.');
      } else {
        throw new Error(`Failed to initialize Google Sheets client: ${error.message}`);
      }
    } else {
      throw new Error('Failed to initialize Google Sheets client: Unknown error occurred');
    }
  }
}

export async function GET() {
  try {
    // Log configuration status for debugging
    logGoogleConfigStatus();
    
    // Validate Google config first with more detailed error messages
    if (!googleConfig.private_key) {
      console.error('Missing GOOGLE_PRIVATE_KEY environment variable');
      return NextResponse.json(
        { 
          error: 'Google Sheets configuration is incomplete. Missing private key.',
          solution: 'Please add GOOGLE_PRIVATE_KEY to your .env file. See env-template.txt for reference.',
          missing: 'GOOGLE_PRIVATE_KEY'
        },
        { status: 500 }
      );
    }

    if (!googleConfig.client_email) {
      console.error('Missing GOOGLE_CLIENT_EMAIL environment variable');
      return NextResponse.json(
        { 
          error: 'Google Sheets configuration is incomplete. Missing client email.',
          solution: 'Please add GOOGLE_CLIENT_EMAIL to your .env file. See env-template.txt for reference.',
          missing: 'GOOGLE_CLIENT_EMAIL'
        },
        { status: 500 }
      );
    }

    if (!googleConfig.private_key_id) {
      console.error('Missing GOOGLE_PRIVATE_KEY_ID environment variable');
      return NextResponse.json(
        { 
          error: 'Google Sheets configuration is incomplete. Missing private key ID.',
          solution: 'Please add GOOGLE_PRIVATE_KEY_ID to your .env file. See env-template.txt for reference.',
          missing: 'GOOGLE_PRIVATE_KEY_ID'
        },
        { status: 500 }
      );
    }

    const sheets = await getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      range: 'Sheet1!A:D',
    });
    
    const values = response.data.values || [];
    const users = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row && row.length >= 4 && row[0] && row[1]) { // username, password, utmId, name
        users.push({
          username: row[0],
          password: row[1],
          utmId: row[2] || '',
          name: row[3] || ''
        });
      }
    }
    
    console.log(`Successfully fetched ${users.length} users from Google Sheets`);
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users from Google Sheets:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch users from Google Sheets';
    let statusCode = 500;
    let details = '';
    let solution = '';
    
    if (error instanceof Error) {
      if (error.message.includes('private key')) {
        errorMessage = 'Google Sheets authentication failed: Invalid private key';
        statusCode = 401;
        details = 'Check your GOOGLE_PRIVATE_KEY in .env file';
        solution = 'Verify the private key format and content';
      } else if (error.message.includes('spreadsheet')) {
        errorMessage = 'Google Sheets access failed: Check spreadsheet ID and permissions';
        statusCode = 403;
        details = 'Verify USERS_SHEET_ID and ensure service account has access';
        solution = 'Share the spreadsheet with your service account email';
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
        errorMessage = 'Network error: Unable to connect to Google Sheets API';
        statusCode = 503;
        details = 'DNS resolution failed for Google APIs. This may be due to network restrictions, VPN, or firewall settings.';
        solution = 'Check your network connection, disable VPN if using one, or contact your network administrator. You can also try using a different network.';
      } else if (error.message.includes('Failed to initialize Google Sheets client')) {
        errorMessage = 'Google Sheets client initialization failed';
        statusCode = 500;
        details = 'The Google Sheets client could not be initialized, likely due to network connectivity issues';
        solution = 'Check your internet connection and try again. If the issue persists, there may be network restrictions blocking Google APIs.';
      } else {
        errorMessage = `Google Sheets error: ${error.message}`;
        details = 'Review the error details below';
        solution = 'Check the error message and verify your configuration';
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: details,
        solution: solution,
        timestamp: new Date().toISOString(),
        networkInfo: {
          dnsIssue: error instanceof Error && (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')),
          googleApisReachable: false,
          suggestion: 'Try visiting https://googleapis.com in your browser to test connectivity'
        }
      },
      { status: statusCode }
    );
  }
}
