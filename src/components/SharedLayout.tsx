'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Megaphone, 
  FileText, 
  DollarSign as DollarSignIcon, 
  UserIcon, 
  User, 
  Target,
  Activity,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface SharedLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  pageTitle: string;
  pageDescription?: string;
}

export default function SharedLayout({ children, currentPage, pageTitle, pageDescription }: SharedLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mx-auto h-20 w-20 bg-gray-800 rounded-2xl shadow-lg mb-6 flex items-center justify-center">
            <Target className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view this page</p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-lg font-medium"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard', color: 'bg-blue-600' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, path: '/campaigns', color: 'bg-green-600' },
    { id: 'reports', label: 'Reports', icon: FileText, path: '/reports', color: 'bg-purple-600' },
    { id: 'withdrawal', label: 'Withdrawal', icon: DollarSignIcon, path: '/withdrawal', color: 'bg-yellow-600' },
    { id: 'account', label: 'Account', icon: UserIcon, path: '/account', color: 'bg-pink-600' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Left Sidebar - Professional Dark Theme */}
      <div className="w-64 bg-gray-900 text-white fixed h-full overflow-y-auto shadow-xl">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-white">UTM Dashboard</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 group ${
                    isActive 
                      ? 'bg-gray-800 border-l-4 border-blue-500' 
                      : 'hover:bg-gray-800 hover:border-l-4 hover:border-gray-600'
                  }`}
                  onClick={() => router.push(item.path)}
                >
                  <div className={`flex items-center space-x-3 w-full`}>
                    <div className={`h-8 w-8 ${item.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'}`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content Area - With Left Margin for Fixed Sidebar */}
      <div className="ml-64 flex-1">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="flex justify-between items-center px-8 py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="text-sm text-gray-600">{pageDescription}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-gray-900">{user.name || user.username || 'User'}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
