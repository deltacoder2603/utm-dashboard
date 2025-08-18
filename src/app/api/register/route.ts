import { NextRequest, NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';

// Service account credentials
const serviceAccountKey = {
  "type": "service_account",
  "project_id": "pickso-467011",
  "private_key_id": "5408c3c92722c444d34f11dc6ab5e9cc02268800",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDJ7HPj+5oBNv/c\nOwGBQA6KFQC5NcNv1cILbXEb/bvtFuIl7ngzIqolGodAghIIMiH9SGeSMrlzci66\nGtkDGh7/8gaqlJxOy692Pr8VOvoL/yGcWnPi6tV9r34KkgneADJNMTV3awvCRrTt\n72HEBofy+BNuPS899ghrbwkFpGYMSAnU03b7C46ro6jmRmLWDshBYcI55UNJIVSw\nRg/L6+Z/c+njQF3WZj/r85jTNuT7eeHeq3HBMfgpGLM5wIhv3q5gXLNRQdzCBUw0\nVkmjD1QWw3StHniODr9yN1f4a+mVy6/8cZvBJa/Ny9jnPLuUcv5VQwXn+icUOd16\ndW1ra0sdAgMBAAECggEAAuINOjGZycRUKXCf0vqt8ByCVXGyb/bpKeWxpQwnFP9E\nbLj00Yo1CFE0bW1naZgaePxy2vGQ9lDZfsw/XTsbSjtgzwSLB8lkVVifCAXoRFF+\nkLJMc6q3ipjQooStqHndCUpv4lvquDm6meueXgKQRhZU0QsrJ4X0mqwzZjtqNw6e\n23DqJ856VxPKpIyyxseGQLiWI68lMacGb8d/KBRtS7F5s4SJRGnBhQUXVKbKRHJN\nWJ+7PGwNRACHDkV4bbD6Z7RGr6xS6H1ZeNwiXbx9Zc/wwdhXVOEZkL/VOseHU5/C\ndS7LLIpVZLWx7s/h+VJ77aQ+vN6STOjzPnXFu4ZWMQKBgQD3KrUt3LcBWV/YD2Gp\nbI8tMXzrNrAXiiyh/ReaSPZn3PBrboUS876lDt6IQ+vLZWLQdE/yfNg5yeO1cctG\nukUJT1Gro9i0dkwpozW99yjY1W0TLGRuUtfFRnWZ00VvNJb1NXtZ4M45jSnuS+M3\n1qCcarqFdKOqq+UVOAIsn7zDUQKBgQDRI9JlOrC+F9KB0AE2dHv63Nd35UGzXwMX\n4CkMkw69JwxXBnjMLDDQizOWFXEw2UnrUJASbiqq7bSOGbJd1yf1pOH/eLwTchZl\n53+3PkewQqQYsvqx2NTCR6qO3lZrSmwlA0BE8oFAC+UL+nWMHknWvTo4hb6SNgLl\n0Lj08GdgDQKBgDn1gdbnUuK2GouHz9by5gArAqgFgvWCKUUzHD3Jrj5cyOPoXrw6\n/BGokvZRNxHTDIDlRXoPXITwmr0JmilTtKyiNPySx1ZKB0IcS5XoR2PRaGp+lm5o\nbsCL7TfNGxMgueV2TR6eYL2OJK8EjJujcLY9MM/qshZriKSZJalhK9qBAoGBAJZJ\nzqyN82p3Bf/g8K4oINvSDUiMR51VXoyuufDeUI4e3GBBN1dJPj7ueUCV4gQ/cT4X\nY6DK6ABy1vfygVmr/nwoY3tJUKYMqwnJxN5yc+O2z+Mr4rkg3ytJgsguAB4Tmgky\n/+FL/xN+OLdV4Viyf09AJfFuMtcw1v488lyZ0T+VAoGAQ0ctZ8qKTbtu2CepPMrA\nqeuIDPmjc5F6E2duqdLSx8knh/pVovEeSuBv8pstUu0fEUjT0y6+uivkkcqiKbfu\n01FXbH6UgelnCCXSB+u6kbqDtA1N2RKIJ3kmDjV6myoY+uL+fJWShXUbdQSg7VJQ\no/DJAlSY0iDWlGipyabOsro=\n-----END PRIVATE KEY-----\n",
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
    const { name, email, socialMediaLink, mobileNumber, username, password } = body;

    // Validation
    if (!name || !email || !mobileNumber || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Google Sheets client
    const sheets = await getGoogleSheetsClient();

    try {
      // Add user to User_Registrations sheet only
      const registrationData = [
        [name, email, socialMediaLink || '', mobileNumber, username, password, ''] // Empty UTM ID field
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'User_Registrations!A:G',
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: registrationData
        }
      });

      console.log(`User ${username} registered successfully`);

      return NextResponse.json({
        success: true,
        message: 'Registration successful, we will come back to you soon',
        user: {
          username: username,
          name: name,
          email: email
        }
      });

    } catch (sheetsError) {
      console.error('Google Sheets API error:', sheetsError);
      return NextResponse.json(
        { error: 'Failed to save user data to Google Sheets' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
