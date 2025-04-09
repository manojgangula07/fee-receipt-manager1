import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Search,
  BarChart3,
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  Settings,
  Users,
  Plus,
  LogOut,
  Bus,
  Map
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile as useMobile } from '@/hooks/use-mobile';
import { useSettings } from '@/contexts/SettingsContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const isMobile = useMobile();
  const [location] = useLocation();
  
  // If on mobile, use the Sheet component instead of the regular sidebar
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onToggle}>
        <SheetContent side="left" className="p-0 w-72 bg-white border-r border-gray-200 shadow-md">
          <SidebarContent currentPath={location} />
        </SheetContent>
      </Sheet>
    );
  }
  
  // On desktop, show or hide the sidebar based on isOpen
  return (
    <div
      className={cn(
        "fixed md:relative inset-y-0 left-0 z-50 w-[280px] bg-white border-r border-gray-200 shadow-md text-gray-800 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}
    >
      <SidebarContent currentPath={location} />
    </div>
  );
}

interface SidebarContentProps {
  currentPath: string;
}

function SidebarContent({ currentPath }: SidebarContentProps) {
  const { settings } = useSettings();
  const schoolName = settings?.schoolName?.trim() || "School Fee Management";
  const schoolInitials = settings?.schoolName 
    ? settings.schoolName.trim().split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() 
    : "SF";
  
  return (
    <>
      {/* School Logo & Name */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 px-4">
        <div className="flex items-center space-x-3">
          {settings?.logo ? (
            <Avatar className="h-12 w-12">
              <AvatarImage src={settings.logo} alt="School Logo" />
              <AvatarFallback className="bg-primary-600 text-white text-xl font-bold">
                {schoolInitials}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-600 text-white">
              <span className="text-xl font-bold">{schoolInitials}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="mt-5 px-2 overflow-y-auto h-[calc(100vh-4rem)]">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          href="/" 
          isActive={currentPath === '/' || currentPath === '/dashboard'} 
        />

        {/* Fee Management Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Fee Management</p>
          <NavItem 
            icon={<Plus size={20} />} 
            label="Generate Receipt" 
            href="/generate-receipt" 
            isActive={currentPath === '/generate-receipt'} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="View Receipts" 
            href="/view-receipts" 
            isActive={currentPath === '/view-receipts'} 
          />
          <NavItem 
            icon={<FileText size={20} />} 
            label="Fee Structure" 
            href="/fee-structure" 
            isActive={currentPath === '/fee-structure'} 
          />
        </div>

        {/* Excel Management Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Excel Management</p>
          <NavItem 
            icon={<Upload size={20} />} 
            label="Import Excel" 
            href="/excel-import" 
            isActive={currentPath === '/excel-import'} 
          />
          <NavItem 
            icon={<FileSpreadsheet size={20} />} 
            label="Excel Management" 
            href="/excel-management" 
            isActive={currentPath === '/excel-management'} 
          />
        </div>

        {/* Students Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Students</p>
          <NavItem 
            icon={<Users size={20} />} 
            label="Manage Students" 
            href="/students" 
            isActive={currentPath === '/students'} 
          />
        </div>

        {/* Transportation Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Transportation</p>
          <NavItem 
            icon={<Map size={20} />} 
            label="Transportation Routes" 
            href="/transportation-routes" 
            isActive={currentPath === '/transportation-routes'} 
          />
        </div>

        {/* Reports Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Reports</p>
          <NavItem 
            icon={<BarChart3 size={20} />} 
            label="Collection Reports" 
            href="/reports" 
            isActive={currentPath === '/reports'} 
          />
          <NavItem 
            icon={<Search size={20} />} 
            label="Defaulter Lists" 
            href="/defaulters" 
            isActive={currentPath === '/defaulters'} 
          />
        </div>

        {/* Settings Section */}
        <div className="mt-4 border-t border-gray-200 pt-4">
          <p className="px-4 text-xs font-medium uppercase tracking-wider text-gray-500">Settings</p>
          <NavItem 
            icon={<Settings size={20} />} 
            label="System Settings" 
            href="/settings" 
            isActive={currentPath === '/settings'} 
          />
        </div>
        
        {/* Logout - with padding bottom for scroll space */}
        <div className="mt-8 px-4 pb-16">
          <Button 
            variant="outline" 
            className="w-full justify-start border-gray-200 text-gray-700 hover:bg-primary-50 hover:text-primary-700"
          >
            <LogOut className="mr-2 h-5 w-5 text-gray-500" />
            Logout
          </Button>
        </div>
      </nav>
    </>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isActive: boolean;
}

function NavItem({ icon, label, href, isActive }: NavItemProps) {
  return (
    <div className="mb-1">
      <Link href={href}>
        <div className={cn(
          "flex items-center rounded-md px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-primary-50 hover:text-primary-700 cursor-pointer",
          isActive && "bg-primary-100 text-primary-700 font-semibold"
        )}>
          <span className={cn("mr-3", isActive ? "text-primary-700" : "text-gray-500")}>{icon}</span>
          {label}
        </div>
      </Link>
    </div>
  );
}

export default Sidebar;
