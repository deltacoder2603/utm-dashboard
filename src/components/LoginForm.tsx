'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock, Target, ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';


export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Use the unified authentication flow for all users (including admin)
      const success = await login(username, password);
      if (success) {
        // Check if the user is admin and redirect accordingly
        if (username === 'admin') {
          router.push('/admin');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Invalid username or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative mx-auto h-20 w-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-3xl shadow-2xl mb-6 flex items-center justify-center group">
              <Target className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-lg text-gray-600">
              Sign in to access your UTM leads dashboard
            </p>
          </div>
          
          {/* Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
            
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {/* Username Field */}
              <div className="group">
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-900 group-hover:text-indigo-500 transition-colors duration-200" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="block w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-indigo-600 transition-colors duration-200">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-900 group-hover:text-indigo-500 transition-colors duration-200" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="block w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-indigo-600 transition-colors duration-200"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-900" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-900" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 p-4 transform animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-2xl text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Signing In...</span>
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </button>
              </div>

              {/* Register Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/register')}
                    className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
                  >
                    Create one here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-white/5 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-1/3 right-10 w-20 h-20 bg-white/5 rounded-full animate-pulse delay-1500"></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white px-12 text-center">
          <div className="mb-8">
            <div className="relative mb-6">
              <Target className="h-24 w-24 text-white/90 mx-auto animate-bounce" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
              UTM Leads Tracker
            </h2>
            <p className="text-xl text-indigo-100 leading-relaxed">
              Track your performance, monitor leads, and maximize your earnings with our comprehensive UTM analytics dashboard.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
              <p className="text-indigo-100 text-sm font-medium">Real-time Analytics</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">💰</div>
              <p className="text-indigo-100 text-sm font-medium">Earnings Tracking</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🚀</div>
              <p className="text-indigo-100 text-sm font-medium">Performance Insights</p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-indigo-100">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm">Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-sm">Lightning-fast performance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
