import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  HelpCircle, 
  Bell,
  ChevronDown,
  User,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/contexts/SettingsContext';
import { Link } from 'wouter';

interface TopBarProps {
  onSidebarToggle: () => void;
  title?: string;
  sidebarOpen?: boolean;
}

export function TopBar({ onSidebarToggle, title, sidebarOpen }: TopBarProps) {
  const [notificationCount] = useState(3);
  const { settings } = useSettings();
  
  // If title is provided, use it, otherwise use school name from settings, or a default
  const displayTitle = title || settings?.schoolName?.trim() || "Fee Receipt Generator";
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left Section: Hamburger and Title */}
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onSidebarToggle}
            className="mr-4 flex md:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          {settings?.logo && (
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage src={settings.logo} alt={settings?.schoolName || "School logo"} />
              <AvatarFallback className="bg-primary-100 text-primary-700">
                {settings?.schoolName?.slice(0, 2) || "SC"}
              </AvatarFallback>
            </Avatar>
          )}
          
          <h1 className="text-xl font-semibold text-gray-800">{displayTitle}</h1>
        </div>

        {/* Right Section: Notifications and User Profile */}
        <div className="flex items-center space-x-4">
          {/* Help Button */}
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
            <HelpCircle className="h-6 w-6" />
          </Button>

          {/* Notifications Button */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
              <Bell className="h-6 w-6" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center space-x-2"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-600 text-white">AS</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium text-gray-700 md:block">Admin Staff</span>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Your Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings" className="flex items-center w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

export default TopBar;
