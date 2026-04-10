import React from 'react';
import { Header } from '@/components/layout/Header';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" dir="rtl">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-blue-600 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center gap-1.5 text-blue-100 text-sm font-medium" dir="ltr">
          <span>Designed by</span>
          <span className="font-black text-white">Yazan Abu Kuhail</span>
        </div>
      </footer>
    </div>
  );
};
