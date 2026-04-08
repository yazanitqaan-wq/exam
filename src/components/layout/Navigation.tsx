import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, User, BookOpenCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navigation = () => {
  const role = localStorage.getItem('userRole') || 'student';
  
  const links = [
    { to: '/home', icon: Home, label: 'الرئيسية' },
    { to: '/profile', icon: User, label: role === 'student' ? 'ملف الطالب' : 'ملف الإدارة' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-6">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-16 h-full gap-1.5 transition-all duration-300',
                  isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn('w-6 h-6 transition-transform duration-300', isActive && 'scale-110')} />
                  <span className="text-[10px] font-bold">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-l border-gray-100 min-h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3 text-primary-600 font-bold text-2xl mb-4">
          <BookOpenCheck className="w-8 h-8" />
          <span>إختبارات</span>
        </div>
        
        <div className="flex flex-col gap-2 px-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300',
                  isActive 
                    ? 'bg-primary-50 text-primary-600' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <link.icon className={cn('w-6 h-6 transition-transform duration-300', isActive && 'scale-110')} />
                  <span className="text-base">{link.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
};
