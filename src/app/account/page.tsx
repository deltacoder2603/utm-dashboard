'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, Copy, Check, DollarSign, BarChart3, Megaphone, FileText } from 'lucide-react';
import { WithdrawalRequest } from '@/lib/withdrawal-store';
import { useRouter } from 'next/navigation';

interface UserRegistration {
  id: number;
  name: string;
  email: string;
  socialMedia: string;
  mobile: string;
  username: string;
  approved: boolean;
}

export default function AccountPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // Load user's withdrawal requests
  const loadWithdrawalRequests = async () => {
    if (!user?.username) return;
    
    setLoadingRequests(true);
    try {
      const response = await fetch(`/api/withdrawal-requests?username=${encodeURIComponent(user.username)}`);
      if (response.ok) {
        const data = await response.json();
        setWithdrawalRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load withdrawal requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Load data when component mounts
  useEffect(() => {
    loadWithdrawalRequests();
  }, [user]);

  const copyUTMId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!user) return;

    setIsSubmitting(true);
    
    try {
      // Call the actual withdrawal request API
      const response = await fetch('/api/withdrawal-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user.username,
          utmId: user.utmId,
          name: user.name,
        }),
      });

      if (response.ok) {
        await response.json(); // Just consume the response
        alert('Withdrawal request submitted successfully! An administrator will review your request.');
        // Reload withdrawal requests to show the new one
        await loadWithdrawalRequests();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Withdrawal request failed:', error);
      alert(`Failed to submit withdrawal request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Sidebar - Dark Blue - Fixed */}
      <div className="w-64 bg-gradient-to-b from-blue-900 to-blue-800 text-white fixed h-full overflow-y-auto shadow-2xl">
        {/* Navigation Menu */}
        <nav className="p-6">
          <div className="space-y-3">
            <div className="flex items-center p-4 hover:bg-blue-700/30 rounded-xl cursor-pointer transition-all duration-200 group" onClick={() => router.push('/dashboard')}>
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span>Dashboard</span>
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
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span>Invoice</span>
              </div>
            </div>
            
            <div className="flex items-center p-4 bg-blue-700/50 rounded-xl cursor-pointer border border-blue-600/30">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">Account</span>
              </div>
            </div>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Account Management</h1>
          <p className="text-gray-600 text-lg">Manage your profile and account settings</p>
        </div>

        {/* Account Information Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Account Details</h2>
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
                <span className="text-gray-600 font-medium">Email</span>
                <span className="text-gray-900 font-semibold">{user.email || 'N/A'}</span>
              </div>
            </div>
            
            <div className="space-y-4">
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
              <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                <span className="text-gray-600 font-medium">Registration Date</span>
                <span className="text-gray-900 font-semibold">N/A</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                <span className="text-gray-600 font-medium">Account Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-6 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Request Withdrawal</h2>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-6">Click the button below to request a withdrawal of your earnings.</p>
            <button
              onClick={handleWithdrawalRequest}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </div>

        {/* Withdrawal History Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <DollarSign className="h-6 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Your Withdrawal Requests</h2>
          </div>
          
          {loadingRequests ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading withdrawal requests...</p>
            </div>
          ) : withdrawalRequests.length > 0 ? (
            <div className="space-y-4">
              {withdrawalRequests.map((request) => (
                <div key={request.id} className="bg-gray-50/50 rounded-2xl p-6 border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                        request.status === 'approved' ? 'bg-green-100' :
                        request.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        {request.status === 'approved' ? (
                          <Check className="h-5 w-5 text-green-600" />
                        ) : request.status === 'rejected' ? (
                          <DollarSign className="h-5 w-5 text-red-600" />
                        ) : (
                          <DollarSign className="h-5 w-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">Request #{request.id}</p>
                        <p className="text-sm text-gray-600">Submitted on {new Date(request.requestDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        request.status === 'approved' ? 'bg-green-100 text-green-800' :
                        request.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </div>
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
              <p className="text-gray-600">You haven&apos;t made any withdrawal requests yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
