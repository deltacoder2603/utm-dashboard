import { NextRequest, NextResponse } from 'next/server';
import { addAccountRemovalRequest } from '@/lib/account-removal-store';

export async function POST(request: NextRequest) {
  try {
    console.log('=== Account Removal Request API Called ===');
    
    const body = await request.json();
    const { username, utmId, reason } = body;

    console.log('Request body:', body);

    // Validate required fields
    if (!username || !utmId) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Username and UTM ID are required' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the request
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`Processing account removal request for user: ${username}, UTM ID: ${utmId}`);

    // Create the account removal request
    const accountRemovalRequest = {
      id: requestId,
      username,
      utmId,
      status: 'pending' as const,
      timestamp: new Date().toISOString(),
      reason: reason || undefined
    };

    // Add to in-memory storage
    addAccountRemovalRequest(accountRemovalRequest);

    console.log(`Account removal request submitted for user ${username}:`, {
      requestId,
      username,
      utmId,
      status: 'pending',
      timestamp: accountRemovalRequest.timestamp
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account removal request submitted successfully',
      requestId,
      status: 'pending'
    });

  } catch (error) {
    console.error('Error submitting account removal request:', error);
    
    return NextResponse.json(
      { error: 'Failed to submit account removal request', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
