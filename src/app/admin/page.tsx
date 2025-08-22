'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Clock, AlertCircle, Target, Users, DollarSign, Clock3, TrendingUp, BarChart3, UserCheck, LogOut, RefreshCw, X } from 'lucide-react';

interface UTMData {
  totalLeads: number;
  totalEarnings: number;
  leads: Array<{
    utmId: string;
    count: number;
    earnings: number;
  }>;
}

interface UserRegistration {
  id: number;
  name: string;
  email: string;
  socialMedia: string;
  mobile: string;
  username: string;
  approved: boolean;
}

interface WithdrawalRequest {
  id: string;
  username: string;
  utmId: string;
  name: string;
  requestDate: string;
  status: string;
}

export default function AdminPage() {
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'utm' | 'pending' | 'approved' | 'withdrawals'>('utm');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showUtmDialog, setShowUtmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRegistration | null>(null);
  const [utmIdInput, setUtmIdInput] = useState('');
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: 'idle' | 'copied' }>({});
  const router = useRouter();

  useEffect(() => {
    // Admin authentication check
    const checkAuth = () => {
      const username = localStorage.getItem('username');
      const password = localStorage.getItem('password');
      
      const isAdminUser =
        (username === 'admin' && password === 'admin@idioticmedia') ||
        (username === 'username-admin' && password === 'password-admin@idioticmedia');
      
      if (!isAdminUser) {
        router.push('/login');
        return;
      }
      
      fetchData();
    };
    
    checkAuth();
  }, [router]);

  // Auto-refresh data every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchData();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [loading]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [utmResponse, registrationsResponse, withdrawalResponse] = await Promise.all([
        fetch('/api/utm-data'),
        fetch('/api/user-registrations'),
        fetch('/api/withdrawal-requests')
      ]);

      if (utmResponse.ok) {
        const utmData = await utmResponse.json();
        setUtmData(utmData);
      }

      if (registrationsResponse.ok) {
        const registrationsData = await registrationsResponse.json();
        console.log('Admin Dashboard - All Registrations:', registrationsData);
        setUserRegistrations(registrationsData.users || []);
      }

      if (withdrawalResponse.ok) {
        const withdrawalData = await withdrawalResponse.json();
        setWithdrawalRequests(withdrawalData.requests || []);
      }
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  // Show UTM ID dialog for approval
  const handleApproveClick = (user: UserRegistration) => {
    setSelectedUser(user);
    setUtmIdInput('');
    setShowUtmDialog(true);
  };

  // Approve a user with UTM ID
  const handleApproveUser = async () => {
    if (!selectedUser || !utmIdInput.trim()) {
      alert('Please enter a UTM ID');
      return;
    }

    try {
      setApproving(selectedUser.username);
      const response = await fetch('/api/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: selectedUser.username,
          utmId: utmIdInput.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`User ${selectedUser.username} approved successfully with UTM ID: ${utmIdInput.trim()}`);
        setShowUtmDialog(false);
        setSelectedUser(null);
        setUtmIdInput('');
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert(`Failed to approve user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApproving(null);
    }
  };

  // Withdraw a user
  const handleWithdrawUser = async (username: string) => {
    if (!confirm(`Are you sure you want to withdraw user ${username}?`)) {
      return;
    }

    try {
      setApproving(username);
      const response = await fetch('/api/withdraw-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        alert(`User ${username} withdrawn successfully!`);
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to withdraw user');
      }
    } catch (error) {
      console.error('Error withdrawing user:', error);
      alert(`Failed to withdraw user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApproving(null);
    }
  };

  // Approve a withdrawal request
  const handleApproveWithdrawal = async (requestId: string, username: string) => {
    if (!confirm('Are you sure you want to approve this withdrawal request? This will completely remove the user from the system.')) {
      return;
    }

    try {
      const response = await fetch('/api/approve-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: 'approved', username }),
      });

      if (response.ok) {
        alert('Withdrawal request approved successfully! User has been removed from the system.');
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve withdrawal request');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      alert(`Failed to approve withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Reject a withdrawal request
  const handleRejectWithdrawal = async (requestId: string, username: string) => {
    if (!confirm('Are you sure you want to reject this withdrawal request?')) {
      return;
    }

    try {
      const response = await fetch('/api/approve-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requestId, status: 'rejected', username }),
      });

      if (response.ok) {
        alert('Withdrawal request rejected successfully!');
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject withdrawal request');
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert(`Failed to reject withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const copyUTMId = async (text: string, utmId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus(prev => ({ ...prev, [utmId]: 'copied' }));
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [utmId]: 'idle' }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    router.push('/login');
  };

  // Filter users based on approval status
  const pendingUsers = userRegistrations.filter(u => !u.approved);
  const approvedUsers = userRegistrations.filter(u => u.approved);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-gray-600">Manage your UTM platform</p>
              {lastRefresh && (
                <p className="text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total UTM Leads</p>
              <p className="text-2xl font-bold text-blue-600">{utmData?.totalLeads || 0}</p>
              <p className="text-sm text-gray-500">Active campaigns</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">₹{utmData?.totalEarnings || 0}</p>
              <p className="text-sm text-gray-500">Revenue generated</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
              <p className="text-sm text-gray-500">Awaiting review</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Withdrawal Requests</p>
              <p className="text-2xl font-bold text-purple-600">{withdrawalRequests.length}</p>
              <p className="text-sm text-gray-500">Pending review</p>
            </div>
            <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
              <Clock3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('utm')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'utm'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            UTM Data
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'pending'
                ? 'bg-orange-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Users ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'approved'
                ? 'bg-green-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Approved Users ({approvedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'withdrawals'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock3 className="w-4 h-4" />
            Withdrawal Requests ({withdrawalRequests.length})
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'utm' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">UTM Campaign Data</h3>
            {utmData && utmData.leads && utmData.leads.length > 0 ? (
              <div className="space-y-4">
                {utmData.leads.map((lead, index) => (
                  <div key={index} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                          <Target className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{lead.utmId}</p>
                          <p className="text-sm text-gray-600">{lead.count} leads</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">₹{lead.earnings}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">₹{45} per lead</span>
                          <button
                            onClick={() => copyUTMId(lead.utmId, lead.utmId)}
                            className="p-1 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Copy UTM ID"
                          >
                            {copyStatus[lead.utmId] === 'copied' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No UTM Data</h3>
                <p className="text-gray-600">No UTM campaign data available yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending User Approvals
            </h3>
            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-600">{user.mobile}</p>
                          {user.socialMedia && (
                            <p className="text-sm text-blue-600">
                              <a href={user.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {user.socialMedia}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleApproveClick(user)}
                        disabled={approving === user.username}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {approving === user.username ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Approve User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Users</h3>
                <p className="text-gray-600">All users have been processed.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'approved' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Approved Users
            </h3>
            {approvedUsers.length > 0 ? (
              <div className="space-y-4">
                {approvedUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-600">{user.mobile}</p>
                          {user.socialMedia && (
                            <p className="text-sm text-blue-600">
                              <a href={user.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {user.socialMedia}
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleWithdrawUser(user.username)}
                        disabled={approving === user.username}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                      >
                        {approving === user.username ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Withdraw User
                          </>
                          )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Approved Users</h3>
                <p className="text-gray-600">No users have been approved yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-purple-500" />
              Withdrawal Requests
            </h3>
            {withdrawalRequests.length > 0 ? (
              <div className="space-y-4">
                {withdrawalRequests.map((request) => (
                  <div key={request.id} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.name}</p>
                          <p className="text-sm text-gray-600">@{request.username}</p>
                          <p className="text-sm text-gray-600">UTM ID: {request.utmId}</p>
                          <p className="text-sm text-gray-600">Requested: {new Date(request.requestDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApproveWithdrawal(request.id, request.username)}
                              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectWithdrawal(request.id, request.username)}
                              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2"
                            >
                              <X className="w-4 h-4" />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Withdrawal Requests</h3>
                <p className="text-gray-600">No withdrawal requests have been made yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* UTM ID Dialog */}
      {showUtmDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Approve User</h3>
                <p className="text-gray-600">Enter UTM ID for {selectedUser.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowUtmDialog(false);
                  setSelectedUser(null);
                  setUtmIdInput('');
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="utmId" className="block text-sm font-medium text-gray-700 mb-2">
                  UTM ID
                </label>
                <input
                  id="utmId"
                  type="text"
                  value={utmIdInput}
                  onChange={(e) => setUtmIdInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="Enter UTM ID (e.g., inf_username_idc004_jul25_yt_pl)"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUtmDialog(false);
                    setSelectedUser(null);
                    setUtmIdInput('');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveUser}
                  disabled={!utmIdInput.trim() || approving === selectedUser.username}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {approving === selectedUser.username ? 'Approving...' : 'Approve User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
