import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenCheck, LogOut, Menu, X, User, Home, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const Header = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const role = localStorage.getItem('userRole') || 'student';
  const userName = localStorage.getItem('studentName') || 'المستخدم';

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.removeItem('userRole');
      localStorage.removeItem('studentName');
      localStorage.removeItem('studentId');
      navigate('/login');
    }, 1500); // 1.5s delay for the loading animation
  };

  const navLinks = [
    { to: '/home', icon: Home, label: 'الرئيسية' },
    { to: '/profile', icon: User, label: role === 'student' ? 'ملفي الشخصي' : 'ملف الإدارة' },
  ];

  return (
    <>
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <h2 className="text-xl font-black text-gray-900">جاري تسجيل الخروج...</h2>
              <p className="text-gray-500 mt-2 font-medium">نراك قريباً!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-[60] w-full bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div 
              onClick={() => navigate('/home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 text-white group-hover:scale-105 transition-transform duration-300">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <span className="hidden xs:block font-black text-xl text-gray-900 tracking-tight">
                منصة <span className="text-primary-600">اختبارات</span>
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-2 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-100">
                {navLinks.map((link) => {
                  const isActive = window.location.pathname === link.to;
                  return (
                    <button
                      key={link.to}
                      onClick={() => navigate(link.to)}
                      className={cn(
                        "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
                        isActive
                          ? "bg-white text-primary-600 shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
                      )}
                    >
                      <link.icon className={cn("w-4 h-4", isActive ? "text-primary-600" : "text-gray-400")} />
                      {link.label}
                    </button>
                  );
                })}
              </nav>

              <div className="h-8 w-px bg-gray-200 mx-2"></div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden lg:block">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">مرحباً بك</p>
                  <p className="text-sm font-black text-gray-900">{userName}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="rounded-xl border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 font-bold"
                >
                  <LogOut className="w-4 h-4 ml-2" />
                  خروج
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2.5 rounded-xl bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/40 z-[70] md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.2, ease: 'easeOut' }}
              className="fixed top-0 right-0 bottom-0 w-[280px] bg-white z-[80] md:hidden shadow-2xl border-l border-gray-100 flex flex-col"
            >
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2 text-primary-600 font-black text-xl">
                  <BookOpenCheck className="w-6 h-6" />
                  <span>إختبارات</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 flex-1">
                <div className="mb-8">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black text-xl">
                      {userName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">الحساب الحالي</p>
                      <p className="text-base font-black text-gray-900 truncate max-w-[140px]">{userName}</p>
                    </div>
                  </div>
                </div>

                <nav className="space-y-2">
                  {navLinks.map((link) => (
                    <button
                      key={link.to}
                      onClick={() => {
                        navigate(link.to);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-bold transition-all",
                        window.location.pathname === link.to
                          ? "bg-primary-50 text-primary-600"
                          : "text-gray-500 hover:bg-gray-50"
                      )}
                    >
                      <link.icon className="w-6 h-6" />
                      <span>{link.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6 border-t border-gray-50">
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full rounded-2xl border-red-100 text-red-600 hover:bg-red-50 py-6 font-bold"
                >
                  <LogOut className="w-5 h-5 ml-2" />
                  تسجيل الخروج
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
