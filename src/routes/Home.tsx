import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { Clock, BookOpenCheck, ChevronLeft, Sparkles, Lightbulb, Target, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Home() {
  const role = localStorage.getItem('userRole') || 'student';
  const userName = localStorage.getItem('studentName') || 'المستخدم';

  // Countdown timer logic
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Hero Section with Blue Shapes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-primary-600 to-blue-800 rounded-[2.5rem] p-8 sm:p-12 text-white shadow-2xl shadow-blue-900/20"
        >
          {/* Decorative Shapes */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-right flex-1">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/10">
                <Sparkles className="w-4 h-4 text-blue-100" />
                <span className="text-sm font-bold text-blue-50">مرحباً بعودتك، {userName}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight">
                مستعد لتحقيق <br className="hidden sm:block" />
                <span className="text-blue-200">أفضل النتائج؟</span>
              </h1>
              <p className="text-blue-100 text-lg max-w-lg font-medium">
                منصتك التعليمية المتكاملة لإدارة الاختبارات ومتابعة الأداء الأكاديمي بكل سهولة وفعالية.
              </p>
            </div>
            
            <div className="hidden md:flex w-48 h-48 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 items-center justify-center rotate-3 hover:rotate-6 transition-transform duration-500 shadow-2xl">
              <BookOpenCheck className="w-24 h-24 text-white/80 drop-shadow-lg" />
            </div>
          </div>
        </motion.div>

        {/* Upcoming Exam Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">الاختبار القادم</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="flex-1 text-center lg:text-right w-full">
                <div className="inline-block bg-blue-50 text-blue-600 font-bold px-4 py-1.5 rounded-full text-sm mb-4 border border-blue-100">
                  الرياضيات - الوحدة الثالثة
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">اختبار منتصف الفصل</h3>
                <p className="text-gray-500 font-medium flex items-center justify-center lg:justify-start gap-2">
                  <Calendar className="w-4 h-4" />
                  اليوم، 10:00 صباحاً
                </p>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 p-4 sm:p-6 rounded-3xl border border-gray-100 w-full lg:w-auto justify-center flex-row-reverse">
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">ثانية</span>
                </div>
                <span className="text-2xl font-black text-gray-300 -mt-6">:</span>
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">دقيقة</span>
                </div>
                <span className="text-2xl font-black text-gray-300 -mt-6">:</span>
                <div className="text-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-2">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">{String(timeLeft.hours).padStart(2, '0')}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">ساعة</span>
                </div>
              </div>

              <div className="w-full lg:w-auto">
                <Button className="w-full lg:w-auto px-8 py-6 rounded-2xl text-lg shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform flex-row-reverse">
                  دخول الاختبار
                  <ChevronLeft className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ideas and Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
              <Lightbulb className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">نصيحة اليوم</h3>
            <p className="text-gray-500 leading-relaxed font-medium">
              قم بمراجعة الدروس بشكل دوري ولا تراكم المواد. تقسيم وقت الدراسة إلى فترات قصيرة مع استراحات يساعد على التركيز بشكل أفضل.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-3">أهدافك الحالية</h3>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-700">إتمام المنهج</span>
                  <span className="text-emerald-600">75%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex flex-row-reverse">
                  <div className="h-full bg-emerald-500 rounded-full w-3/4"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="text-gray-700">المعدل التراكمي</span>
                  <span className="text-blue-600">92%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex flex-row-reverse">
                  <div className="h-full bg-blue-500 rounded-full w-[92%]"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
