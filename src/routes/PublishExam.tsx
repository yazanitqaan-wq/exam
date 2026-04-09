import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { ArrowRight, Send, Clock, Target, CheckCircle2, Circle, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const AVAILABLE_CLASSES = [
  'عاشر ب',
  'عاشر ج',
  'حادي عشر أ',
  'حادي عشر ج',
  'حادي عشر د'
];

export default function PublishExam() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]); // Empty array, waiting for real data
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [shuffleOption, setShuffleOption] = useState('partial');
  const [resultsOption, setResultsOption] = useState('after_30_mins');
  const [isPublishing, setIsPublishing] = useState(false);

  const toggleClass = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) 
        ? prev.filter(c => c !== className)
        : [...prev, className]
    );
  };

  const handlePublish = async () => {
    if (!selectedExamId) return alert('الرجاء اختيار امتحان');
    if (selectedClasses.length === 0) return alert('الرجاء اختيار شعبة واحدة على الأقل');
    if (!startTime || !endTime) return alert('الرجاء تحديد موعد البدء والانتهاء');

    setIsPublishing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsPublishing(false);
      alert('تم نشر الامتحان بنجاح!');
      navigate('/profile');
    }, 1500);
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

          {exams.length === 0 ? (
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">موعد بدء الامتحان</label>
              <input 
                type="datetime-local" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">موعد انتهاء الامتحان</label>
              <input 
                type="datetime-local" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all bg-white"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
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
            <div className="space-y-2 sm:col-span-2">
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

      </div>
    </MainLayout>
  );
}
