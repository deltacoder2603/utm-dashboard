'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, 
  Sparkles, 
  Copy,
  Check,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SharedLayout from './SharedLayout';

interface LeadStats {
  utmId: string;
  count: number;
  earnings: number;
  ratePerLead?: number;
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

  if (loading) {
    return (
      <SharedLayout currentPage="dashboard" pageTitle="Dashboard" pageDescription="Loading your dashboard...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Loading your dashboard...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  if (error) {
    return (
      <SharedLayout currentPage="dashboard" pageTitle="Dashboard" pageDescription="Error loading dashboard">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md mx-auto">
            <div className="mx-auto h-20 w-20 bg-red-100 rounded-full mb-6 flex items-center justify-center">
              <Target className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-red-600 mb-6 text-lg">{error}</p>
            <Button
              onClick={loadUTMData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Try Again
            </Button>
          </div>
        </div>
      </SharedLayout>
    );
  }

  // Find user's specific UTM data
  const userUTMData = utmData?.leads.find(lead => lead.utmId === user?.utmId);

  return (
    <SharedLayout currentPage="dashboard" pageTitle="Dashboard" pageDescription="Track your campaign performance and earnings">
      {/* Welcome Section */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          <CardContent className="p-8 relative z-10">
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
          </CardContent>
        </Card>
      </div>

      {/* Performance Report Section - User's UTM Data */}
      {userUTMData ? (
        <div className="mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Your UTM Performance</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {/* CLICKS Card */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-blue-900 mb-2">CLICKS</h4>
                    <div className="text-3xl font-bold text-blue-600">
                      <span className="font-semibold text-black bg-blue-50 px-3 py-1 rounded-lg">{userUTMData.count}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* CONVERSION Card */}
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-green-900 mb-2">CONVERSION</h4>
                    <div className="text-3xl font-bold text-green-600">
                      <span className="font-semibold text-black bg-green-50 px-3 py-1 rounded-lg">100%</span>
                    </div>
                  </CardContent>
                </Card>

                {/* PAYOUT Card */}
                <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-yellow-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-yellow-900 mb-2">PAYOUT</h4>
                    <div className="text-3xl font-bold text-yellow-600">
                      <span className="font-semibold text-black bg-yellow-50 px-3 py-1 rounded-lg">₹{userUTMData.earnings}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Rate per Lead Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-purple-900 mb-2">Rate per Lead</h4>
                    <div className="text-3xl font-bold text-purple-600">
                      <span className="font-semibold text-black bg-purple-50 px-3 py-1 rounded-lg">₹{userUTMData.ratePerLead || 45}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* UTM ID Display */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Your UTM ID</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-white border border-gray-300 rounded-lg px-4 py-3 font-mono text-gray-700">
                    {userUTMData.utmId}
                  </div>
                  <Button
                    onClick={() => copyUTMId(userUTMData.utmId)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {copyStatus === 'copied' ? (
                      <>
                        <Check className="h-4 w-4 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-8 text-center">
              <div className="mx-auto h-20 w-20 bg-gray-100 rounded-full mb-6 flex items-center justify-center">
                <Target className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No UTM Data Found</h3>
              <p className="text-gray-600 mb-4">
                {statusLoading 
                  ? 'Checking your status...' 
                  : userStatus === 'pending' 
                    ? 'Your account is pending approval. Please wait for admin approval.'
                    : 'You don\'t have any UTM data yet. Please contact an administrator.'
                }
              </p>
              {userStatus === 'pending' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Pending Approval
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Information Section */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                  {user?.username}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                  {user?.name || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                  {user?.email || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg border border-gray-300">
                  {userStatus === 'approved' ? (
                    <Badge className="bg-green-100 text-green-800">Approved</Badge>
                  ) : userStatus === 'pending' ? (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  );
}
