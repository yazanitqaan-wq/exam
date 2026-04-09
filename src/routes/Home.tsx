import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { Clock, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Home() {
  const userName = localStorage.getItem('studentName') || 'المستخدم';
  const studentId = localStorage.getItem('studentId');
  
  const [upcomingSession, setUpcomingSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isExamActive, setIsExamActive] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const channelId = `exam_sessions_${studentId}_${Date.now()}`;
    const channel = supabase.channel(channelId);

    const setupRealtime = async () => {
      setIsLoading(true);
      try {
        // 1. جلب بيانات الصف الخاص بالطالب
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('grade, section, name')
          .eq('id_number', studentId)
          .single();

        if (!isMounted) return;
        
        if (studentError || !studentData) {
          console.error('Error fetching student data:', studentError);
          setDebugInfo(`خطأ في جلب بيانات الطالب: ${studentError?.message || 'لا توجد بيانات'}`);
          setIsLoading(false);
          return;
        }

        const grade = studentData.grade?.trim() || '';
        const section = studentData.section?.trim() || '';
        const studentClassExact = `${grade} ${section}`.trim();
        
        console.log('Student Class:', studentClassExact);

        // 2. دالة جلب الامتحانات المتاحة
        const fetchExams = async () => {
          const { data: sessions, error } = await supabase
            .from('exam_sessions')
            .select(`
              id,
              start_time,
              end_time,
              target_classes,
              status,
              exams ( id, title, subject )
            `)
            .order('start_time', { ascending: true });

          if (!isMounted) return;
          
          if (error) {
            console.error('Error fetching sessions:', error);
            setDebugInfo(`خطأ في جلب الجلسات: ${error.message}`);
            return;
          }

          console.log('All Sessions found:', sessions?.length);

          if (sessions) {
            const now = new Date();
            const validSession = sessions.find(s => {
              // التحقق من أن وقت الانتهاء في المستقبل (أو لم ينتهِ بعد بـ 10 دقائق)
              const endTime = new Date(s.end_time);
              if (endTime <= now) return false;
              
              // التحقق من مطابقة الصف
              const targetClasses = Array.isArray(s.target_classes) ? s.target_classes : [];
              const isClassMatch = targetClasses.some(c => {
                const cleanC = c.trim().replace(/\s+/g, ' ');
                const cleanStudentClass = studentClassExact.trim().replace(/\s+/g, ' ');
                
                // تطابق تام
                if (cleanC === cleanStudentClass) return true;
                
                // تطابق بدون مسافات (للحالات الصعبة مثل "الحادي عشر ج" و "الحادي عشرج")
                if (cleanC.replace(/\s+/g, '') === cleanStudentClass.replace(/\s+/g, '')) return true;

                return (grade && section && cleanC.includes(grade) && cleanC.includes(section)) ||
                       (grade && cleanC === grade);
              });

              return isClassMatch;
            });
            
            console.log('Valid Session for student:', validSession?.id);
            setUpcomingSession(validSession || null);
            
            if (!validSession && sessions.length > 0) {
              setDebugInfo(`تم العثور على ${sessions.length} جلسات، ولكن لا توجد جلسة تطابق صفك (${studentClassExact})`);
            } else if (sessions.length === 0) {
              setDebugInfo('لا توجد أي جلسات امتحانات مضافة في قاعدة البيانات حالياً.');
            }
          }
          setIsLoading(false);
        };

        await fetchExams();

        if (!isMounted) return;

        // 3. الاشتراك في التحديثات المباشرة
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_sessions' }, () => {
            fetchExams();
          })
          .subscribe();

      } catch (error: any) {
        if (isMounted) {
          console.error('Error in setupRealtime:', error);
          setDebugInfo(`خطأ غير متوقع: ${error.message}`);
          setIsLoading(false);
        }
      }
    };

    setupRealtime();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  // Timer logic
  useEffect(() => {
    if (!upcomingSession) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const startTime = new Date(upcomingSession.start_time).getTime();
      const endTime = new Date(upcomingSession.end_time).getTime();

      if (now >= startTime && now <= endTime) {
        // Exam is active, countdown to end time
        setIsExamActive(true);
        const distance = endTime - now;
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else if (now < startTime) {
        // Exam is upcoming, countdown to start time
        setIsExamActive(false);
        const distance = startTime - now;
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      } else {
        // Exam has ended
        setUpcomingSession(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingSession]);

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
                  {isLoading ? (
                    <div className="flex flex-col items-center lg:items-start gap-4">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                      <p className="text-blue-100 font-bold">جاري جلب بيانات الاختبارات...</p>
                    </div>
                  ) : !upcomingSession ? (
                    <>
                      <div className="inline-block bg-white/20 text-white font-bold px-4 py-1.5 rounded-full text-sm mb-4 border border-white/20">
                        لا يوجد اختبارات
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">لا يوجد اختبارات قادمة حالياً</h3>
                      <p className="text-blue-100 font-medium flex items-center justify-center lg:justify-start gap-2">
                        <Calendar className="w-4 h-4" />
                        {debugInfo || 'سيظهر موعد الاختبار هنا عند إضافته'}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className={cn(
                        "inline-block text-white font-bold px-4 py-1.5 rounded-full text-sm mb-4 border",
                        isExamActive ? "bg-green-500/20 border-green-500/50 text-green-100" : "bg-white/20 border-white/20"
                      )}>
                        {isExamActive ? 'الاختبار متاح الآن' : 'اختبار قادم'}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-white mb-2">
                        {Array.isArray(upcomingSession.exams) ? upcomingSession.exams[0]?.title : upcomingSession.exams?.title}
                      </h3>
                      <p className="text-blue-100 font-medium flex items-center justify-center lg:justify-start gap-2 mb-6">
                        <Calendar className="w-4 h-4" />
                        {Array.isArray(upcomingSession.exams) ? upcomingSession.exams[0]?.subject : upcomingSession.exams?.subject} • {new Date(upcomingSession.start_time).toLocaleString('ar-EG')}
                      </p>
                      
                      {isExamActive && (
                        <Button className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-8 py-6 rounded-2xl text-lg w-full sm:w-auto">
                          بدء الاختبار الآن
                          <ArrowLeft className="w-5 h-5 mr-2" />
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* Countdown Timer */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-blue-100 font-bold text-sm mb-2">
                    {!upcomingSession ? 'الوقت المتبقي' : isExamActive ? 'ينتهي الاختبار بعد:' : 'يبدأ الاختبار بعد:'}
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 bg-black/20 p-4 sm:p-6 rounded-3xl border border-white/10 w-full lg:w-auto justify-center flex-row-reverse">
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          {upcomingSession ? timeLeft.seconds.toString().padStart(2, '0') : '00'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">ثانية</span>
                    </div>
                    <span className="text-2xl font-black text-white/30 -mt-6">:</span>
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          {upcomingSession ? timeLeft.minutes.toString().padStart(2, '0') : '00'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">دقيقة</span>
                    </div>
                    <span className="text-2xl font-black text-white/30 -mt-6">:</span>
                    <div className="text-center">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-2xl shadow-sm border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
                        <span className="text-2xl sm:text-3xl font-black text-white">
                          {upcomingSession ? timeLeft.hours.toString().padStart(2, '0') : '00'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">ساعة</span>
                    </div>
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
