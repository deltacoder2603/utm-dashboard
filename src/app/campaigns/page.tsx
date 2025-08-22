'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BarChart3,
  Megaphone,
  FileText,
  DollarSign,
  User as UserIcon,
  User
} from 'lucide-react';

export default function CampaignsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Please log in to view campaigns</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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
            
            <div className="flex items-center p-4 bg-blue-700/50 rounded-xl cursor-pointer border border-blue-600/30">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold">Campaigns</span>
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
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-end">
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 bg-gradient-to-br from-green-500 to-teal-600 rounded-3xl shadow-2xl mb-6 flex items-center justify-center">
              <Megaphone className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent mb-4">Campaigns</h1>
            <p className="text-xl text-gray-600 mb-8">No data to display</p>
            <div className="max-w-md mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Getting Started</h3>
                <p className="text-gray-600 text-sm mb-4">Create your first UTM campaign to start generating leads and earning money.</p>
                <button className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:from-green-600 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
