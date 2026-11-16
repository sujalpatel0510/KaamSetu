'use client';

import React from 'react';
import DashboardShell from '@/components/DashboardShell';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function BusinessNotificationsPage() {
  return (
    <DashboardShell role="BUSINESS_OWNER">
      <NotificationCenter role="BUSINESS_OWNER" />
    </DashboardShell>
  );
}
