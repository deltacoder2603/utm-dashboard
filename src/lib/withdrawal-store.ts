// Simple in-memory storage for withdrawal requests
export interface WithdrawalRequest {
  id: string;
  username: string;
  utmId: string;
  name: string;
  requestDate: string;
  status: string;
}

let withdrawalRequests: WithdrawalRequest[] = [];

export function addWithdrawalRequest(request: WithdrawalRequest) {
  withdrawalRequests.push(request);
}

export function getWithdrawalRequests(username?: string): WithdrawalRequest[] {
  if (username) {
    return withdrawalRequests.filter(req => req.username === username);
  }
  return withdrawalRequests;
}

export function updateWithdrawalStatus(requestId: string, status: string): boolean {
  const request = withdrawalRequests.find(req => req.id === requestId);
  if (request) {
    request.status = status;
    return true;
  }
  return false;
}

export function clearWithdrawalRequests() {
  withdrawalRequests = [];
}
