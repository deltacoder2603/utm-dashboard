'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUTMData } from '@/lib/sheets';
import { LeadStats } from '@/types';
import { LogOut, RefreshCw, TrendingUp, Users, DollarSign, Target, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchUTMData();
      setStats(data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleRefresh = () => {
    loadData();
  };

  const handleWithdraw = () => {
    setShowWithdrawConfirm(true);
  };

  const confirmWithdraw = async () => {
    setIsWithdrawing(true);
    try {
      // Make API call to withdraw user
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: user?.username,
          utmId: user?.utmId
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Logout user after successful withdrawal
        logout();
      } else {
        setError(result.error || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setError('An error occurred during withdrawal');
    } finally {
      setIsWithdrawing(false);
      setShowWithdrawConfirm(false);
    }
  };

  const cancelWithdraw = () => {
    setShowWithdrawConfirm(false);
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Find user's UTM data
  const userUTMData = stats?.utmData.find(utm => utm.utmId === user.utmId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">UTM Leads Dashboard</h1>
              <p className="text-gray-600 text-lg mt-1">Welcome back, {user.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200"
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200"
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Withdraw
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 p-6 border border-red-200 shadow-sm">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* User UTM Info */}
        <div className="mb-8">
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center border border-indigo-200">
                    <Target className="h-7 w-7 text-indigo-600" />
                  </div>
                </div>
                <div className="ml-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your UTM ID</h3>
                  <p className="text-gray-600 font-mono bg-gray-100 px-3 py-2 rounded-lg border border-gray-200 inline-block">
                    {user.utmId}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Performance - Main Stats */}
        {userUTMData && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Performance Overview</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Total Leads */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center border border-blue-200">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Leads</dt>
                        <dd className="text-2xl font-bold text-gray-900">{userUTMData.leadCount.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Earnings */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center border border-green-200">
                        <DollarSign className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
                        <dd className="text-2xl font-bold text-gray-900">₹{userUTMData.earnings.toLocaleString()}</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rate per Lead */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center border border-purple-200">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Rate per Lead</dt>
                        <dd className="text-2xl font-bold text-gray-900">₹45</dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200 hover:shadow-xl transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center border border-orange-200">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Status</dt>
                        <dd className="text-2xl font-bold text-gray-900">
                          {userUTMData.leadCount > 0 ? 'Active' : 'Pending'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Data Message */}
        {!userUTMData && !isLoading && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Data Found</h3>
              <p className="text-lg text-gray-600 mb-6">No performance data found for your UTM ID: <span className="font-mono bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{user.utmId}</span></p>
              <button 
                onClick={handleRefresh}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors duration-200 shadow-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-6"></div>
              <p className="text-xl text-gray-600">Loading your performance data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Confirmation Modal */}
      {showWithdrawConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Confirm Withdrawal</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to withdraw? This action will:
                <br />
                • Remove all your data from the system
                <br />
                • Delete your account permanently
                <br />
                • Cannot be undone
              </p>
              
              <div className="flex space-x-4">
                <button
                  onClick={cancelWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmWithdraw}
                  disabled={isWithdrawing}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 disabled:opacity-50"
                >
                  {isWithdrawing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
