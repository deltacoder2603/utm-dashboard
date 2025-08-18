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

const UTM_SHEET_ID = '1HMROFgEXlyPU5gXCl60B3fAC0D3sR_uW5OD7srGf-Ig';
const SUMMARY_RANGE = 'summary!A1:C1000';

// Rate per lead in rupees
const RATE_PER_LEAD = 45;

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

    // Fetch summary sheet values (columns A-C)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: UTM_SHEET_ID,
      range: SUMMARY_RANGE,
      majorDimension: 'ROWS',
    });

    const values: string[][] = (response.data.values as string[][]) || [];
    if (values.length === 0) {
      return NextResponse.json({
        totalLeads: 0,
        totalDisbursals: 0,
        conversionRate: '0%',
        dailyAverage: 0,
        utmData: []
      });
    }

    let totalLeads = 0;
    let totalDisbursals = 0;
    let conversionRate = '0%';
    let dailyAverage = 0;
    const utmData: Array<{utmId: string, leadCount: number, earnings: number}> = [];

    // Parse summary rows (column B is label, C is value)
    for (const row of values) {
      const label = row[1]?.trim();
      const value = row[2]?.trim();
      if (!label) continue;
      if (label === 'LEADS' && value) totalLeads = parseInt(value) || 0;
      if (label === 'DISBURSALS' && value) totalDisbursals = parseInt(value) || 0;
      if (label === 'CONVERSION %' && value) conversionRate = value;
      if (label === 'CURRENT PER DAY AVERAGE' && value) dailyAverage = parseInt(value) || 0;
    }

    // Locate the "Row Labels" header row
    const headerIndex = values.findIndex(r => (r[1] || '').trim() === 'Row Labels');
    if (headerIndex !== -1) {
      // Rows after header until 'Grand Total' are UTM rows
      for (let i = headerIndex + 1; i < values.length; i++) {
        const label = values[i][1]?.trim();
        const countStr = values[i][2]?.trim();
        if (!label) continue;
        if (label === 'Grand Total') break;
        if (!countStr || isNaN(parseInt(countStr))) continue;
        const leadCount = parseInt(countStr) || 0;
        utmData.push({
          utmId: label,
          leadCount,
          earnings: leadCount * RATE_PER_LEAD,
        });
      }
    }

    return NextResponse.json({
      totalLeads,
      totalDisbursals,
      conversionRate,
      dailyAverage,
      utmData,
    });
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Failed to fetch UTM data from Google Sheets', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
