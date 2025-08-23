// Simple in-memory storage for account removal requests
export interface AccountRemovalRequest {
  id: string;
  username: string;
  utmId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
  reason?: string;
}

// In-memory storage for account removal requests
let accountRemovalRequests: AccountRemovalRequest[] = [];

export function addAccountRemovalRequest(request: AccountRemovalRequest) {
  accountRemovalRequests.push(request);
}

export function getAccountRemovalRequests(username?: string): AccountRemovalRequest[] {
  if (username) {
    return accountRemovalRequests.filter(req => req.username === username);
  }
  return accountRemovalRequests;
}

export function updateAccountRemovalStatus(requestId: string, status: string): boolean {
  const request = accountRemovalRequests.find(req => req.id === requestId);
  if (request) {
    request.status = status as 'pending' | 'approved' | 'rejected';
    return true;
  }
  return false;
}

export function clearAccountRemovalRequests() {
  accountRemovalRequests = [];
}
