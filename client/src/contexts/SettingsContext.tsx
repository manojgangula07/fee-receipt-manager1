import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SchoolSettings } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Create the settings context with a default value
const SettingsContext = createContext<{
  settings: SchoolSettings | null;
  isLoading: boolean;
  error: Error | null;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
}>({
  settings: null,
  isLoading: false,
  error: null,
  updateSettings: async () => {}
});

// Provider component to wrap around components that need access to settings
export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  
  // Query to fetch settings
  const { 
    data: settings, 
    isLoading, 
    error 
  } = useQuery<SchoolSettings, Error>({
    queryKey: ['/api/settings'],
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
  
  // Mutation to update settings
  const mutation = useMutation({
    mutationFn: (newSettings: Partial<SchoolSettings>) => {
      return apiRequest('PUT', '/api/settings', newSettings);
    },
    onSuccess: () => {
      // Invalidate the settings query to refetch after update
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    }
  });
  
  // Handler for updating settings
  const updateSettings = useCallback(async (newSettings: Partial<SchoolSettings>) => {
    await mutation.mutateAsync(newSettings);
  }, [mutation]);
  
  // Value to be provided to consumers
  const value = {
    settings: settings || null,
    isLoading,
    error: error || null,
    updateSettings
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};