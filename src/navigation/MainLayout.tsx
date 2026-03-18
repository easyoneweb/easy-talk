import React from 'react';
import { isWeb } from '@/hooks/usePlatform';
import { MainTabs } from './MainTabs';
import { DesktopSidebar } from './DesktopSidebar';

export function MainLayout() {
  if (isWeb) {
    return <DesktopSidebar />;
  }
  return <MainTabs />;
}
