import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, RATE_PER_LEAD } from '../../../lib/config';

const SUMMARY_RANGE = 'summary!A1:C1000';

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

export async function GET() {
  try {
    const sheets = await getGoogleSheetsClient();

    // Fetch summary sheet values (columns A-C)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
      range: SUMMARY_RANGE,
      majorDimension: 'ROWS',
    });

    const values: string[][] = (response.data.values as string[][]) || [];
    if (values.length === 0) {
      return NextResponse.json({
        totalLeads: 0,
        totalEarnings: 0,
        leads: []
      });
    }

    let totalLeads = 0;
    let totalEarnings = 0;
    const leads: Array<{utmId: string, count: number, earnings: number}> = [];

    // Parse summary rows (column B is label, C is value)
    for (const row of values) {
      const label = row[1]?.trim();
      const value = row[2]?.trim();
      if (!label) continue;
      if (label === 'LEADS' && value) totalLeads = parseInt(value) || 0;
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
        const count = parseInt(countStr) || 0;
        const earnings = count * RATE_PER_LEAD;
        totalEarnings += earnings;
        leads.push({
          utmId: label,
          count,
          earnings,
        });
      }
    }

    return NextResponse.json({
      totalLeads,
      totalEarnings,
      leads,
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
