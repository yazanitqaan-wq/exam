import React from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { Clock, Calendar } from 'lucide-react';

export default function Home() {
  const userName = localStorage.getItem('studentName') || 'المستخدم';

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Upcoming Exam Section (Moved to top, replacing Hero) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary-600 to-blue-800 rounded-[2.5rem] p-6 sm:p-10 text-white shadow-2xl shadow-blue-900/20"
        >
          {/* Decorative Shapes */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-2xl flex items-center justify-center border border-white/20">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">الاختبار القادم</h2>
                <p className="text-blue-100 font-medium">مرحباً بك، {userName}</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/20 shadow-xl relative overflow-hidden">
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                <div className="flex-1 text-center lg:text-right w-full">
                  <div className="inline-block bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
                    لا يوجد اختبارات
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">لا يوجد اختبارات قادمة حالياً</h3>
                  <p className="text-blue-100 font-medium flex items-center justify-center lg:justify-start gap-2">
                    <Calendar className="w-4 h-4" />
                    سيظهر موعد الاختبار هنا عند إضافته
                  </p>
                </div>

                {/* Zeroed Countdown Timer */}
                <div className="flex items-center gap-3 sm:gap-4 bg-black/20 p-4 sm:p-6 rounded-3xl border border-white/10 w-full lg:w-auto justify-center flex-row-reverse">
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                      <span className="text-2xl sm:text-3xl font-black text-white/50">00</span>
                    </div>
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">ثانية</span>
                  </div>
                  <span className="text-2xl font-black text-white/30 -mt-6">:</span>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                      <span className="text-2xl sm:text-3xl font-black text-white/50">00</span>
                    </div>
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">دقيقة</span>
                  </div>
                  <span className="text-2xl font-black text-white/30 -mt-6">:</span>
                  <div className="text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                      <span className="text-2xl sm:text-3xl font-black text-white/50">00</span>
                    </div>
                    <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">ساعة</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </MainLayout>
  );
}
