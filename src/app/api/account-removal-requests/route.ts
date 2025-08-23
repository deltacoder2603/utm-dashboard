import { NextRequest, NextResponse } from 'next/server';
import { getAccountRemovalRequests } from '@/lib/account-removal-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    console.log('=== Account Removal Requests API Called ===');
    console.log('Username filter:', username);

    // Get account removal requests (filtered by username if provided)
    const requests = getAccountRemovalRequests(username || undefined);

    console.log(`Found ${requests.length} account removal requests`);

    return NextResponse.json({
      success: true,
      requests: requests
    });

  } catch (error) {
    console.error('Error fetching account removal requests:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch account removal requests', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
