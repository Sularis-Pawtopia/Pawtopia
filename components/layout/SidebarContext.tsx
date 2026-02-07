'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface SidebarContextType {
  isSidebarVisible: boolean;
  registerSidebar: () => void;
  unregisterSidebar: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isSidebarVisible: false,
  registerSidebar: () => {},
  unregisterSidebar: () => {},
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const registerSidebar = useCallback(() => setIsSidebarVisible(true), []);
  const unregisterSidebar = useCallback(() => setIsSidebarVisible(false), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarVisible,
        registerSidebar,
        unregisterSidebar,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
