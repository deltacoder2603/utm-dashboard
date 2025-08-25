'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window !== 'undefined') {
        const savedUser = localStorage.getItem('user');
        console.log('ProtectedRoute: Checking auth, savedUser:', savedUser);
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          console.log('ProtectedRoute: User data:', userData);
          
          if (requireAdmin) {
            // Check for admin user
            const isAdminUser = userData.username === 'admin' && userData.isAdmin === true;
            console.log('ProtectedRoute: Admin check, isAdminUser:', isAdminUser);
            
            if (isAdminUser) {
              setIsAuthorized(true);
              setIsLoading(false);
              return;
            }
          } else {
            // Check for regular user (any user that's not admin)
            const isRegularUser = userData.username !== 'admin' || !userData.isAdmin;
            console.log('ProtectedRoute: Regular user check, isRegularUser:', isRegularUser);
            
            if (isRegularUser) {
              setIsAuthorized(true);
              setIsLoading(false);
              return;
            }
          }
        }
        
        // If not authorized, redirect to login
        console.log('ProtectedRoute: Not authorized, redirecting to login');
        router.push('/login');
      }
    };
    
    // Add a small delay to ensure localStorage is available
    setTimeout(checkAuth, 100);
  }, [requireAdmin, router]);

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
