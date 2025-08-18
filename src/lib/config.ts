// Google Service Account Configuration
export const googleConfig = {
  type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE || "service_account",
  project_id: process.env.GOOGLE_PROJECT_ID || "pickso-467011",
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY ? 
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').trim() : undefined,
  client_email: process.env.GOOGLE_CLIENT_EMAIL || "lead-gen@pickso-467011.iam.gserviceaccount.com",
  client_id: process.env.GOOGLE_CLIENT_ID || "114789240907474545639",
  auth_uri: process.env.GOOGLE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
  token_uri: process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.GOOGLE_CLIENT_X509_CERT_URL || "https://www.googleapis.com/robot/v1/metadata/x509/lead-gen%40pickso-467011.iam.gserviceaccount.com",
  universe_domain: process.env.GOOGLE_UNIVERSE_DOMAIN || "googleapis.com"
};

// Check if required credentials are available
export function validateGoogleConfig() {
  if (!googleConfig.private_key) {
    throw new Error('GOOGLE_PRIVATE_KEY environment variable is required');
  }
  if (!googleConfig.client_email) {
    throw new Error('GOOGLE_CLIENT_EMAIL environment variable is required');
  }
  if (!googleConfig.private_key_id) {
    throw new Error('GOOGLE_PRIVATE_KEY_ID environment variable is required');
  }
}

// Google Sheets IDs
export const SHEET_IDS = {
  UTM_SHEET_ID: process.env.UTM_SHEET_ID || '1HMROFgEXlyPU5gXCl60B3fAC0D3sR_uW5OD7srGf-Ig',
  USERS_SHEET_ID: process.env.USERS_SHEET_ID || '1wjlhARQyUFwuBr4gLnPHchTlvrE2ub9eslXzd_yAUpA'
};

// Rate per lead in rupees
export const RATE_PER_LEAD = parseInt(process.env.RATE_PER_LEAD || '45');
