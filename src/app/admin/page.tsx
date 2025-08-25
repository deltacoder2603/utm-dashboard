'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Clock, AlertCircle, Target, Users, DollarSign, Clock3, TrendingUp, BarChart3, UserCheck, LogOut, RefreshCw, X, Edit, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UTMData {
  totalLeads: number;
  totalEarnings: number;
  leads: Array<{
    utmId: string;
    count: number;
    earnings: number;
    ratePerLead?: number;
  }>;
}

interface UserRegistration {
  id: number;
  name: string;
  email: string;
  socialMedia: string;
  utmLink: string;
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

interface MoneyWithdrawalRequest {
  username: string;
  amount: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  status: string;
  timestamp: string;
  approved: string;
  rowIndex: number;
}

export default function AdminPage() {
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<UserRegistration[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [moneyWithdrawalRequests, setMoneyWithdrawalRequests] = useState<MoneyWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'utm' | 'pending' | 'approved' | 'withdrawals' | 'money-withdrawals'>('utm');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showUtmDialog, setShowUtmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRegistration | null>(null);
  const [ratePerLeadInput, setRatePerLeadInput] = useState('45');
  const [leadsInput, setLeadsInput] = useState('0');
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: 'idle' | 'copied' }>({});
  const [editingUTM, setEditingUTM] = useState<{utmId: string; count: number; earnings: number} | null>(null);
  const [editUTMData, setEditUTMData] = useState<{utmId: string; count: number; earnings: number; ratePerLead: number}>({
    utmId: '', 
    count: 0, 
    earnings: 0, 
    ratePerLead: 45
  });

  const router = useRouter();

  useEffect(() => {
    // Admin authentication check
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        const isAdminUser = userData.username === 'admin' && userData.isAdmin === true;
        
        if (isAdminUser) {
          fetchData();
          return;
        }
      }
      
      // If not admin, redirect to login
      router.push('/login');
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
      
      const [utmResponse, registrationsResponse, withdrawalResponse, moneyWithdrawalResponse] = await Promise.all([
        fetch('/api/utm-data'),
        fetch('/api/user-registrations'),
        fetch('/api/withdrawal-requests'),
        fetch('/api/admin/withdrawal-requests')
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

      if (moneyWithdrawalResponse.ok) {
        const moneyWithdrawalData = await moneyWithdrawalResponse.json();
        setMoneyWithdrawalRequests(moneyWithdrawalData.withdrawalRequests || []);
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
    setRatePerLeadInput('45'); // Reset to default rate
    setLeadsInput('0'); // Reset leads input
    setShowUtmDialog(true);
  };

  // Approve a user with UTM link, leads count and rate
  const handleApproveUser = async () => {
    if (!selectedUser) {
      alert('No user selected');
      return;
    }

    if (!leadsInput.trim() || isNaN(parseInt(leadsInput)) || parseInt(leadsInput) < 0) {
      alert('Please enter a valid number of leads');
      return;
    }

    if (!ratePerLeadInput.trim() || isNaN(parseInt(ratePerLeadInput)) || parseInt(ratePerLeadInput) <= 0) {
      alert('Please enter a valid rate per lead');
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
          utmId: selectedUser.utmLink, // Use UTM link from registration as UTM ID
          ratePerLead: parseInt(ratePerLeadInput),
          leadsCount: parseInt(leadsInput)
        }),
      });

      if (response.ok) {
        alert(`User ${selectedUser.username} approved successfully!\n\nUTM Link: ${selectedUser.utmLink}\nLeads Count: ${leadsInput}\nRate per Lead: ₹${ratePerLeadInput}`);
        setShowUtmDialog(false);
        setSelectedUser(null);
        setRatePerLeadInput('45');
        setLeadsInput('0');
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

  // Remove a user
  const handleRemoveUser = async (username: string) => {
    if (!confirm(`Are you sure you want to remove user ${username}? This will permanently delete all their data from both sheets.`)) {
      return;
    }

    try {
      setApproving(username);
      const response = await fetch('/api/remove-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (response.ok) {
        alert(`User ${username} removed successfully! All data has been deleted from both sheets.`);
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove user');
      }
    } catch (error) {
      console.error('Error removing user:', error);
      alert(`Failed to remove user: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  // Approve a money withdrawal request
  const handleApproveMoneyWithdrawal = async (request: MoneyWithdrawalRequest) => {
    if (!confirm(`Are you sure you want to approve the withdrawal request of ₹${request.amount} for ${request.username}?`)) {
      return;
    }

    try {
      setApproving(`${request.username}-${request.rowIndex}`);
      const response = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: request.username, 
          amount: request.amount, 
          status: 'Approved', 
          rowIndex: request.rowIndex 
        }),
      });

      if (response.ok) {
        alert(`Withdrawal request of ₹${request.amount} for ${request.username} approved successfully!`);
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve withdrawal request');
      }
    } catch (error) {
      console.error('Error approving money withdrawal:', error);
      alert(`Failed to approve withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApproving(null);
    }
  };

  // Reject a money withdrawal request
  const handleRejectMoneyWithdrawal = async (request: MoneyWithdrawalRequest) => {
    if (!confirm(`Are you sure you want to reject the withdrawal request of ₹${request.amount} for ${request.username}?`)) {
      return;
    }

    try {
      setApproving(`${request.username}-${request.rowIndex}`);
      const response = await fetch('/api/admin/approve-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: request.username, 
          amount: request.amount, 
          status: 'Rejected', 
          rowIndex: request.rowIndex 
        }),
      });

      if (response.ok) {
        alert(`Withdrawal request of ₹${request.amount} for ${request.username} rejected successfully!`);
        await fetchData(); // Reload data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reject withdrawal request');
      }
    } catch (error) {
      console.error('Error rejecting money withdrawal:', error);
      alert(`Failed to reject withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setApproving(null);
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

  // Edit UTM Data functions
  const handleEditUTM = (lead: {utmId: string; count: number; earnings: number}) => {
    setEditingUTM(lead);
    const ratePerLead = lead.count > 0 ? Math.round(lead.earnings / lead.count) : 45;
    setEditUTMData({
      utmId: lead.utmId,
      count: lead.count,
      earnings: lead.earnings,
      ratePerLead: ratePerLead
    });
  };

  const handleSaveUTMEdit = async () => {
    if (!editingUTM) return;

    try {
      // For now, we'll update the data locally and refresh from server
      // In a real implementation, you'd call an API to update the Google Sheets
      const response = await fetch('/api/update-utm-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUtmId: editingUTM.utmId,
          updatedData: editUTMData
        }),
      });

      if (response.ok) {
        alert('UTM data updated successfully!');
        setEditingUTM(null);
        setEditUTMData({ utmId: '', count: 0, earnings: 0, ratePerLead: 45 });
        await fetchData(); // Refresh data
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update UTM data');
      }
    } catch (error) {
      console.error('Error updating UTM data:', error);
      alert(`Failed to update UTM data: ${error instanceof Error ? error.message : 'Feature not yet implemented'}`);
    }
  };

  const handleCancelUTMEdit = () => {
    setEditingUTM(null);
    setEditUTMData({ utmId: '', count: 0, earnings: 0, ratePerLead: 45 });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-lg rounded-2xl p-6 sm:p-8 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600">Manage your UTM platform</p>
              {lastRefresh && (
                <p className="text-xs sm:text-sm text-gray-500">Last updated: {lastRefresh.toLocaleTimeString()}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
              <span className="sm:hidden">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 text-sm sm:text-base"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white shadow-lg border-0 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total UTM Leads</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{utmData?.totalLeads || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500">Active campaigns</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Total Earnings</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">₹{utmData?.totalEarnings || 0}</p>
                <p className="text-xs sm:text-sm text-gray-500">Revenue generated</p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{pendingUsers.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Awaiting review</p>
              </div>
                              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg border-0 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Withdrawal Requests</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{withdrawalRequests.length}</p>
                <p className="text-xs sm:text-sm text-gray-500">Pending review</p>
                </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                <Clock3 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
        <div className="w-full">
          {/* Tab Selector Dropdown */}
          <div className="relative mb-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-gray-100 transition-all duration-200">
              <div className="flex items-center gap-3">
                {activeTab === 'utm' && (
                  <>
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">UTM Data</span>
                  </>
                )}
                {activeTab === 'pending' && (
                  <>
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Pending Users</span>
                    {pendingUsers.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {pendingUsers.length}
                      </span>
                    )}
                  </>
                )}
                {activeTab === 'approved' && (
                  <>
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Approved Users</span>
                    {approvedUsers.length > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {approvedUsers.length}
                      </span>
                    )}
                  </>
                )}
                {activeTab === 'money-withdrawals' && (
                  <>
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Money Withdrawals</span>
                    {moneyWithdrawalRequests.length > 0 && (
                      <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center">
                        {moneyWithdrawalRequests.length}
                      </span>
                    )}
                  </>
                )}
              </div>
              <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
            
              <DropdownMenuContent className="w-64 p-2">
                  <DropdownMenuItem 
                    onClick={() => setActiveTab('utm')}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  >
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">UTM Data</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setActiveTab('pending')}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  >
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-medium">Pending Users</span>
                    {pendingUsers.length > 0 && (
                      <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ml-auto">
                        {pendingUsers.length}
                      </span>
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setActiveTab('approved')}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  >
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Approved Users</span>
                    {approvedUsers.length > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ml-auto">
                        {approvedUsers.length}
                      </span>
                    )}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => setActiveTab('money-withdrawals')}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                  >
                    <DollarSign className="w-5 h-5 text-purple-600" />
                    <span className="font-medium">Money Withdrawals</span>
                    {moneyWithdrawalRequests.length > 0 && (
                      <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] text-center ml-auto">
                        {moneyWithdrawalRequests.length}
                      </span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>




        {/* Tab Content */}
        {activeTab === 'utm' && (
          <div className="p-6 sm:p-8">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">UTM Campaign Data</h3>
            {utmData && utmData.leads && utmData.leads.length > 0 ? (
              <div className="space-y-4">
                {utmData.leads.map((lead, index) => {
                  const ratePerLead = lead.ratePerLead || 45; // Use rate from UTM data
                  return (
                    <div key={index} className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-3 sm:gap-4 flex-1">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">UTM ID</label>
                                <p className="font-semibold text-gray-900 break-all">{lead.utmId}</p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Number of Leads</label>
                                <p className="text-lg font-bold text-blue-600">{lead.count}</p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rate per Lead</label>
                                <p className="text-lg font-bold text-purple-600">₹{ratePerLead}</p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Revenue</label>
                                <p className="text-lg font-bold text-green-600">₹{lead.earnings}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-4">
                          <button
                            onClick={() => copyUTMId(lead.utmId, lead.utmId)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                            title="Copy UTM ID"
                          >
                            {copyStatus[lead.utmId] === 'copied' ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-blue-600" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEditUTM(lead)}
                            className="p-2 hover:bg-blue-50 bg-blue-100 rounded-lg transition-all duration-200"
                            title="Edit UTM Data"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          <div className="overflow-x-auto p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending User Approvals
            </h3>
            {pendingUsers.length > 0 ? (
              <div className="space-y-4">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">@{user.username}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{user.mobile}</p>
                          {user.socialMedia && (
                            <p className="text-xs sm:text-sm text-blue-600 truncate">
                              <a href={user.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {user.socialMedia}
                              </a>
                            </p>
                          )}
                          {user.utmLink && (
                            <p className="text-xs sm:text-sm text-purple-600 truncate">
                              <span className="font-medium">UTM Link:</span> {user.utmLink}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleApproveClick(user)}
                        disabled={approving === user.username}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-xs sm:text-sm w-full lg:w-auto justify-center"
                      >
                        {approving === user.username ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
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
          <div className="overflow-x-auto p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Approved Users
            </h3>
            {approvedUsers.length > 0 ? (
              <div className="space-y-4">
                {approvedUsers.map((user) => (
                  <div key={user.id} className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{user.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600">@{user.username}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{user.email}</p>
                          <p className="text-xs sm:text-sm text-gray-600">{user.mobile}</p>
                          {user.socialMedia && (
                            <p className="text-xs sm:text-sm text-blue-600 truncate">
                              <a href={user.socialMedia} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                {user.socialMedia}
                              </a>
                            </p>
                          )}
                          {user.utmLink && (
                            <p className="text-xs sm:text-sm text-purple-600 truncate">
                              <span className="font-medium">UTM Link:</span> {user.utmLink}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveUser(user.username)}
                        disabled={approving === user.username}
                        className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-xs sm:text-sm w-full lg:w-auto justify-center"
                      >
                        {approving === user.username ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                            Processing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3 h-3 sm:w-4 sm:h-4" />
                            Remove User
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

        {activeTab === 'money-withdrawals' && (
          <div className="overflow-x-auto p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Money Withdrawal Requests
            </h3>
            {moneyWithdrawalRequests.length > 0 ? (
              <div className="space-y-4">
                {moneyWithdrawalRequests.map((request, index) => (
                  <div key={index} className="bg-gray-50/50 rounded-2xl p-4 sm:p-6 border border-gray-200/50">
                    <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">@{request.username}</p>
                          <p className="text-base sm:text-lg font-bold text-green-600">₹{request.amount}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="truncate">
                              <span className="font-medium">Bank:</span> {request.bankName}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Account:</span> ****{request.accountNumber.slice(-4)}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">Holder:</span> {request.accountHolderName}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">IFSC:</span> {request.ifscCode}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              Requested: {new Date(request.timestamp).toLocaleDateString()}
                            </span>
                            {request.approved && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Approved: {request.approved}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full xl:w-auto">
                        <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                          request.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {request.status}
                        </div>
                        {request.status === 'Pending' && (
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleApproveMoneyWithdrawal(request)}
                              disabled={approving === `${request.username}-${request.rowIndex}`}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto"
                            >
                              {approving === `${request.username}-${request.rowIndex}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Approve
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleRejectMoneyWithdrawal(request)}
                              disabled={approving === `${request.username}-${request.rowIndex}`}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm w-full sm:w-auto"
                            >
                              {approving === `${request.username}-${request.rowIndex}` ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                  Reject
                                </>
                              )}
                            </button>
                          </div>
                        )}
                        {request.status === 'Approved' && (
                          <div className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                            ✓ Approved
                          </div>
                        )}
                        {request.status === 'Rejected' && (
                          <div className="px-2 sm:px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs sm:text-sm font-medium">
                            ✗ Rejected
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Money Withdrawal Requests</h3>
                <p className="text-gray-600">No money withdrawal requests have been made yet.</p>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </Card>

      {/* UTM Edit Dialog */}
      {editingUTM && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <Edit className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Edit UTM Data</h3>
                <p className="text-gray-600">Modify UTM campaign details</p>
              </div>
              <button
                onClick={handleCancelUTMEdit}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="editUtmId" className="block text-sm font-medium text-gray-700 mb-2">
                  UTM ID
                </Label>
                <Input
                  id="editUtmId"
                  type="text"
                  value={editUTMData.utmId}
                  onChange={(e) => setEditUTMData(prev => ({ ...prev, utmId: e.target.value }))}
                  className="w-full"
                  placeholder="Enter UTM ID"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editLeadCount" className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Leads
                  </Label>
                  <Input
                    id="editLeadCount"
                    type="number"
                    min="0"
                    value={editUTMData.count}
                    onChange={(e) => {
                      const count = parseInt(e.target.value) || 0;
                      setEditUTMData(prev => ({ 
                        ...prev, 
                        count,
                        earnings: count * prev.ratePerLead // Auto-calculate earnings
                      }));
                    }}
                    className="w-full"
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="editRatePerLead" className="block text-sm font-medium text-gray-700 mb-2">
                    Rate per Lead (₹)
                  </Label>
                  <Input
                    id="editRatePerLead"
                    type="number"
                    min="0"
                    value={editUTMData.ratePerLead}
                    onChange={(e) => {
                      const rate = parseInt(e.target.value) || 0;
                      setEditUTMData(prev => ({ 
                        ...prev, 
                        ratePerLead: rate,
                        earnings: prev.count * rate // Auto-calculate earnings
                      }));
                    }}
                    className="w-full"
                    placeholder="45"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="editEarnings" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Earnings (₹)
                </Label>
                <Input
                  id="editEarnings"
                  type="number"
                  min="0"
                  value={editUTMData.earnings}
                  onChange={(e) => setEditUTMData(prev => ({ ...prev, earnings: parseInt(e.target.value) || 0 }))}
                  className="w-full"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated: {editUTMData.count} leads × ₹{editUTMData.ratePerLead} = ₹{editUTMData.count * editUTMData.ratePerLead}
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleCancelUTMEdit}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveUTMEdit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <p className="text-gray-600">Set leads count and rate for {selectedUser.name}</p>
              </div>
              <button
                                  onClick={() => {
                    setShowUtmDialog(false);
                    setSelectedUser(null);
                    setRatePerLeadInput('45');
                  }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Display User's UTM Link */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  User&apos;s UTM Link (This will be their UTM ID)
                </label>
                <div className="text-sm text-blue-800 bg-white px-3 py-2 rounded-lg border border-blue-200 break-all">
                  {selectedUser.utmLink}
                </div>
              </div>

              <div>
                <label htmlFor="leadsCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Leads
                </label>
                <input
                  id="leadsCount"
                  type="number"
                  min="0"
                  value={leadsInput}
                  onChange={(e) => setLeadsInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="0"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the current number of leads for this user
                </p>
              </div>

              <div>
                <label htmlFor="ratePerLead" className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per Lead (₹)
                </label>
                <input
                  id="ratePerLead"
                  type="text"
                  pattern="[0-9]*"
                  value={ratePerLeadInput}
                  onChange={(e) => setRatePerLeadInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 text-gray-900 placeholder-gray-500"
                  placeholder="45"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the rate per lead for this user (e.g., 45, 75, 100)
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUtmDialog(false);
                    setSelectedUser(null);
                    setRatePerLeadInput('45');
                    setLeadsInput('0');
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveUser}
                  disabled={!leadsInput.trim() || !ratePerLeadInput.trim() || approving === selectedUser.username}
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
