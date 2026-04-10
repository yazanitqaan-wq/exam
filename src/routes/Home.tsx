import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Calendar, ArrowLeft, Loader2, BookOpen, Info, CheckCircle2, AlertCircle, Layout, List, UserCheck, Smartphone, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export default function Home() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'student';
  const userName = localStorage.getItem('studentName') || (userRole === 'teacher' ? 'المعلم' : 'المستخدم');
  const studentId = localStorage.getItem('studentId');
  
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [teacherSessions, setTeacherSessions] = useState<any[]>([]);
  const [timeLefts, setTimeLefts] = useState<Record<string, { hours: number, minutes: number, seconds: number }>>({});
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [showEnterConfirm, setShowEnterConfirm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [isEntering, setIsEntering] = useState(false);

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

    // دالة لتوحيد النصوص العربية للمقارنة الصحيحة
    const normalizeArabic = (text: string) => {
      if (!text) return '';
      return text
        .trim()
        .replace(/\s+/g, '') // إزالة جميع المسافات
        .replace(/[أإآ]/g, 'ا') // توحيد الألف
        .replace(/ة/g, 'ه')    // توحيد التاء المربوطة
        .replace(/ى/g, 'ي')    // توحيد الياء
        .replace(/^ال/, '')    // إزالة "ال" التعريف من البداية
        .replace(/ال/g, '');   // إزالة "ال" التعريف من أي مكان (لضمان التطابق مثل "الحادي عشر" و "حادي عشر")
    };

    const setupRealtime = async () => {
      setIsLoading(true);
      try {
        if (userRole === 'teacher') {
          const fetchTeacherSessions = async () => {
            const { data, error } = await supabase
              .from('exam_sessions')
              .select('*, exams(title, subject)')
              .order('start_time', { ascending: false });
            
            if (error) {
              console.error('Error fetching teacher sessions:', error);
              return;
            }
            setTeacherSessions(data || []);
            setIsLoading(false);
          };
          await fetchTeacherSessions();
          
          channel
            .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_sessions' }, () => {
              fetchTeacherSessions();
            })
            .subscribe();
          return;
        }

        // Student Logic
        if (!studentId) {
          setIsLoading(false);
          return;
        }

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
        const normalizedStudentClass = normalizeArabic(studentClassExact);
        
        console.log('Student Class:', studentClassExact);
        console.log('Normalized Student Class:', normalizedStudentClass);

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
            const validSessions = sessions.filter(s => {
              const endTime = new Date(s.end_time);
              if (endTime <= now) return false;
              
              const targetClasses = Array.isArray(s.target_classes) ? s.target_classes : [];
              return targetClasses.some(c => {
                const normalizedTarget = normalizeArabic(c);
                if (normalizedTarget === normalizedStudentClass) return true;
                
                const normalizedGrade = normalizeArabic(grade);
                const normalizedSection = normalizeArabic(section);
                
                if (normalizedGrade && normalizedSection && 
                    normalizedTarget.includes(normalizedGrade) && 
                    normalizedTarget.includes(normalizedSection)) {
                  return true;
                }
                if (normalizedGrade && normalizedTarget === normalizedGrade) return true;
                return false;
              });
            }).slice(0, 6);
            
            setUpcomingSessions(validSessions);
            
            if (validSessions.length === 0 && sessions.length > 0) {
              setDebugInfo(`تم العثور على ${sessions.length} جلسات، ولكن لا توجد جلسة تطابق صفك (${studentClassExact}) بعد توحيد النصوص.`);
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

  // Timer logic for multiple exams
  useEffect(() => {
    if (upcomingSessions.length === 0) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const newTimeLefts: Record<string, any> = {};
      let foundActive = null;

      upcomingSessions.forEach(session => {
        const startTime = new Date(session.start_time).getTime();
        const endTime = new Date(session.end_time).getTime();

        if (now >= startTime && now <= endTime) {
          foundActive = session.id;
          const distance = endTime - now;
          newTimeLefts[session.id] = {
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          };
        } else if (now < startTime) {
          const distance = startTime - now;
          newTimeLefts[session.id] = {
            hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((distance % (1000 * 60)) / 1000)
          };
        }
      });

      setTimeLefts(newTimeLefts);
      setActiveExamId(foundActive);
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingSessions]);

  const handleEnterExam = () => {
    if (!selectedSession) return;
    setIsEntering(true);
    setTimeout(() => {
      navigate(`/take-exam/${selectedSession.id}`);
    }, 1500);
  };

  const renderTeacherView = () => (
    <div className="space-y-4 sm:space-y-8">
      {/* Header / Welcome */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">مرحباً بك</p>
            <h2 className="text-sm font-black text-gray-900">{userName}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <List className="w-4 h-4 text-primary-600" />
              جلسات الاختبارات المنشورة
            </h3>
            <Button onClick={() => navigate('/publish-exam')} size="sm" className="rounded-xl text-[10px] h-8 px-3">
              نشر اختبار جديد
            </Button>
          </div>

          {isLoading ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="font-bold text-xs">جاري تحميل الجلسات...</p>
            </div>
          ) : teacherSessions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-gray-900 mb-1">لا يوجد اختبارات</h4>
              <p className="text-gray-500 text-[10px] max-w-xs">لم تقم بنشر أي جلسات اختبارات متزامنة حتى الآن.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {teacherSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 text-xs">{session.exams?.title}</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.target_classes.map((c: string, i: number) => (
                          <span key={i} className="bg-gray-50 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded-md border border-gray-100">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-gray-50 pt-3 sm:pt-0">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">التوقيت</p>
                      <div className="flex items-center gap-1 text-gray-700 font-bold text-[10px]">
                        <Clock className="w-3 h-3 text-primary-500" />
                        <span>{new Date(session.start_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-2 py-1 rounded-lg text-[10px] font-black border",
                      session.status === 'active' ? "bg-green-50 text-green-600 border-green-100" : "bg-blue-50 text-blue-600 border-blue-100"
                    )}>
                      {session.status === 'active' ? 'مباشر الآن' : 'مجدول'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5 px-1">
            <Info className="w-4 h-4 text-primary-600" />
            إحصائيات سريعة
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-[10px] font-bold mb-1">إجمالي الجلسات</p>
              <p className="text-lg font-black text-primary-600">{teacherSessions.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-400 text-[10px] font-bold mb-1">الجلسات النشطة</p>
              <p className="text-lg font-black text-green-600">
                {teacherSessions.filter(s => s.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudentView = () => (
    <div className="space-y-4 sm:space-y-8">
      {/* Header / Welcome */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase">مرحباً بك</p>
            <h2 className="text-sm font-black text-gray-900">{userName}</h2>
          </div>
        </div>
      </div>

      {/* Main Upcoming Exam Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-5 text-white shadow-lg shadow-blue-900/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-black flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              الاختبار القادم
            </h3>
            {upcomingSessions.length > 0 && (
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                activeExamId ? "bg-green-500 text-white" : "bg-white/20 text-white"
              )}>
                {activeExamId ? 'متاح الآن' : 'مجدول'}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-white" />
              <p className="font-bold text-xs text-blue-100">جاري جلب البيانات...</p>
            </div>
          ) : upcomingSessions.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6 text-blue-200" />
              </div>
              <h4 className="text-sm font-black">لا يوجد اختبارات حالياً</h4>
              <p className="text-blue-200 text-[10px] font-medium">{debugInfo || 'سيتم إشعارك فور توفر اختبار جديد'}</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h4 className="text-lg font-black mb-1">{upcomingSessions[0].exams?.title}</h4>
                <p className="text-blue-200 text-xs font-bold flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  {upcomingSessions[0].exams?.subject}
                </p>
              </div>

              {/* Countdown */}
              <div className="grid grid-cols-3 gap-2 flex-row-reverse">
                {[
                  { label: 'ثانية', val: timeLefts[upcomingSessions[0].id]?.seconds || 0 },
                  { label: 'دقيقة', val: timeLefts[upcomingSessions[0].id]?.minutes || 0 },
                  { label: 'ساعة', val: timeLefts[upcomingSessions[0].id]?.hours || 0 },
                ].map((t, i) => (
                  <div key={i} className="bg-black/20 rounded-xl p-2 border border-white/10 text-center">
                    <div className="text-lg font-black mb-0.5">{t.val.toString().padStart(2, '0')}</div>
                    <div className="text-[9px] font-bold text-blue-300 uppercase">{t.label}</div>
                  </div>
                ))}
              </div>

              {activeExamId === upcomingSessions[0].id ? (
                <Button 
                  onClick={() => {
                    setSelectedSession(upcomingSessions[0]);
                    setShowEnterConfirm(true);
                  }}
                  className="w-full py-4 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md"
                >
                  دخول الاختبار الآن
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                </Button>
              ) : (
                <div className="bg-white/10 border border-white/20 p-3 rounded-xl text-center">
                  <p className="text-[10px] font-bold text-blue-100">
                    يبدأ في: {new Date(upcomingSessions[0].start_time).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Other Exams & Instructions (Grid on Desktop, Stack on Mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Other Exams */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5 px-1">
            <Layout className="w-4 h-4 text-primary-600" />
            جدول الاختبارات القادمة
          </h3>
          
          {upcomingSessions.length > 1 ? (
            <div className="grid grid-cols-1 gap-3">
              {upcomingSessions.slice(1).map((session) => (
                <div
                  key={session.id}
                  className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-gray-900 mb-0.5">{session.exams?.title}</h4>
                      <p className="text-gray-500 text-[10px] font-bold">{session.exams?.subject}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] font-black text-gray-400 uppercase mb-1">
                      {new Date(session.start_time).toLocaleDateString('ar-EG', { weekday: 'short' })}
                    </span>
                    <div className="flex items-center gap-1 text-primary-600 font-black text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(session.start_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-[10px] text-gray-400 font-bold">لا توجد اختبارات إضافية مجدولة</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5 px-1">
            <Info className="w-4 h-4 text-primary-600" />
            تعليمات هامة
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
            {[
              { icon: <Smartphone className="w-4 h-4" />, title: 'استقرار الإنترنت', desc: 'تأكد من وجود اتصال ثابت.' },
              { icon: <ShieldAlert className="w-4 h-4" />, title: 'نظام مكافحة الغش', desc: 'مغادرة الصفحة يعرضك للحرمان.' },
              { icon: <Clock className="w-4 h-4" />, title: 'الوقت المحدد', desc: 'تسليم تلقائي عند انتهاء الوقت.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h5 className="font-black text-gray-900 text-[11px]">{item.title}</h5>
                  <p className="text-gray-500 text-[9px] font-medium mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="pb-12">
        {userRole === 'teacher' ? renderTeacherView() : renderStudentView()}
      </div>

      {/* Enter Exam Confirmation Modal */}
      <AnimatePresence>
        {showEnterConfirm && selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 sm:p-10 max-w-md w-full shadow-2xl border border-blue-100"
            >
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-center text-gray-900 mb-4">تأكيد دخول الاختبار</h3>
              <p className="text-center text-gray-500 mb-8 leading-relaxed">
                أنت على وشك البدء في اختبار <span className="font-bold text-blue-600">"{selectedSession.exams?.title}"</span>. 
                يرجى التأكد من استقرار اتصال الإنترنت لديك وعدم مغادرة الصفحة أثناء الحل.
              </p>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleEnterExam}
                  disabled={isEntering}
                  className="w-full py-6 bg-blue-600 hover:bg-blue-700 rounded-2xl text-lg font-black shadow-lg shadow-blue-100"
                >
                  {isEntering ? (
                    <>
                      <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                      جاري الدخول...
                    </>
                  ) : (
                    'موافق، ابدأ الآن'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowEnterConfirm(false)}
                  disabled={isEntering}
                  className="w-full py-6 rounded-2xl text-gray-400 hover:text-gray-600"
                >
                  إلغاء
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
