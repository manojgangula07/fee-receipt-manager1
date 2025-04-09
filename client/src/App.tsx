import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { SettingsProvider } from "@/contexts/SettingsContext";

import Dashboard from "@/pages/dashboard";
import GenerateReceipt from "@/pages/generate-receipt";
import ViewReceipts from "@/pages/view-receipts";
import ExcelImport from "@/pages/excel-import";
import ExcelManagement from "@/pages/excel-management";
import FeeStructure from "@/pages/fee-structure";
import Reports from "@/pages/reports";
import TransportationRoutes from "@/pages/transportation-routes";
import Students from "@/pages/students";
import Defaulters from "@/pages/defaulters";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleContentClick = () => {
    // Close sidebar when content area is clicked (only on mobile)
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      <div className="relative flex-1 flex flex-col overflow-hidden" onClick={handleContentClick}>
        <TopBar onSidebarToggle={toggleSidebar} sidebarOpen={sidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/generate-receipt" component={GenerateReceipt} />
            <Route path="/view-receipts" component={ViewReceipts} />
            <Route path="/excel-import" component={ExcelImport} />
            <Route path="/excel-management" component={ExcelManagement} />
            <Route path="/fee-structure" component={FeeStructure} />
            <Route path="/transportation-routes" component={TransportationRoutes} />
            <Route path="/students" component={Students} />
            <Route path="/reports" component={Reports} />
            <Route path="/defaulters" component={Defaulters} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <Router />
        <Toaster />
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
