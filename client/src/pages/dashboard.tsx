import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dashboard as DashboardComponent } from '@/components/dashboard/Dashboard';
import { RecentReceipts } from '@/components/receipt/RecentReceipts';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: recentReceipts, isLoading: isLoadingReceipts } = useQuery({
    queryKey: ['/api/receipts?limit=5'],
  });

  if (isLoadingStats || isLoadingReceipts) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DashboardComponent stats={stats} />
      <RecentReceipts receipts={recentReceipts} />
    </div>
  );
}
