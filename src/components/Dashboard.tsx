'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3, 
  Megaphone, 
  FileText, 
  DollarSign as DollarSignIcon, 
  UserIcon, 
  User, 
  MousePointer, 
  Users, 
  Wallet, 
  TrendingUp,
  Copy,
  Check,
  Target,
  Sparkles,
  Zap,
  Shield,
  ArrowUpRight,
  Calendar,
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LeadStats {
  utmId: string;
  count: number;
  earnings: number;
  products?: string[];
  cities?: string[];
}

interface UTMData {
  totalLeads: number;
  totalEarnings: number;
  leads: LeadStats[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [userStatus, setUserStatus] = useState<'approved' | 'pending' | 'not_found' | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUTMData();
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user?.username) {
      setStatusLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/user-status?username=${encodeURIComponent(user.username)}`);
      if (response.ok) {
        const data = await response.json();
        setUserStatus(data.status);
      } else {
        console.error('Failed to check user status');
        setUserStatus('not_found');
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setUserStatus('not_found');
    } finally {
      setStatusLoading(false);
    }
  };

  const loadUTMData = async () => {
    try {
      const response = await fetch('/api/utm-data');
      if (response.ok) {
        const data = await response.json();
        setUtmData(data);
      } else {
        setError('Failed to fetch UTM data');
      }
    } catch (error) {
      setError('Failed to fetch UTM data');
    } finally {
      setLoading(false);
    }
  };

  const copyUTMId = async (utmId: string) => {
    try {
      await navigator.clipboard.writeText(utmId);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('copied'), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = utmId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('copied'), 2000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-6 flex items-center justify-center">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your dashboard</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto h-20 w-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl shadow-2xl mb-6 flex items-center justify-center">
            <Target className="h-10 w-10 text-white animate-pulse" />
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-rose-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl shadow-2xl mb-6 flex items-center justify-center">
            <BarChart3 className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
          <p className="text-red-600 mb-6 text-lg">{error}</p>
          <button
            onClick={loadUTMData}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-2xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Find user's specific UTM data
  const userUTMData = utmData?.leads.find(lead => lead.utmId === user.utmId);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Sidebar - Dark Blue - Fixed */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white fixed h-full overflow-y-auto shadow-2xl">
        {/* Navigation Menu */}
        <nav className="p-6">
          <div className="space-y-3">
            <div className="flex items-center p-4 bg-blue-700/50 rounded-xl cursor-pointer border border-blue-600/30">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">Dashboard</span>
              </div>
            </div>
            
            <div className="flex items-center p-4 hover:bg-blue-700/30 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => router.push('/campaigns')}>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <span>Campaigns</span>
              </div>
            </div>
            
            <div className="flex items-center p-4 hover:bg-blue-700/30 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => router.push('/reports')}>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span>Reports</span>
              </div>
            </div>
            
            <div className="flex items-center p-4 hover:bg-blue-700/30 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => router.push('/invoice')}>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <DollarSignIcon className="w-5 h-5 text-white" />
                </div>
                <span>Invoice</span>
              </div>
            </div>
            
            <div className="flex items-center p-4 hover:bg-blue-700/30 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => router.push('/account')}>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <span>Account</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content Area - With Left Margin for Fixed Sidebar */}
      <div className="ml-64 flex-1">
        {/* Top Header Bar */}
        <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 sticky top-0 z-50">
          <div className="flex justify-between items-center px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {user.name || 'User'}!</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300">
                <Activity className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-6 py-3 rounded-2xl font-semibold hover:from-red-600 hover:to-rose-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <User className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Welcome to Your UTM Dashboard</h2>
                </div>
                <p className="text-blue-100 text-lg max-w-2xl">
                  Track your campaign performance, monitor leads, and maximize your earnings with our comprehensive analytics.
                </p>
              </div>
            </div>
          </div>

          {/* Performance Report Section - User's UTM Data */}
          {userUTMData ? (
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800">Your UTM Performance</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center group">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <div className="text-xl font-bold text-blue-600 break-words overflow-hidden bg-blue-50 px-4 py-2 rounded-xl border border-blue-200">
                        {userUTMData.utmId}
                      </div>
                      <button
                        onClick={() => copyUTMId(userUTMData.utmId)}
                        className="p-2 hover:bg-blue-100 rounded-xl transition-all duration-200 group-hover:scale-110"
                        title="Copy UTM ID"
                      >
                        {copyStatus === 'copied' ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5 text-blue-600" />
                        )}
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 font-medium">UTM ID</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">{userUTMData.count || 0}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">₹{userUTMData.earnings || 0}</div>
                    <div className="text-sm text-gray-600 font-medium">Total Earnings</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 text-center">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No UTM Data Found</h3>
                <p className="text-gray-600">Please contact admin to assign a UTM ID.</p>
              </div>
            </div>
          )}

          {/* Summary Cards - 4 Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* CLICKS Card */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">CLICKS</h3>
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <MousePointer className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today</span>
                  <span className="font-semibold text-black bg-blue-50 px-3 py-1 rounded-lg">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Yesterday</span>
                  <span className="font-semibold text-black bg-green-50 px-3 py-1 rounded-lg">{userUTMData?.count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MTD</span>
                  <span className="font-semibold text-black bg-purple-50 px-3 py-1 rounded-lg">{userUTMData?.count || 0}</span>
                </div>
              </div>
            </div>

            {/* CONVERSION Card */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">CONVERSION</h3>
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today</span>
                  <span className="font-semibold text-black bg-blue-50 px-3 py-1 rounded-lg">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Yesterday</span>
                  <span className="font-semibold text-black bg-green-50 px-3 py-1 rounded-lg">0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MTD</span>
                  <span className="font-semibold text-black bg-purple-50 px-3 py-1 rounded-lg">0</span>
                </div>
              </div>
            </div>

            {/* PAYOUT Card */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">PAYOUT</h3>
                <div className="h-12 w-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Today</span>
                  <span className="font-semibold text-black bg-blue-50 px-3 py-1 rounded-lg">₹0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Yesterday</span>
                  <span className="font-semibold text-black bg-green-50 px-3 py-1 rounded-lg">₹{userUTMData?.earnings || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">MTD</span>
                  <span className="font-semibold text-black bg-purple-50 px-3 py-1 rounded-lg">₹{userUTMData?.earnings || 0}</span>
                </div>
              </div>
            </div>

            {/* UTM PERFORMANCE Card */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 p-6 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">UTM PERFORMANCE</h3>
                <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">UTM ID</span>
                  <div className="flex items-center space-x-1">
                    <span className="font-semibold text-xs truncate max-w-20 text-black bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                      {user.utmId || 'N/A'}
                    </span>
                    <button
                      onClick={() => copyUTMId(user.utmId || '')}
                      className="p-1 hover:bg-gray-100 rounded-lg transition-all duration-200"
                      title="Copy UTM ID"
                    >
                      {copyStatus === 'copied' ? (
                        <Check className="w-3 h-3 text-green-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Leads</span>
                  <span className="font-semibold text-black bg-green-50 px-3 py-1 rounded-lg">{userUTMData?.count || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-black bg-purple-50 px-3 py-1 rounded-lg">₹{userUTMData?.earnings || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800">Account Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">Username</span>
                  <span className="text-gray-900 font-semibold">{user.username || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">Full Name</span>
                  <span className="text-gray-900 font-semibold">{user.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">UTM ID</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-900 font-semibold">{user.utmId || 'N/A'}</span>
                    {user.utmId && (
                      <button
                        onClick={() => copyUTMId(user.utmId || '')}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        title="Copy UTM ID"
                      >
                        {copyStatus === 'copied' ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-blue-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">Total Leads</span>
                  <span className="text-gray-900 font-semibold">{userUTMData?.count || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">Total Earnings</span>
                  <span className="text-gray-900 font-semibold">₹{userUTMData?.earnings || 0}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                  <span className="text-gray-600 font-medium">Account Status</span>
                  {statusLoading ? (
                    <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                      Checking...
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      userStatus === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : userStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {userStatus === 'approved' 
                        ? 'Approved' 
                        : userStatus === 'pending'
                        ? 'Pending Approval'
                        : 'Not Found'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
