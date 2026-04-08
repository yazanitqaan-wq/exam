import React from 'react';
import { Header } from '@/components/layout/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
};
