import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

// Load service account credentials
const serviceAccountKey = {
  "type": "service_account",
  "project_id": "pickso-467011",
  "private_key_id": "9bd406ac4dfa04123af31effcb42c0db27648902",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvdiGzdh0CcD2P\nQ15eKsAL59sla88CeLuUgDtcaFrwogD8jHxrYhPq1GspC3C3+ThIgCcEbYEpt6ST\n++z0JhS8gfLyqIx1hQ6u67lFBP3q6GV45GrXDocrmmf54IbxlYuO9meKZf4HYbLm\nRI3Ddd20vbwkqyz/DqDS6l1CeOjONv6MyqiXAJyVt53KtgAVsgwv4oP+S4SsKBup\nPXkILlrM4PWygaIC+z8Nk6fPtxeA51d2XjWSqQalTn47277UORYOEbWQAHyb2FQo\nX/UF6yAgWRix/muR6hbzeb8StpPAFyt49GGoFjdXGQoTYQGwuIM0z17w+E6VqjLp\nMsOtPH9VAgMBAAECggEAI7WtIjMVsFtbi/6wBAY7U7D6XuFUHjKoKo72hdYPPA4c\nmUmWQNyTJSXaMV5MsISeOdMrHbGTqgPgEOYi0YW2jq773PsEqx5LYLpE2JEthFOL\n41DJlb81L2CbbLWPgTdoUc5AQGCFlMcDe+3T1EX2u0QqOGRGIhq+DG76T/7/kog0\ndPKzcgWnN9r5fCZdeklaa9IUL4TL0n0K3qya40w0ec9WzclzTKONjPDRdx+nL+xc\nB5vERzg2vsw1TzJGMTGiHILchSwFLHCDgoix+dS2/3NdRXW4DtEkPIZk3zX51dZ+\nTq9tA6faEPY/v45vL5JhBaZgu23J1Au/ZJbQcpFCOQKBgQDZ70H8vbenN1Qqgub3\ng53pHPFB3nhQIvD+f2riBWa0TBMaV4R8Qn3gl9l9rSlS0pPkNQXtaUvCTSQoJGI5\nVfFDZruuMSvHbCGhGZhOXIRDmmN1nZCoKeX/HcVJC8e8cGK9a5M9rwVS7OjLfBC6\nWfulMJwKFdJbaXncsTt3kdushwKBgQDOG7oHYwiFooVbultrmG9UdHkbtQPG4Rqa\n4oKtbjPxeMjufRwQ8danChWOIhJZebTqI5ljPloyXC17YGD3Pi2oFIbzrW+q7agJ\naEsdfxYoLhXx1U1f0j86AVaeEmTvupEStT+//ljB2ez6REeqc+t+2wXzgu0JcKPk\nIJWpDXzoQwKBgAUkGcBmkVCGg5vFHsGz/yOipSZSoy/wwxKd2t2eFwAl00WJzvxH\nbUTBEEZgsVrc0NRPU+Z312ur+jBgO1jy6BAY+lBvpIK90EVGn0sp74zQtYvuvZzZ\n8C0GfMLuXjXZyNqDESQhXtTH9e3m7VYYDVGmRegO/7lcUZ2dKLP3YuE9AoGAWMMY\nGpZL1UForVhUhsHfMD/46DXMqpnHG2zxWj9bn2KlJhA7RhDgoI93OP7zaBVCFJPA\nOz1fGtEXxUp8d/4PK5OrisXmkXZIJ8UClHFm2Wb/jGaQn/QfxptM8kZ5scRnNedY\nzRZ8ov93T1CYjI/fm4I3zedUrfwUmOpviZ6FbIECgYBchxk29pv5ruv859p902Q1\nsrk4dsEvBuWnSEbe8utq+a7Hds2P2jw3qtvoE8PSZL15pL76k8sz4xY0lDqZqkHr\nV92aCCDEHKV5AQ1CJ2MkPX0wLC3Dvdy1fuID/bjrEeDiwJz3pdJGN6CsLs0FHhPV\nHJXYBXg/JQTvwK1DLNdGnA==\n-----END PRIVATE KEY-----\n",
  "client_email": "lead-gen@pickso-467011.iam.gserviceaccount.com",
  "client_id": "114789240907474545639",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/lead-gen%40pickso-467011.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const SPREADSHEET_ID = '1wjlhARQyUFwuBr4gLnPHchTlvrE2ub9eslXzd_yAUpA';

// Initialize Google Sheets API client
async function getGoogleSheetsClient() {
  const jwtClient = new JWT({
    email: serviceAccountKey.client_email,
    key: serviceAccountKey.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  await jwtClient.authorize();
  
  return google.sheets({ version: 'v4', auth: jwtClient });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, utmId } = body;

    // Validation
    if (!username || !utmId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    try {
      // First, find and remove user from User_Registrations sheet
      const registrationsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'User_Registrations!A:G',
      });

      const registrationsData = registrationsResponse.data.values || [];
      let userRowIndex = -1;

      // Find the row containing the user's data
      for (let i = 0; i < registrationsData.length; i++) {
        if (registrationsData[i][4] === username && registrationsData[i][6] === utmId) {
          userRowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }

      if (userRowIndex > 0) {
        // Delete the user's registration row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 99552550, // User_Registrations sheet ID
                    dimension: 'ROWS',
                    startIndex: userRowIndex - 1,
                    endIndex: userRowIndex
                  }
                }
              }
            ]
          }
        });
      }

      // Now find and remove user from Sheet1
      const sheet1Response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:D',
      });

      const sheet1Data = sheet1Response.data.values || [];
      let utmRowIndex = -1;

      // Find the row containing the user's UTM data
      for (let i = 0; i < sheet1Data.length; i++) {
        if (sheet1Data[i][1] === utmId) {
          utmRowIndex = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }

      if (utmRowIndex > 0) {
        // Delete the user's UTM data row
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                deleteDimension: {
                  range: {
                    sheetId: 0, // Sheet1 sheet ID
                    dimension: 'ROWS',
                    startIndex: utmRowIndex - 1,
                    endIndex: utmRowIndex
                  }
                }
              }
            ]
          }
        });
      }

      console.log(`User ${username} with UTM ID ${utmId} withdrawn successfully`);

      return NextResponse.json({
        success: true,
        message: 'User withdrawn successfully',
        data: {
          username,
          utmId,
          withdrawnAt: new Date().toISOString()
        }
      });

    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to remove user data from Google Sheets' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
