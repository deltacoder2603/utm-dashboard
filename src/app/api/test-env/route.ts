import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    GOOGLE_PRIVATE_KEY_ID: process.env.GOOGLE_PRIVATE_KEY_ID ? 'SET' : 'NOT SET',
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'SET' : 'NOT SET',
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? 'SET' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    PWD: process.env.PWD,
    CWD: process.cwd()
  });
}
