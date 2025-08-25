import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { googleConfig, SHEET_IDS, RATE_PER_LEAD } from '../../../lib/config';

// Use the summary sheet that we know works
const SUMMARY_RANGE = 'summary!A:C';
const DETAILED_RANGE = 'Sheet1!A:F';
const DISBURSAL_RANGE = 'DISBURSAL!A:F';

// Initialize Google Sheets API client
async function getGoogleSheetsClient() {
  try {
    const jwtClient = new JWT({
      email: googleConfig.client_email,
      key: googleConfig.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    await jwtClient.authorize();
    return google.sheets({ version: 'v4', auth: jwtClient });
  } catch (error) {
    console.error('Error initializing Google Sheets client:', error);
    throw new Error('Failed to initialize Google Sheets client');
  }
}

export async function GET() {
  try {
    // Validate Google config first
    if (!googleConfig.private_key) {
      console.error('Missing GOOGLE_PRIVATE_KEY environment variable');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete. Missing private key.' },
        { status: 500 }
      );
    }

    if (!googleConfig.client_email) {
      console.error('Missing GOOGLE_CLIENT_EMAIL environment variable');
      return NextResponse.json(
        { error: 'Google Sheets configuration is incomplete. Missing client email.' },
        { status: 500 }
      );
    }

    const sheets = await getGoogleSheetsClient();

    // Fetch data from the summary sheet first
    const summaryResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
      range: SUMMARY_RANGE,
      majorDimension: 'ROWS',
    });

    // Try to fetch from detailed sheet if it exists
    let detailedResponse;
    try {
      detailedResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
        range: 'Sheet1!A:F',
        majorDimension: 'ROWS',
      });
      console.log('Detailed sheet data fetched:', detailedResponse.data.values?.length || 0, 'rows');
      if (detailedResponse.data.values && detailedResponse.data.values.length > 0) {
        console.log('First row:', detailedResponse.data.values[0]);
        console.log('Second row:', detailedResponse.data.values[1]);
      }
    } catch (error) {
      console.log('Detailed sheet not accessible, continuing with summary data only');
      detailedResponse = { data: { values: [] } };
    }

    // Process detailed data for date-based line graph
    const dateBasedData: { [date: string]: { [utmId: string]: number } } = {};
    if (detailedResponse.data.values && detailedResponse.data.values.length > 1) {
      const rows = detailedResponse.data.values.slice(1); // Skip header
      rows.forEach((row: string[]) => {
        if (row.length >= 5) {
          const date = row[1]; // CREATEDDATE column (B)
          const utmId = row[4]; // UTM_Campaign__C column (E)
          
          if (date && utmId && utmId !== 'UTM_Campaign__C') {
            if (!dateBasedData[date]) {
              dateBasedData[date] = {};
            }
            if (!dateBasedData[date][utmId]) {
              dateBasedData[date][utmId] = 0;
            }
            dateBasedData[date][utmId]++;
          }
        }
      });
      console.log('Date-based data processed:', Object.keys(dateBasedData).length, 'dates');
    }

    const summaryValues: string[][] = (summaryResponse.data.values as string[][]) || [];
    const detailedValues: string[][] = (detailedResponse.data.values as string[][]) || [];

    if (summaryValues.length === 0) {
      console.log('No summary data found in Google Sheets');
      return NextResponse.json({
        totalLeads: 0,
        totalEarnings: 0,
        leads: []
      });
    }

    let totalLeads = 0;
    let totalEarnings = 0;
    const leads: Array<{utmId: string, count: number, earnings: number, ratePerLead?: number, products?: string[], cities?: string[]}> = [];

    // Fetch user rates from UTM table (summary sheet with rate column)
    const userRates: { [utmId: string]: number } = {};
    try {
      // Fetch from summary sheet which should now include rate column
      const summaryWithRatesResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
        range: 'summary!A:D', // UTM ID, Leads, Rate columns
      });
      
      if (summaryWithRatesResponse.data.values && summaryWithRatesResponse.data.values.length > 1) {
        summaryWithRatesResponse.data.values.slice(1).forEach((row: string[]) => {
          if (row.length >= 4 && row[1] && row[1] !== 'Row Labels' && row[1] !== 'Grand Total') {
            const utmId = row[1]; // UTM ID column (B)
            const rate = row[3] ? parseInt(row[3]) : null; // Rate column (D)
            if (utmId && rate && !isNaN(rate)) {
              userRates[utmId] = rate;
            }
          }
        });
      }
      console.log('User rates loaded from UTM table:', userRates);
    } catch (error) {
      console.log('Could not fetch user rates from UTM table, using default rate:', error);
    }

    // Function to insert new UTM ID with 0 leads to summary sheet
    const insertNewUTMToSummary = async (utmId: string) => {
      try {
        // Find the last row with data in summary sheet
        const summaryResponse = await sheets.spreadsheets.values.get({
          spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
          range: 'summary!A:Z',
        });
        
        const summaryRows = summaryResponse.data.values || [];
        const lastDataRow = summaryRows.length;
        
        // Insert new UTM ID with 0 leads before the Grand Total row
        const grandTotalRowIndex = summaryRows.findIndex(row => row[1] === 'Grand Total');
        const insertRow = grandTotalRowIndex > 0 ? grandTotalRowIndex : lastDataRow;
        
        // Insert the new row
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_IDS.UTM_SHEET_ID,
          range: `summary!A${insertRow + 1}`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [[utmId, 0]] // UTM ID with 0 leads
          }
        });
        
        console.log(`New UTM ID ${utmId} inserted to summary sheet with 0 leads`);
      } catch (error) {
        console.error('Error inserting UTM to summary sheet:', error);
      }
    };

    // Parse summary rows (column B is label, C is value)
    for (const row of summaryValues) {
      const label = row[1]?.trim();
      const value = row[2]?.trim();
      if (!label) continue;
      if (label === 'LEADS' && value) totalLeads = parseInt(value) || 0;
    }

    // Locate the "Row Labels" header row
    const headerIndex = summaryValues.findIndex(r => (r[1] || '').trim() === 'Row Labels');
    if (headerIndex !== -1) {
      // Rows after header until 'Grand Total' are UTM rows
      for (let i = headerIndex + 1; i < summaryValues.length; i++) {
        const label = summaryValues[i][1]?.trim();
        const countStr = summaryValues[i][2]?.trim(); // Column C: Number of Leads
        const rateStr = summaryValues[i][3]?.trim(); // Column D: Rate
        if (!label) continue;
        if (label === 'Grand Total') break;
        if (!countStr || isNaN(parseInt(countStr))) continue;
        const count = parseInt(countStr) || 0;
        
        // Get the rate from the UTM table (column D) or use default
        const rateFromSheet = summaryValues[i][3] ? parseInt(summaryValues[i][3]) : null; // Column D: Rate
        const rate = rateFromSheet || userRates[label] || RATE_PER_LEAD;
        const earnings = count * rate;
        totalEarnings += earnings;
        
        // Get additional details from detailed sheet
        const detailed = detailedValues.slice(1).reduce((acc: { products?: Set<string>, cities?: Set<string> }, row: string[]) => {
          if (row.length >= 5) {
            const utmId = row[4]; // UTM_Campaign__C column
            if (utmId === label) {
              if (!acc.products) acc.products = new Set<string>();
              if (!acc.cities) acc.cities = new Set<string>();
              if (row[5]) acc.products.add(row[5]); // PRODUCT NAME
              if (row[6]) acc.cities.add(row[6]); // SOURCING CITY
            }
          }
          return acc;
        }, {});

        leads.push({
          utmId: label,
          count,
          earnings,
          ratePerLead: rate, // Include the rate per lead
          products: detailed.products ? Array.from(detailed.products) : [],
          cities: detailed.cities ? Array.from(detailed.cities) : []
        });
      }
    }

    console.log(`Successfully fetched UTM data: ${totalLeads} total leads, ${leads.length} UTM campaigns`);
    return NextResponse.json({
      totalLeads,
      totalEarnings,
      leads,
      dateBasedData,
    });
  } catch (error) {
    console.error('Error fetching UTM data from Google Sheets:', error);
    
    // Try to provide fallback data for basic functionality
    console.log('Attempting to provide fallback UTM data...');
    
    // Return fallback data for basic functionality
    const fallbackData = {
      totalLeads: 0,
      totalEarnings: 0,
      leads: [],
      dateBasedData: []
    };
    
    console.log('Returning fallback UTM data:', fallbackData);
    return NextResponse.json(fallbackData);
    
    // Note: The original error handling code is commented out to allow fallback functionality
    // Uncomment the code below if you want to see detailed error messages instead of fallback data
    /*
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch UTM data from Google Sheets';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('private key')) {
        errorMessage = 'Google Sheets authentication failed: Invalid private key';
        statusCode = 401;
      } else if (error.message.includes('spreadsheet')) {
        errorMessage = 'Google Sheets access failed: Check spreadsheet ID and permissions';
        statusCode = 403;
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Network error: Unable to connect to Google Sheets API';
        statusCode = 503;
      } else {
        errorMessage = `Google Sheets error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
    */
  }
}
