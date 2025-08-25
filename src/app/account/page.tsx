'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Check, User, Globe, Calendar } from 'lucide-react';
import SharedLayout from '@/components/SharedLayout';

interface UserInfo {
  name: string;
  email: string;
  socialMediaLink: string;
  mobileNumber: string;
  username: string;
  password: string;
  approved: string;
  withdraw: string;
  utmId?: string;
  ratePerLead?: number;
}

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

export default function AccountPage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [utmData, setUtmData] = useState<UTMData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  // Load user information from Google Sheet
  const loadUserInfo = async () => {
    if (typeof window === 'undefined') return;
    
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return;
    
    const user = JSON.parse(savedUser);
    if (!user?.username) return;
    
    try {
      // Fetch user data from User_Registrations sheet to get detailed info
      const response = await fetch('/api/user-registrations');
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data); // Debug log
        
        // The API returns 'users' array from User_Registrations sheet
        const userData = data.users?.find((userRecord: { username: string; name?: string; email?: string; socialMedia?: string; mobile?: string; password?: string; approved?: boolean }) => userRecord.username === user.username);

        
        console.log('Found user data:', userData); // Debug log
        
        if (userData) {
          setUserInfo({
            name: userData.name || 'Not provided',
            email: userData.email || 'Not provided',
            socialMediaLink: userData.socialMedia || 'Not provided',
            mobileNumber: userData.mobile || 'Not provided', 
            username: userData.username || user.username,
            password: 'Hidden for security', // Don't show actual password
            approved: userData.approved ? 'Yes' : 'No', // API returns boolean
            withdraw: 'No', // Not available in User_Registrations sheet
            utmId: user.utmId || 'Not assigned',
            ratePerLead: 45 // Default rate
          });
        } else {
          console.log('User not found in data:', user.username);
          // Set default data if user not found
          setUserInfo({
            name: user.name || 'Not provided',
            email: user.email || 'Not provided',
            socialMediaLink: 'Not provided',
            mobileNumber: 'Not provided',
            username: user.username,
            password: 'Hidden for security',
            approved: user.isApproved ? 'Yes' : 'No',
            withdraw: 'No',
            utmId: user.utmId || 'Not assigned',
            ratePerLead: 45
          });
        }
      }
    } catch (error) {
      console.error('Failed to load user information:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load UTM data to get actual rate per lead
  const loadUTMData = async () => {
    if (typeof window === 'undefined') return;
    
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return;
    
    const user = JSON.parse(savedUser);
    if (!user?.utmId) return;
    
    try {
      const response = await fetch('/api/utm-data');
      if (response.ok) {
        const data = await response.json();
        setUtmData(data);
        
        // Find the user's UTM data and update the rate
        if (data.leads && data.leads.length > 0) {
          const userUTM = data.leads.find((lead: { utmId: string; ratePerLead?: number }) => lead.utmId === user.utmId);

          if (userUTM && userUTM.ratePerLead) {
            setUserInfo(prev => prev ? {
              ...prev,
              ratePerLead: userUTM.ratePerLead
            } : null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load UTM data:', error);
    }
  };

  useEffect(() => {
    // Check authentication directly from localStorage
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          // Check if it's a regular user (not admin)
          if (userData.username === 'admin' && userData.isAdmin === true) {
            // This is an admin user, redirect to admin dashboard
            window.location.href = '/admin';
            return;
          } else {
            // This is a regular user, load account data
            loadUserInfo();
            loadUTMData();
            return;
          }
        } else {
          // No user found, redirect to login
          window.location.href = '/login';
        }
      }
    };
    
    checkAuth();
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('copied'), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
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
      <SharedLayout currentPage="account" pageTitle="Account" pageDescription="Loading your account information...">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600 font-medium">Loading your account information...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait while we fetch your data</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout currentPage="account" pageTitle="Account" pageDescription="View and manage your account information">
      {/* Account Overview */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{userInfo?.name || 'User'}</h2>
                <p className="text-gray-600 text-lg">@{userInfo?.username}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge 
                    variant={userInfo?.approved === 'Yes' ? 'default' : 'secondary'}
                    className={userInfo?.approved === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {userInfo?.approved === 'Yes' ? 'Approved' : 'Pending Approval'}
                  </Badge>
                  {userInfo?.utmId && (
                    <Badge variant="outline" className="border-blue-300 text-blue-700">
                      UTM Active
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personal Information */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-gray-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                  {userInfo?.name || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                  {userInfo?.username || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                  {userInfo?.email || 'Not provided'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                  {userInfo?.mobileNumber || 'Not provided'}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media Link</label>
                <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                  {userInfo?.socialMediaLink || 'Not provided'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UTM Information */}
      {userInfo?.utmId && (
        <div className="mb-8">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-600" />
                UTM Campaign Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UTM ID</label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300 font-mono text-sm break-all whitespace-normal min-h-[3rem] flex items-center">
                      {userInfo.utmId}
                    </div>
                    <Button
                      onClick={() => copyToClipboard(userInfo.utmId!)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 whitespace-nowrap"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rate per Lead</label>
                    <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                      ₹{userInfo.ratePerLead || 45}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                    <div className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-300">
                      {userInfo?.withdraw === 'Yes' ? 'Premium' : 'Standard'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Account Status */}
      <div className="mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approval Status</label>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={userInfo?.approved === 'Yes' ? 'default' : 'secondary'}
                    className={userInfo?.approved === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {userInfo?.approved === 'Yes' ? 'Approved' : 'Pending Approval'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  );
}
