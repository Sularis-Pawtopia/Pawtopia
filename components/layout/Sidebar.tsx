'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './SidebarContext';
import {
  Home,
  Heart,
  Calendar,
  MapPin,
  BookOpen,
  Stethoscope,
  BarChart3,
  ClipboardList,
  Settings,
  Newspaper,
} from 'lucide-react';

interface SidebarProps {
  user: any;
}

const baseNavigation = [
  { name: 'Companions', href: '/pets', icon: Heart },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Lost & Found', href: '/lost-pets', icon: MapPin },
  { name: 'Stories', href: '/stories', icon: BookOpen },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { registerSidebar, unregisterSidebar } = useSidebar();

  // Tell the Navbar that a sidebar is visible on this page
  useEffect(() => {
    registerSidebar();
    return () => unregisterSidebar();
  }, [registerSidebar, unregisterSidebar]);

  const navigation = useMemo(() => {
    if (user?.role === 'shelter') {
      return [
        { name: 'Shelter Insights', href: '/shelter', icon: BarChart3 },
        { name: 'Shelter Operations', href: '/shelter/operations', icon: ClipboardList },
        { name: 'Feed', href: '/dashboard', icon: Newspaper },
        ...baseNavigation,
      ];
    }
    if (user?.role === 'dvmf') {
      return [
        { name: 'DVMF Insights', href: '/dvmf', icon: BarChart3 },
        { name: 'DVMF Operations', href: '/dvmf/operations', icon: ClipboardList },
        { name: 'Feed', href: '/dashboard', icon: Newspaper },
        ...baseNavigation,
      ];
    }
    if (user?.role === 'ngo') {
      return [
        { name: 'NGO Insights', href: '/dashboard', icon: BarChart3 },
        { name: 'NGO Operations', href: '/dashboard/ngo-operations', icon: ClipboardList },
        ...baseNavigation,
      ];
    }
    const healthcareNav = ['adopter', 'volunteer', 'regular_user'].includes(user?.role)
      ? [{ name: 'Healthcare', href: '/healthcare', icon: Stethoscope }]
      : [];

    return [
      { name: 'Feed', href: '/dashboard', icon: Home },
      ...healthcareNav,
      ...baseNavigation,
    ];
  }, [user?.role]);

  const activeHref = useMemo(() => {
    let bestMatch = '';
    for (const item of navigation) {
      const matches = pathname === item.href || pathname.startsWith(item.href + '/');
      if (!matches) continue;
      if (item.href.length > bestMatch.length) {
        bestMatch = item.href;
      }
    }
    return bestMatch;
  }, [pathname, navigation]);

  const isActive = (href: string) => href === activeHref;

  return (
    <>
      {/* ── Desktop sidebar — fixed, non-collapsible, FB-style ── */}
      <aside className="hidden lg:flex flex-col fixed top-14 left-0 w-[280px] h-[calc(100vh-3.5rem)] overflow-y-auto pt-2 px-2">
        {/* User profile card */}
        {user && (
          <Link
            href={`/profile/${user.id}`}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors ${
              pathname.startsWith('/profile')
                ? 'bg-primary-50'
                : 'hover:bg-gray-100'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-600 font-semibold text-sm">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </span>
              )}
            </div>
            <span className="font-semibold text-[15px] text-gray-900 truncate">
              {user.username}
            </span>
          </Link>
        )}

        {/* Navigation */}
        <nav className="mt-1 space-y-0.5 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors ${
                  active
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    active ? 'bg-primary-100' : 'bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-primary-600' : 'text-gray-600'}`} />
                </div>
                <span className="text-[15px]">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Settings link */}
        <div className="mt-2 pt-2 border-t border-gray-200 pb-4">
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors ${
              pathname === '/settings'
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <span className="text-[15px]">Settings</span>
          </Link>
        </div>
      </aside>

      {/* Spacer — reserves left space so flex content doesn't go under the fixed sidebar */}
      <div className="hidden lg:block w-[280px] flex-shrink-0" />
    </>
  );
}
