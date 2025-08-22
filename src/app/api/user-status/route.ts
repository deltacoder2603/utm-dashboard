import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, validateGoogleConfig, logGoogleConfigStatus } from '@/lib/config';

async function getGoogleSheetsClient() {
  try {
    logGoogleConfigStatus();
    
    // Check essential environment variables
    if (!googleConfig.private_key || !googleConfig.client_email) {
      throw new Error('Missing essential Google configuration');
    }

    // Test basic connectivity first
    try {
      await fetch('https://googleapis.com', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    } catch (networkError) {
      console.error('Network connectivity test failed:', networkError);
      throw new Error(`Network error: Cannot reach Google APIs. Check internet connection.`);
    }

    const jwtClient = new JWT({
      email: googleConfig.client_email,
      key: googleConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    try {
      await jwtClient.authorize();
    } catch (authError) {
      console.error('JWT authorization failed:', authError);
      if (authError instanceof Error) {
        if (authError.message.includes('invalid_grant')) {
          throw new Error('Invalid private key or client email. Please check your Google Service Account credentials.');
        } else if (authError.message.includes('unauthorized_client')) {
          throw new Error('Unauthorized client. Please verify your Google Service Account has the correct permissions.');
        }
      }
      throw new Error(`Authentication failed: ${authError instanceof Error ? authError.message : 'Unknown auth error'}`);
    }
    
    return google.sheets({ version: 'v4', auth: jwtClient });
  } catch (error) {
    console.error('Error creating Google Sheets client:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username parameter is required' },
        { status: 400 }
      );
    }

    console.log('=== Checking User Status ===');
    console.log('Username:', username);

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    // Check if user is in approved users (Sheet1)
    let isApproved = false;
    try {
      const approvedResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'Sheet1!A:D',
      });

      const approvedUsers = approvedResponse.data.values || [];
      
      // Check if username exists in approved users (column A)
      for (let i = 1; i < approvedUsers.length; i++) {
        if (approvedUsers[i][0] === username) {
          isApproved = true;
          break;
        }
      }
    } catch (error) {
      console.error('Error checking approved users:', error);
    }

    // Check if user is in pending registrations
    let isPending = false;
    try {
      const pendingResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
        range: 'User_Registrations!A:G',
      });

      const pendingUsers = pendingResponse.data.values || [];
      
      // Check if username exists in pending registrations (column E)
      for (let i = 1; i < pendingUsers.length; i++) {
        if (pendingUsers[i][4] === username) {
          isPending = true;
          break;
        }
      }
    } catch (error) {
      console.error('Error checking pending users:', error);
    }

    let status = 'not_found';
    let message = 'User not found in system';

    if (isApproved) {
      status = 'approved';
      message = 'User is approved and can access the system';
    } else if (isPending) {
      status = 'pending';
      message = 'User registration is pending admin approval';
    }

    console.log('User status result:', { username, status, isApproved, isPending });

    return NextResponse.json({
      username,
      status,
      message,
      isApproved,
      isPending
    });

  } catch (error) {
    console.error('User status check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Failed to check user status', 
        details: errorMessage,
        solution: 'Check Google Sheets API credentials and sheet permissions'
      },
      { status: 500 }
    );
  }
}
