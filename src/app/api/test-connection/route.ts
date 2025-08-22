import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, logGoogleConfigStatus } from '../../../lib/config';

export async function GET() {
  try {
    // Log configuration status
    logGoogleConfigStatus();
    
    // Check if required environment variables are set
    const missingVars = [];
    if (!process.env.GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
    if (!process.env.GOOGLE_CLIENT_EMAIL) missingVars.push('GOOGLE_CLIENT_EMAIL');
    if (!process.env.GOOGLE_PRIVATE_KEY_ID) missingVars.push('GOOGLE_PRIVATE_KEY_ID');
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required environment variables',
        missing: missingVars,
        config: {
          project_id: googleConfig.project_id,
          client_email: googleConfig.client_email,
          has_private_key: !!googleConfig.private_key,
          has_private_key_id: !!googleConfig.private_key_id
        }
      }, { status: 400 });
    }
    
    // Test Google Sheets API connection
    try {
      const jwtClient = new JWT({
        email: googleConfig.client_email,
        key: googleConfig.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      
      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });
      
      // Try to access the users sheet
      const response = await sheets.spreadsheets.get({
        spreadsheetId: SHEET_IDS.USERS_SHEET_ID,
      });
      
      return NextResponse.json({
        status: 'success',
        message: 'Google Sheets API connection successful',
        spreadsheet: {
          id: response.data.spreadsheetId,
          title: response.data.properties?.title,
          sheets: response.data.sheets?.map(s => s.properties?.title).filter(Boolean)
        },
        config: {
          project_id: googleConfig.project_id,
          client_email: googleConfig.client_email,
          utm_sheet_id: SHEET_IDS.UTM_SHEET_ID,
          users_sheet_id: SHEET_IDS.USERS_SHEET_ID
        }
      });
      
    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);
      
      let errorMessage = 'Unknown Google Sheets API error';
      let statusCode = 500;
      
      if (sheetsError instanceof Error) {
        if (sheetsError.message.includes('private key')) {
          errorMessage = 'Invalid private key format';
          statusCode = 401;
        } else if (sheetsError.message.includes('spreadsheet')) {
          errorMessage = 'Spreadsheet not found or access denied';
          statusCode = 403;
        } else if (sheetsError.message.includes('network') || sheetsError.message.includes('ENOTFOUND')) {
          errorMessage = 'Network error - unable to reach Google APIs';
          statusCode = 503;
        } else {
          errorMessage = sheetsError.message;
        }
      }
      
      return NextResponse.json({
        status: 'error',
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? sheetsError : undefined,
        config: {
          project_id: googleConfig.project_id,
          client_email: googleConfig.client_email,
          has_private_key: !!googleConfig.private_key,
          has_private_key_id: !!googleConfig.private_key_id
        }
      }, { status: statusCode });
    }
    
  } catch (error) {
    console.error('Test connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test connection',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
