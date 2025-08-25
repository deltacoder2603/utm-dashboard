'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Megaphone, Target, TrendingUp, Users } from 'lucide-react';
import SharedLayout from '@/components/SharedLayout';

export default function CampaignsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <SharedLayout currentPage="campaigns" pageTitle="Campaigns" pageDescription="Please log in to view campaigns">
        <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
            <p className="text-sm sm:text-base text-gray-600">Please log in to view campaigns</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  return (
    <SharedLayout currentPage="campaigns" pageTitle="Campaigns" pageDescription="Manage and track your UTM campaigns">
      {/* Campaign Overview */}
      <div className="mb-6 sm:mb-8">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-green-600 rounded-2xl flex items-center justify-center">
                <Megaphone className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Campaign Management</h2>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600">Track and optimize your UTM campaigns for maximum performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Active Campaigns</h3>
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">1</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Total Leads</h3>
            <div className="text-2xl sm:text-3xl font-bold text-green-600">0</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">From all campaigns</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200 sm:col-span-2 lg:col-span-1">
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">0%</div>
            <p className="text-xs sm:text-sm text-gray-600 mt-2">Lead to conversion</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Details */}
      <div className="mb-6 sm:mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
              Your UTM Campaign
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {user.utmId ? (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Campaign ID</label>
                    <div className="text-gray-900 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 font-mono text-xs sm:text-sm break-all">
                      {user.utmId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Campaign Status</label>
                    <div className="text-gray-900 bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                  <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Campaign Instructions</h4>
                  <p className="text-xs sm:text-sm text-blue-700">
                    Use this UTM ID in your marketing campaigns to track leads and conversions. 
                    All traffic from this UTM will be attributed to your account.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 bg-gray-100 rounded-full mb-4 flex items-center justify-center">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Campaign Assigned</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  You don&apos;t have any UTM campaigns assigned yet. Please contact an administrator to get started.
                </p>
                <Button variant="outline" className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm sm:text-base">
                  Contact Admin
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Campaign Tips */}
      <div className="mb-6 sm:mb-8">
        <Card className="bg-white border-gray-200">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Campaign Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Use Consistent UTM Parameters</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Keep your UTM structure consistent across all marketing channels</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Track Multiple Sources</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Use different UTM parameters for different traffic sources</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">Monitor Performance</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Regularly check your campaign analytics and optimize accordingly</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-5 w-5 sm:h-6 sm:w-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-blue-600">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base">A/B Testing</h4>
                    <p className="text-xs sm:text-sm text-gray-600">Test different UTM parameters to find what works best</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SharedLayout>
  );
}
