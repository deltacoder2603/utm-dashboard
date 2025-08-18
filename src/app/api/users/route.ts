import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

// Service account credentials
const serviceAccountKey = {
  "type": "service_account",
  "project_id": "pickso-467011",
  "private_key_id": "9bd406ac4dfa04123af31effcb42c0db27648902",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvdiGzdh0CcD2P\nQ15eKsAL59sla88CeLuUgDtcaFrwogD8jHxrYhPq1GspC3C3+ThIgCcEbYEpt6ST\n++z0JhS8gfLyqIx1hQ6u67lFBP3q6GV45GrXDocrmmf54IbxlYuO9meKZf4HYbLm\nRI3Ddd20vbwkqyz/DqDS6l1CeOjONv6MyqiXAJyVt53KtgAVsgwv4oP+S4SsKBup\nPXkILlrM4PWygaIC+z8Nk6fPtxeA51d2XjWSqQalTn47277UORYOEbWQAHyb2FQo\nX/UF6yAgWRix/muR6hbzeb8StpPAFyt49GGoFjdXGQoTYQGwuIM0z17w+E6VqjLp\nMsOtPH9VAgMBAAECggEAI7WtIjMVsFtbi/6wBAY7U7D6XuFUHjKoKo72hdYPPA4c\nmUmWQNyTJSXaMV5MsISeOdMrHbGTqgPgEOYi0YW2jq773PsEqx5LYLpE2JEthFOL\n41DJlb81L2CbbLWPgTdoUc5AQGCFlMcDe+3T1EX2u0QqOGRGIhq+DG76T/7/kog0\ndPKzcgWnN9r5fCZdeklaa9IUL4TL0n0K3qya40w0ec9WzclzTKONjPDRdx+nL+xc\nB5vERzg2vsw1TzJGMTGiHILchSwFLHCDgoix+dS2/3NdRXW4DtEkPIZk3zX51dZ+\nTq9tA6faEPY/v45vL5JhBaZgu23J1Au/ZJbQcpFCOQKBgQDZ70H8vbenN1Qqgub3\ng53pHPFB3nhQIvD+f2riBWa0TBMaV4R8Qn3gl9l9rSlS0pPkNQXtaUvCTSQoJGI5\nVfFDZruuMSvHbCGhGZhOXIRDmmN1nZCoKeX/HcVJC8e8cGK9a5M9rwVS7OjLfBC6\nWfulMJwKFdJbaXncsTt3kdushwKBgQDOG7oHYwiFooVbultrmG9UdHkbtQPG4Rqa\n4oKtbjPxeMjufRwQ8danChWOIhJZebTqI5ljPloyXC17YGD3Pi2oFIbzrW+q7agJ\naEsdfxYoLhXx1U1f0j86AVaeEmTvupEStT+//ljB2ez6REeqc+t+2wXzgu0JcKPk\nIJWpDXzoQwKBgAUkGcBmkVCGg5vFHsGz/yOipSZSoy/wwxKd2t2eFwAl00WJzvxH\nbUTBEEZgsVrc0NRPU+Z312ur+jBgO1jy6BAY+lBvpIK90EVGn0sp74zQtYvuvZzZ\n8C0GfMLuXjXZyNqDESQhXtTH9e3m7VYYDVGmRegO/7lcUZ2dKLP3YuE9AoGAWMMY\nGpZL1UForVhUhsHfMD/46DXMqpnHG2zxWj9bn2KlJhA7RhDgoI93OP7zaBVCFJPA\nOz1fGtEXxUp8d/4PK5OrisXmkXZIJ8UClHFm2Wb/jGaQK/QfxptM8kZ5scRnNedY\nzRZ8ov93T1CYjI/fm4I3zedUrfwUmOpviZ6FbIECgYBchxk29pv5ruv859p902Q1\nsrk4dsEvBuWnSEbe8utq+a7Hds2P2jw3qtvoE8PSZL15pL76k8sz4xY0lDqZqkHr\nV92aCCDEHKV5AQ1CJ2MkPX0wLC3Dvdy1fuID/bjrEeDiwJz3pdJGN6CsLs0FHhPV\nHJXYBXg/JQTvwK1DLNdGnA==\n-----END PRIVATE KEY-----\n",
  "client_email": "lead-gen@pickso-467011.iam.gserviceaccount.com",
  "client_id": "114789240907474545639",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/lead-gen%40pickso-467011.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

const USERS_SHEET_ID = '1wjlhARQyUFwuBr4gLnPHchTlvrE2ub9eslXzd_yAUpA';

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

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: USERS_SHEET_ID,
      range: 'Sheet1!A:D',
    });
    
    const values = response.data.values || [];
    const users = [];
    
    // Skip header row, start from index 1
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (row.length >= 4 && row[1] && row[2] && row[3]) { // username, password, utmid
        users.push({
          id: row[0] || i.toString(),
          username: row[1],
          password: row[2],
          utmId: row[3],
          name: row[4] || '',
          email: row[5] || '',
          mobileNumber: row[6] || ''
        });
      }
    }
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users from Google Sheets' },
      { status: 500 }
    );
  }
}
