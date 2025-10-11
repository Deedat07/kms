import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { AdminRegistrationForm } from './AdminRegistrationForm';
import { Key, Shield, Users, Clock } from 'lucide-react';

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <LoginForm onSwitchToRegistration={() => {
            setShowLogin(false);
            setShowRegistration(true);
          }} />
        </div>
      </div>
    );
  }

  if (showRegistration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full space-y-8 p-8">
          <AdminRegistrationForm onSwitchToLogin={() => {
            setShowRegistration(false);
            setShowLogin(true);
          }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-blue-50 to-indigo-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-8">
                  <div className="h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mr-4">
                    <Key className="h-8 w-8 text-white" />
                  </div>
                  <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                    Key Management
                    <span className="block text-indigo-600">System</span>
                  </h1>
                </div>
                
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Secure, efficient key management for educational institutions. 
                  Track key issuance, returns, and maintain complete audit trails 
                  for students, lecturers, and staff.
                </p>
                
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <button
                      onClick={() => setShowRegistration(true)}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10 transition duration-200"
                    >
                      Get Started
                    </button>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <button
                      onClick={() => setShowLogin(true)}
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10 transition duration-200"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-indigo-500 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="text-center text-white p-8">
              <Shield className="h-24 w-24 mx-auto mb-6 opacity-80" />
              <h3 className="text-2xl font-bold mb-4">Secure & Reliable</h3>
              <p className="text-lg opacity-90">
                Built with enterprise-grade security and comprehensive audit trails
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to manage keys
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Comprehensive key management solution designed for educational institutions
            </p>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Users className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">User Management</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Register and manage students, lecturers, and cleaning staff with QR code ID cards
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Key className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Key Tracking</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Track key issuance, returns, and current status with real-time updates
                </p>
              </div>

              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                  <Clock className="h-6 w-6" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Automated Alerts</p>
                <p className="mt-2 ml-16 text-base text-gray-500">
                  Automatic overdue detection with SMS and email notifications
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">Ready to get started?</h3>
            <p className="mt-2 text-base text-gray-500">
              Create your admin account and start managing keys efficiently
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowRegistration(true)}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200"
              >
                Create Admin Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}