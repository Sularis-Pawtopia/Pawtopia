'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Compass, 
  Heart, 
  Calendar, 
  MapPin, 
  BookOpen, 
  ShoppingBag,
  Menu,
  X,
  User,
  Settings,
  LogOut,
  PawPrint,
  LayoutDashboard,
  Newspaper
} from 'lucide-react';

interface SidebarProps {
  user: any;
}

// Base navigation items (shared by all users)
const baseNavigation = [
  { name: 'Explore Pets', href: '/explore', icon: Compass },
  { name: 'Adoptable Pets', href: '/pets', icon: Heart },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Lost Pets', href: '/lost-pets', icon: MapPin },
  { name: 'Stories', href: '/stories', icon: BookOpen },
  { name: 'Store', href: '/store', icon: ShoppingBag },
];

export function Sidebar({ user }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  // Build navigation dynamically based on user role
  const navigation = useMemo(() => {
    const isShelter = user?.role === 'shelter';
    
    if (isShelter) {
      // Shelter users: Show Shelter Dashboard first, then Feed
      return [
        { name: 'Shelter Dashboard', href: '/shelter', icon: LayoutDashboard },
        { name: 'Feed', href: '/dashboard', icon: Newspaper },
        ...baseNavigation,
      ];
    }
    
    // Regular users: Show Feed as primary
    return [
      { name: 'Feed', href: '/dashboard', icon: Home },
      ...baseNavigation,
    ];
  }, [user?.role]);

  return (
    <>
      {/* Mobile backdrop */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
          isCollapsed ? 'w-0 lg:w-20' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <Link href={user?.role === 'shelter' ? '/shelter' : '/dashboard'} className="flex items-center gap-2">
                <PawPrint className="w-8 h-8 text-primary-500" />
                <span className="text-xl font-bold text-gray-900">Pawtopia</span>
              </Link>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <Menu className="w-5 h-5 text-gray-600" />
              ) : (
                <X className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Spacer to prevent content from going under sidebar */}
      <div className={`transition-all duration-300 ${isCollapsed ? 'w-0 lg:w-20' : 'w-64'}`} />
    </>
  );
}
