'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useMemo } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { useSidebar } from './SidebarContext';
import {
  Home, Heart, Calendar, MapPin, BookOpen,
  Menu, X, Bell, PawPrint, Settings, LogOut, BarChart3, ClipboardList, Stethoscope,
} from 'lucide-react';

interface NavbarProps {
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role: string;
    [key: string]: any;
  };
}

interface NavTab {
  href: string;
  label: string;
  icon: any;
}

const mainNavTabs: NavTab[] = [
  { href: '/dashboard', label: 'Feed', icon: Home },
  { href: '/healthcare', label: 'Healthcare', icon: Stethoscope },
  { href: '/pets', label: 'Companions', icon: Heart },
  { href: '/events', label: 'Events', icon: Calendar },
  { href: '/lost-pets', label: 'Lost & Found', icon: MapPin },
  { href: '/stories', label: 'Stories', icon: BookOpen },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { isSidebarVisible, isDrawerOpen, openDrawer, closeDrawer } = useSidebar();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const roleTabs: NavTab[] = user.role === 'shelter'
    ? [
      { href: '/shelter', label: 'Shelter Insights', icon: BarChart3 },
      { href: '/shelter/operations', label: 'Shelter Ops', icon: ClipboardList },
    ]
    : user.role === 'dvmf'
      ? [
        { href: '/dvmf', label: 'DVMF Insights', icon: BarChart3 },
        { href: '/dvmf/operations', label: 'DVMF Ops', icon: ClipboardList },
      ]
      : user.role === 'ngo'
        ? [
          { href: '/dashboard', label: 'NGO Insights', icon: BarChart3 },
          { href: '/dashboard/ngo-operations', label: 'NGO Ops', icon: ClipboardList },
        ]
        : [];

  const navTabs = useMemo(() => {
    const roleFilteredMainTabs = ['adopter', 'volunteer', 'regular_user'].includes(user.role)
      ? mainNavTabs
      : mainNavTabs.filter((tab) => tab.href !== '/healthcare');

    const seen = new Set<string>();
    return [...roleTabs, ...roleFilteredMainTabs].filter((tab) => {
      if (seen.has(tab.href)) return false;
      seen.add(tab.href);
      return true;
    });
  }, [roleTabs, user.role]);

  const activeHref = useMemo(() => {
    let bestMatch = '';
    for (const tab of navTabs) {
      const matches = pathname === tab.href || pathname.startsWith(tab.href + '/');
      if (!matches) continue;
      if (tab.href.length > bestMatch.length) {
        bestMatch = tab.href;
      }
    }
    return bestMatch;
  }, [pathname, navTabs]);

  const isActive = (href: string) => href === activeHref;

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close everything on route change
  useEffect(() => {
    closeDrawer();
    setIsProfileOpen(false);
  }, [pathname, closeDrawer]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await callApiAction('auth', 'clientLogout', []);
      window.location.href = '/';
    } catch {
      setIsLoggingOut(false);
    }
  };

  // Hide on landing, auth, and onboarding pages
  if (pathname === '/' || pathname.startsWith('/auth') || pathname.startsWith('/onboarding')) {
    return null;
  }

  return (
    <>
      {/* ── Fixed Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
        <div className="h-full px-4 flex items-center">
          {/* Left ─ Logo */}
          <div className="flex items-center gap-2 min-w-[56px] md:min-w-[200px]">
            <Link
              href={user.role === 'shelter' ? '/shelter' : user.role === 'dvmf' ? '/dvmf' : '/dashboard'}
              className="flex items-center gap-2"
            >
              <PawPrint className="w-8 h-8 text-primary-500" />
              <span className="text-xl font-bold text-gray-900 hidden md:inline">
                Pawtopia
              </span>
            </Link>
          </div>

          {/* Center ─ Tab Navigation (hidden on small screens) */}
          <div className="hidden md:flex items-center justify-center flex-1 h-full">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative flex items-center justify-center h-full px-3 lg:px-5 xl:px-8 transition-colors group ${
                    active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 1.5} />
                  {active && (
                    <div className="absolute bottom-0 left-1 right-1 h-[3px] bg-primary-500 rounded-t-full" />
                  )}
                  {/* Hover bg */}
                  <div
                    className={`absolute inset-x-1 inset-y-1 rounded-lg -z-10 transition-colors ${
                      active ? '' : 'group-hover:bg-gray-100'
                    }`}
                  />
                  {/* Tooltip */}
                  <span className="absolute top-full mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                    {tab.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Right ─ Actions */}
          <div className="flex items-center gap-1.5 ml-auto md:ml-0 md:min-w-[200px] justify-end">
            {/* Menu button: always on mobile, on desktop only when sidebar is absent */}
            <button
              onClick={openDrawer}
              className={`p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${
                isSidebarVisible ? 'lg:hidden' : ''
              }`}
              aria-label="Menu"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>

            {/* Notifications */}
            <button className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors relative">
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-0.5 rounded-full hover:ring-2 hover:ring-gray-200 transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-primary-600 font-semibold text-sm">
                      {user.username?.[0]?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50">
                  {/* Profile card */}
                  <Link
                    href={`/profile/${user.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary-600 font-semibold">
                          {user.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[15px] text-gray-900">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500">See your profile</p>
                    </div>
                  </Link>

                  <div className="mx-3 border-t border-gray-100" />

                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <Settings className="w-[18px] h-[18px] text-gray-700" />
                    </div>
                    <span className="text-[15px] text-gray-700">Settings</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                      <LogOut className="w-[18px] h-[18px] text-gray-700" />
                    </div>
                    <span className="text-[15px] text-gray-700">
                      {isLoggingOut ? 'Signing out...' : 'Sign out'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Spacer (pushes page content below fixed navbar) ── */}
      <div className="h-14" />

      {/* ── Navigation Drawer (mobile + desktop when no sidebar) ── */}
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={closeDrawer}
          />
          <aside className="fixed top-0 left-0 w-[320px] max-w-[85vw] h-full bg-white z-[70] shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Menu</h2>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* User card */}
            <Link
              href={`/profile/${user.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50"
              onClick={closeDrawer}
            >
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-primary-600 font-semibold">
                    {user.username?.[0]?.toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-[15px] text-gray-900">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </Link>

            <div className="mx-4 border-t border-gray-100" />

            {/* Navigation links */}
            <nav className="p-2">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      active
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={closeDrawer}
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${
                        active ? 'bg-primary-100' : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-600'}`}
                      />
                    </div>
                    <span className="text-[15px]">{tab.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mx-4 border-t border-gray-100" />

            <div className="p-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100"
                onClick={closeDrawer}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-[15px]">Settings</span>
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
