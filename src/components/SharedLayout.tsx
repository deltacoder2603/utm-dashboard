'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  BarChart3, 
  Megaphone, 
  FileText, 
  DollarSign as DollarSignIcon, 
  UserIcon, 
  Target,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SharedLayoutProps {
  children: React.ReactNode;
  currentPage: string;
  pageTitle: string;
  pageDescription?: string;
}

export default function SharedLayout({ children, currentPage, pageTitle, pageDescription }: SharedLayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isAdmin');
    window.location.href = '/login';
  };

  // Check authentication directly from localStorage
  const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (!savedUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-16 sm:h-20 sm:w-20 bg-gray-800 rounded-2xl shadow-lg mb-6 flex items-center justify-center">
            <Target className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">Please log in to view this page</p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-gray-800 hover:bg-gray-900 text-white px-6 sm:px-8 py-3 rounded-lg font-medium w-full sm:w-auto"
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Left Sidebar - Professional Dark Theme */}
      <div className={`
        fixed lg:fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-80 sm:w-80 md:w-72 lg:w-68 xl:w-72 2xl:w-76 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-screen overflow-y-auto shadow-2xl
        scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-500
      `}>
        {/* Logo/Brand */}
        <div className="p-4 sm:p-5 md:p-5 lg:p-5 xl:p-6 2xl:p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-3 md:space-x-4 lg:space-x-3 xl:space-x-4 2xl:space-x-4">
              <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-9 lg:w-9 xl:h-10 xl:w-10 2xl:h-11 2xl:w-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-5 lg:h-5 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 text-white" />
              </div>
              <span className="font-bold text-base sm:text-lg md:text-xl lg:text-lg xl:text-xl 2xl:text-2xl text-white tracking-wide">UTM Dashboard</span>
            </div>
            {/* Mobile close button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 hover:bg-gray-800 rounded-lg"
            >
              <X className="h-5 w-5 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 sm:p-4 md:p-4 lg:p-4 xl:p-5 2xl:p-5 pb-20">
          <div className="space-y-2 sm:space-y-2 md:space-y-2.5 lg:space-y-2.5 xl:space-y-3 2xl:space-y-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center p-3 sm:p-3.5 md:p-4 lg:p-3.5 xl:p-4 2xl:p-4 rounded-xl cursor-pointer transition-all duration-300 group mx-2 relative z-10 ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-l-4 border-blue-400 shadow-lg' 
                      : 'hover:bg-gray-800 hover:border-l-4 hover:border-gray-500 hover:shadow-md'
                  }`}
                  onClick={() => {
                    console.log('Navigation item clicked:', item.path);
                    router.push(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  onMouseEnter={() => console.log('Hovering over:', item.label)}
                >
                  <div className={`flex items-center space-x-3 sm:space-x-3.5 md:space-x-4 lg:space-x-3.5 xl:space-x-4 2xl:space-x-4 w-full`}>
                    <div className={`h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-7 lg:w-7 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                      <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 2xl:w-4.5 2xl:h-4.5 text-white" />
                    </div>
                    <span className={`font-semibold text-sm sm:text-base md:text-base lg:text-base xl:text-base 2xl:text-lg ${isActive ? 'text-white' : 'text-gray-300'} group-hover:text-white transition-colors duration-300`}>
                      {item.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
        
        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-6 w-6 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-gray-300">N</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">Network Status</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-80 sm:lg:ml-80 md:lg:ml-72 lg:ml-68 xl:lg:ml-72 2xl:lg:ml-76 min-h-screen bg-gray-50">
        {/* Top Header Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 py-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>

            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                  {pageTitle}
                </h1>
                {pageDescription && (
                  <p className="text-xs sm:text-sm text-gray-600">{pageDescription}</p>
                )}
              </div>
              {/* Mobile title */}
              <div className="sm:hidden">
                <h1 className="text-lg font-bold text-gray-900">
                  {pageTitle}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs sm:text-sm text-gray-600">Welcome back,</p>
                <p className="font-medium text-sm sm:text-base text-gray-900">{(() => {
                  if (typeof window !== 'undefined') {
                    const savedUser = localStorage.getItem('user');
                    if (savedUser) {
                      const userData = JSON.parse(savedUser);
                      return userData.name || userData.username || 'User';
                    }
                  }
                  return 'User';
                })()}</p>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
