'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { clientLogout } from '@/lib/actions/auth.actions';

interface NavbarProps {
  user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    role: 'adopter' | 'shelter' | 'admin';
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await clientLogout();
      // Force full page reload to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to sign out. Please try again.');
      setIsLoggingOut(false);
    }
  };

  const navLinks = [
    { href: '/dashboard', label: 'Home', icon: '🏠' },
    { href: '/pets', label: 'Browse Pets', icon: '🐾' },
    { href: '/explore', label: 'Explore', icon: '🔍' },
    { href: '/lost-pets', label: 'Lost & Found', icon: '📢' },
    { href: '/events', label: 'Events', icon: '📅' },
    { href: '/stories', label: 'Success Stories', icon: '❤️' },
    { href: '/store', label: 'Store', icon: '🛍️' },
  ];

  const shelterLinks = [
    { href: '/shelter', label: 'Shelter Dashboard', icon: '🏢' },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  if (!user) {
    return null; // Don't show navbar on landing/auth pages
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary-600">
            <span>🐾</span>
            <span className="hidden sm:inline">Pawtopia</span>
          </Link>


          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <span className="text-xl">🔔</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-600 font-semibold">
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700">
                  {user.full_name || user.username}
                </span>
                <span className="text-gray-400">▼</span>
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{user.full_name || user.username}</p>
                    <p className="text-xs text-gray-500">@{user.username}</p>
                    <p className="text-xs text-primary-600 capitalize mt-1">{user.role}</p>
                  </div>
                  
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <span>👤</span>
                    <span>My Profile</span>
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <span>⚙️</span>
                    <span>Settings</span>
                  </Link>
                  
                  <hr className="my-2" />
                  
                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{isLoggingOut ? '⏳' : '🚪'}</span>
                    <span>{isLoggingOut ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              {user.role === 'shelter' && shelterLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {isProfileMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileMenuOpen(false)}
        />
      )}
    </nav>
  );
}
