import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { ArrowRight, Send, Clock, Target, CheckCircle2, Circle, AlertCircle, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const AVAILABLE_CLASSES = [
  'العاشر ب',
  'العاشر ج',
  'الحادي عشر أ',
  'الحادي عشر ج',
  'الحادي عشر د'
];

// Helper to generate arrays for dropdowns
const generateArray = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);
const DAYS = generateArray(1, 31);
const MONTHS = generateArray(1, 12);
const YEARS = generateArray(new Date().getFullYear(), new Date().getFullYear() + 5);
const HOURS = generateArray(0, 23);
const MINUTES = generateArray(0, 59);

interface DateTimeState {
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
}

const DateTimeSelector = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: DateTimeState; 
  onChange: (val: DateTimeState) => void;
}) => {
  const handleChange = (field: keyof DateTimeState, val: string) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
      <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-purple-500" />
        {label}
      </label>
      
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Section */}
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input 
              type="number"
              placeholder="اليوم (1-31)"
              min="1" max="31"
              value={value.day} onChange={(e) => handleChange('day', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-sm text-center"
            />
          </div>
          <div className="relative flex-1">
            <input 
              type="number"
              placeholder="الشهر (1-12)"
              min="1" max="12"
              value={value.month} onChange={(e) => handleChange('month', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-sm text-center"
            />
          </div>
          <div className="relative flex-1">
            <input 
              type="number"
              placeholder="السنة (مثال: 2026)"
              min={new Date().getFullYear()}
              value={value.year} onChange={(e) => handleChange('year', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-sm text-center"
            />
          </div>
        </div>

        {/* Time Section */}
        <div className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <input 
              type="number"
              placeholder="الساعة (0-23)"
              min="0" max="23"
              value={value.hour} onChange={(e) => handleChange('hour', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-sm text-center"
            />
          </div>
          <span className="flex items-center text-gray-400 font-bold">:</span>
          <div className="relative flex-1">
            <input 
              type="number"
              placeholder="الدقيقة (0-59)"
              min="0" max="59"
              value={value.minute} onChange={(e) => handleChange('minute', e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white text-sm text-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PublishExam() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  const [startDateTime, setStartDateTime] = useState<DateTimeState>({ day: '', month: '', year: '', hour: '', minute: '' });
  const [endDateTime, setEndDateTime] = useState<DateTimeState>({ day: '', month: '', year: '', hour: '', minute: '' });
  
  const [shuffleOption, setShuffleOption] = useState('partial');
  const [resultsOption, setResultsOption] = useState('after_30_mins');
  const [isPublishing, setIsPublishing] = useState(false);

  const [publishedSessions, setPublishedSessions] = useState<any[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchExams();
    fetchPublishedSessions();
  }, []);

  const fetchPublishedSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select(`
          id,
          target_classes,
          start_time,
          end_time,
          status,
          exams (
            title,
            subject,
            grade
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPublishedSessions(data || []);
    } catch (error) {
      console.error('Error fetching published sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const fetchExams = async () => {
    setIsLoadingExams(true);
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*, questions(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedExams = data.map(exam => ({
        id: exam.id,
        title: exam.title,
        subject: exam.subject,
        grade: exam.grade,
        questionsCount: exam.questions[0]?.count || 0
      }));
      
      setExams(formattedExams);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setIsLoadingExams(false);
    }
  };

  const toggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const isValidDateTime = (dt: DateTimeState) => {
    return dt.day && dt.month && dt.year && dt.hour && dt.minute;
  };

  const createDateFromState = (dt: DateTimeState) => {
    return new Date(
      parseInt(dt.year), 
      parseInt(dt.month) - 1, 
      parseInt(dt.day), 
      parseInt(dt.hour), 
      parseInt(dt.minute)
    );
  };

  const handlePublish = async () => {
    if (!selectedExamId) return alert('الرجاء اختيار امتحان');
    if (selectedClasses.length === 0) return alert('الرجاء اختيار شعبة واحدة على الأقل');
    if (!isValidDateTime(startDateTime) || !isValidDateTime(endDateTime)) {
      return alert('الرجاء تحديد موعد البدء والانتهاء بشكل كامل');
    }

    const startDate = createDateFromState(startDateTime);
    const endDate = createDateFromState(endDateTime);

    if (endDate <= startDate) {
      return alert('يجب أن يكون موعد الانتهاء بعد موعد البدء');
    }

    setIsPublishing(true);
    
    try {
      const { error } = await supabase
        .from('exam_sessions')
        .insert({
          exam_id: selectedExamId,
          target_classes: selectedClasses,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          shuffle_option: shuffleOption,
          results_option: resultsOption,
          status: 'scheduled'
        });

      if (error) throw error;

      setIsPublishing(false);
      alert('تم نشر الامتحان بنجاح!');
      fetchPublishedSessions(); // Refresh the list
      // Reset form
      setSelectedExamId('');
      setSelectedClasses([]);
    } catch (error: any) {
      console.error('Error publishing exam:', error);
      alert('حدث خطأ أثناء نشر الامتحان: ' + error.message);
      setIsPublishing(false);
    }
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .delete()
        .eq('id', sessionToDelete)
        .select();
        
      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("لم يتم الحذف! يرجى التأكد من تفعيل صلاحية الحذف (DELETE Policy) لجدول exam_sessions في Supabase.");
      }
      
      setSessionToDelete(null);
      fetchPublishedSessions();
    } catch (error: any) {
      console.error('Error deleting session:', error);
      alert('حدث خطأ أثناء الحذف: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 h-full pb-12 max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 shrink-0 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-1">نشر امتحان متزامن</h1>
              <p className="text-gray-500 text-xs sm:text-sm">قم بإعداد الامتحان للنشر المباشر للطلاب المحددين</p>
            </div>
          </div>
          <Button 
            onClick={handlePublish}
            disabled={isPublishing || exams.length === 0}
            className="w-full sm:w-auto gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 sm:py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {isPublishing ? 'جاري النشر...' : 'نشر الامتحان الآن'}
          </Button>
        </div>

        {/* Step 1: Select Exam */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">1. اختيار الامتحان</h2>
          </div>

          {isLoadingExams ? (
            <div className="text-center py-12 text-gray-500">جاري تحميل الامتحانات...</div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">لا توجد امتحانات متاحة</h3>
              <p className="text-gray-500 mb-6">قم بإنشاء امتحان جديد أولاً من صفحة الإدارة لتتمكن من نشره هنا.</p>
              <Button onClick={() => navigate('/create-exam')} className="bg-blue-600 hover:bg-blue-700 text-white">
                إنشاء امتحان جديد
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exams.map(exam => (
                <div 
                  key={exam.id}
                  onClick={() => setSelectedExamId(exam.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all",
                    selectedExamId === exam.id 
                      ? "border-blue-500 bg-blue-50/50" 
                      : "border-gray-100 hover:border-blue-200 bg-white"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{exam.title}</h3>
                    {selectedExamId === exam.id ? (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                  </div>
                  <div className="flex gap-3 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">الصف {exam.grade}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{exam.subject}</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-md">{exam.questionsCount} سؤال</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Step 2: Target Classes */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight mb-1">2. الصفوف المستهدفة</h2>
              <p className="text-xs sm:text-sm text-gray-500">اختر الشُعب التي سيظهر لها هذا الامتحان</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {AVAILABLE_CLASSES.map(className => {
              const isSelected = selectedClasses.includes(className);
              return (
                <button
                  key={className}
                  onClick={() => toggleClass(className)}
                  className={cn(
                    "px-5 py-3 rounded-xl font-bold text-sm transition-all border-2",
                    isSelected 
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-indigo-200"
                  )}
                >
                  {className}
                </button>
              );
            })}
          </div>
          {selectedClasses.length === 0 && (
            <div className="mt-4 flex items-center gap-2 text-amber-600 text-sm font-medium bg-amber-50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              يجب اختيار شعبة واحدة على الأقل لنشر الامتحان.
            </div>
          )}
        </motion.div>

        {/* Step 3: Exam Timing & Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">3. المواعيد والإعدادات</h2>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <DateTimeSelector 
              label="موعد بدء الامتحان" 
              value={startDateTime} 
              onChange={setStartDateTime} 
            />
            
            <DateTimeSelector 
              label="موعد انتهاء الامتحان" 
              value={endDateTime} 
              onChange={setEndDateTime} 
            />

            <div className="space-y-2 mt-4">
              <label className="text-sm font-bold text-gray-700">خلط الأسئلة (عشوائي)</label>
              <div className="relative">
                <select 
                  value={shuffleOption}
                  onChange={(e) => setShuffleOption(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="partial">أسئلة القطعة مرتبة للكل، لكن باقي الأسئلة مخلوطة</option>
                  <option value="all">نعم، اخلط جميع الأسئلة والخيارات لكل طالب</option>
                  <option value="none">لا، حافظ على الترتيب الأصلي للجميع</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">عرض النتائج للطالب</label>
              <div className="relative">
                <select 
                  value={resultsOption}
                  onChange={(e) => setResultsOption(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white appearance-none cursor-pointer"
                >
                  <option value="after_30_mins">بعد نصف ساعة من انتهاء الاختبار (تظهر في ملف الطالب)</option>
                  <option value="immediate">فوراً بعد التسليم</option>
                  <option value="manual">يدوياً من قبل المعلم</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 4: Published Sessions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">الامتحانات المنشورة حالياً</h2>
          </div>

          {isLoadingSessions ? (
            <div className="text-center py-8 text-gray-500">جاري تحميل الامتحانات المنشورة...</div>
          ) : publishedSessions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-500">
              لا يوجد امتحانات منشورة حالياً
            </div>
          ) : (
            <div className="space-y-4">
              {publishedSessions.map(session => (
                <div key={session.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-2xl border border-gray-100 bg-gray-50 gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{session.exams?.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        الصفوف: {session.target_classes.join('، ')}
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        البدء: {new Date(session.start_time).toLocaleString('ar-EG')}
                      </span>
                      <span className="bg-white px-2 py-1 rounded border border-gray-200">
                        الانتهاء: {new Date(session.end_time).toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSessionToDelete(session.id)}
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 shrink-0"
                  >
                    حذف النشر
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-center text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-center text-gray-500 mb-8">
              هل أنت متأكد من حذف هذا النشر؟ لن يتمكن الطلاب من رؤية الامتحان بعد حذفه.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => setSessionToDelete(null)}
                variant="outline"
                className="flex-1"
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button
                onClick={confirmDeleteSession}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={isDeleting}
              >
                {isDeleting ? 'جاري الحذف...' : 'نعم، احذف'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
