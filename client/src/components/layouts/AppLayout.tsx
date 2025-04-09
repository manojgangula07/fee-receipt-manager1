import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPath, setCurrentPath] = useLocation();
  const [pageTitle, setPageTitle] = useState("Dashboard");

  // Set page title based on current path
  useEffect(() => {
    switch (currentPath) {
      case "/":
        setPageTitle("Dashboard");
        break;
      case "/generate-receipt":
        setPageTitle("Generate Receipt");
        break;
      case "/search-receipts":
        setPageTitle("Search Receipts");
        break;
      case "/student-management":
        setPageTitle("Student Management");
        break;
      case "/excel-management":
        setPageTitle("Excel Management");
        break;
      case "/reports":
        setPageTitle("Reports");
        break;
      default:
        setPageTitle("Dashboard");
    }
  }, [currentPath]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      
      {/* Main Content Area */}
      <div className="flex-1 md:ml-64">
        {/* Top Header Bar */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sticky top-0 z-5">
          {/* Toggle Sidebar Button (Mobile) */}
          <button className="md:hidden mr-2" onClick={toggleSidebar}>
            <span className="material-icons text-text-primary">menu</span>
          </button>
          
          {/* Page Title */}
          <h2 className="text-text-primary font-condensed text-xl hidden md:block">{pageTitle}</h2>
          
          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <span className="material-icons absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary">search</span>
              <input 
                type="text" 
                placeholder="Search students, receipts or payments" 
                className="w-full pl-10 pr-4 py-2 border border-background-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          {/* User Menu & Notifications */}
          <div className="flex items-center">
            {/* Notifications */}
            <button className="relative p-2 mr-2">
              <span className="material-icons text-text-secondary">notifications</span>
              <span className="absolute top-1 right-1 bg-error text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">3</span>
            </button>
            
            {/* User Menu */}
            <div className="flex items-center cursor-pointer">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white mr-2">
                <span className="text-sm font-medium">JD</span>
              </div>
              <div className="hidden md:block">
                <p className="text-text-primary text-sm">John Doe</p>
                <p className="text-text-secondary text-xs">Administrator</p>
              </div>
              <span className="material-icons text-text-secondary ml-1">arrow_drop_down</span>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="p-4 md:p-6 pb-20">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
