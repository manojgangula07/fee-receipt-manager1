import React from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, FileText, Clock, GraduationCap } from 'lucide-react';

interface DashboardProps {
  stats: {
    todayCollection: number;
    receiptsGenerated: number;
    pendingPayments: number;
    totalStudents: number;
  };
}

export function Dashboard({ stats }: DashboardProps) {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight mb-4">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Today's Collection */}
        <StatsCard
          title="Today's Collection"
          value={`₹${stats.todayCollection.toLocaleString()}`}
          icon={Wallet}
          trend={{
            value: "12% more than yesterday",
            isPositive: true
          }}
          iconClassName="bg-primary-100 text-primary-600"
        />

        {/* Receipts Generated */}
        <StatsCard
          title="Receipts Generated"
          value={stats.receiptsGenerated}
          icon={FileText}
          trend={{
            value: "8% increase this week",
            isPositive: true
          }}
          iconClassName="bg-secondary-100 text-secondary-600"
        />

        {/* Pending Payments */}
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon={Clock}
          trend={{
            value: "5% increase from last month",
            isPositive: false
          }}
          iconClassName="bg-yellow-100 text-yellow-600"
        />

        {/* Total Students */}
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={GraduationCap}
          trend={{
            value: "15 new admissions this month",
            isPositive: true
          }}
          iconClassName="bg-blue-100 text-blue-600"
        />
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection Trends</CardTitle>
            <CardDescription>Monthly fee collection statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">Fee collection chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Fee Structure Overview</CardTitle>
            <CardDescription>Distribution of fee types across classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
              <p className="text-gray-500">Fee structure chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;
