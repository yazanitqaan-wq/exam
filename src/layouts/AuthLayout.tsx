import React from 'react';
import { motion } from 'motion/react';
import { BookOpenCheck } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 relative z-10 py-8 sm:py-12">
        <div className="flex items-center justify-center lg:justify-start gap-2 text-primary-600 font-bold text-2xl mb-8 lg:absolute lg:top-8 lg:right-8 lg:mb-0">
          <BookOpenCheck className="w-8 h-8" />
          <span>إختبارات</span>
        </div>
        {children}
      </div>

      {/* Left Panel - Illustration/Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-primary-600">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-20 text-white text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 mb-8 shadow-2xl">
              <BookOpenCheck className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              بوابة الاختبارات <br /> الإلكترونية
            </h2>
            <p className="text-lg md:text-xl text-blue-100 max-w-md mx-auto leading-relaxed">
              المنصة الرسمية لتقديم الاختبارات الأكاديمية. يرجى إدخال بيانات الدخول المعتمدة للوصول إلى لوحة التحكم الخاصة بك.
            </p>
          </motion.div>

          {/* Floating UI Elements Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-16 w-full max-w-lg relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-primary-600 to-transparent z-10 rounded-t-3xl"></div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-t-3xl p-6 shadow-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-white/20 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-2 bg-white/10 rounded w-full animate-pulse"></div>
                <div className="h-2 bg-white/10 rounded w-5/6 animate-pulse"></div>
                <div className="h-2 bg-white/10 rounded w-4/6 animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
