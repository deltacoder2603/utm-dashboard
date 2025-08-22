'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (requireAdmin) {
        // Check for admin credentials
        const username = localStorage.getItem('username');
        const password = localStorage.getItem('password');
        
        const isAdminUser =
          (username === 'admin' && password === 'admin@idioticmedia') ||
          (username === 'username-admin' && password === 'password-admin@idioticmedia');
        
        if (!isAdminUser) {
          router.push('/login');
          return;
        }
        
        setIsAuthorized(true);
        setIsLoading(false);
      } else {
        // Check for regular user authentication
        if (!isAuthenticated) {
          router.push('/login');
          return;
        }
        
        setIsAuthorized(true);
        setIsLoading(false);
      }
    };
    
    // Add a small delay to ensure localStorage is available
    setTimeout(checkAuth, 100);
  }, [isAuthenticated, requireAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
