'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Link, Phone, Lock, ArrowRight, Sparkles, Shield, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    socialMediaLink: '',
    mobileNumber: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      console.log('=== Frontend Registration Attempt ===');
      console.log('Form data:', { ...formData, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' });
      
      // Make API call to register user
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

      const result = await response.json();
      console.log('API Response data:', result);

      if (response.ok) {
        setSuccess('Registration successful! We will come back to you soon.');
        console.log('Registration successful!');
        
        // Don't redirect, just show success message
        // setTimeout(() => {
        //   router.push('/login');
        // }, 2000);
      } else {
        console.error('Registration failed:', result);
        setError(result.error || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      setError(`An error occurred during registration: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-emerald-50 to-green-100">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative mx-auto h-20 w-20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 rounded-3xl shadow-2xl mb-6 flex items-center justify-center group">
              <User className="h-10 w-10 text-white group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-lg text-gray-600">
              Join our UTM leads tracking platform
            </p>
          </div>
          
          {/* Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
            
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit}>
              {/* Name Field */}
              <div className="group">
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="group">
                <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Mail className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Social Media Link Field */}
              <div className="group">
                <Label htmlFor="socialMediaLink" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Social Media Link
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Link className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="socialMediaLink"
                    name="socialMediaLink"
                    type="url"
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="https://instagram.com/username"
                    value={formData.socialMediaLink}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div className="group">
                <Label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Mobile Number
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Phone className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-transform duration-200" />
                  </div>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="+91-9876543210"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Username Field */}
              <div className="group">
                <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Username
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="group">
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2 group-hover:text-green-600 transition-colors duration-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-gray-900 group-hover:text-green-500 transition-colors duration-200" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className="pl-12 py-4 rounded-2xl bg-white/50 backdrop-blur-sm hover:bg-white/80 focus:bg-white shadow-sm hover:shadow-md"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                  />
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

              {/* Success Message */}
              {success && (
                <div className="rounded-2xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 transform animate-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                    <h3 className="text-sm font-medium text-green-800">
                      {success}
                    </h3>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 text-base font-semibold rounded-2xl bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 hover:from-green-700 hover:via-emerald-700 hover:to-green-800 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-[1.02]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Account...</span>
                    </div>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </Button>
              </div>

              {/* Login Link */}
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/login')}
                    className="font-medium text-green-600 hover:text-green-500 transition-colors duration-200 hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 via-emerald-600 to-green-800 relative overflow-hidden">
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
              <User className="h-24 w-24 text-white/90 mx-auto animate-bounce" />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent">
              Join Our Platform
            </h2>
            <p className="text-xl text-green-100 leading-relaxed">
              Start tracking your UTM leads, monitor performance, and maximize your earnings with our comprehensive analytics dashboard.
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-8 mt-12">
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">🚀</div>
              <p className="text-green-100 text-sm font-medium">Quick Setup</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
              <p className="text-green-100 text-sm font-medium">Real-time Analytics</p>
            </div>
            <div className="text-center group">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">💰</div>
              <p className="text-green-100 text-sm font-medium">Earnings Tracking</p>
            </div>
          </div>
          
          {/* Feature highlights */}
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-green-100">
              <Shield className="h-5 w-5 text-green-400" />
              <span className="text-sm">Enterprise-grade security</span>
            </div>
            <div className="flex items-center gap-3 text-green-100">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span className="text-sm">Lightning-fast performance</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
