import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, AlertTriangle, ChevronRight, ChevronLeft, 
  Send, Loader2, ShieldAlert, BookOpen, CheckCircle2, ArrowLeft, Maximize 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_type: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  passage_excerpt: string | null;
  order_index: number;
}

export default function TakeExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [examTimeLeft, setExamTimeLeft] = useState({ minutes: 0, seconds: 0 });
  
  // Anti-cheat states
  const [warningCount, setWarningCount] = useState(0);
  const [screenshotWarnings, setScreenshotWarnings] = useState(0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [cheatWarningType, setCheatWarningType] = useState<'tab' | 'screenshot'>('tab');
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  
  // Navigation protection state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [exitStep, setExitStep] = useState(1);

  // Block navigation
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !isFinished && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowExitConfirm(true);
      setExitStep(1);
    }
  }, [blocker.state]);

  const handleConfirmExit = () => {
    if (exitStep === 1) {
      setExitStep(2);
    } else {
      if (blocker.state === 'blocked') {
        blocker.proceed?.();
      } else {
        navigate('/home');
      }
      setShowExitConfirm(false);
    }
  };

  const handleCancelExit = () => {
    blocker.reset?.();
    setShowExitConfirm(false);
    setExitStep(1);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Fetch Exam Data
  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;
      
      try {
        // 1. Fetch Session
        const { data: sessionData, error: sessionError } = await supabase
          .from('exam_sessions')
          .select('*, exams(*)')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        setSession(sessionData);
        setExam(sessionData.exams);

        // 2. Fetch Questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('exam_id', sessionData.exam_id)
          .order('order_index', { ascending: true });

        if (questionsError) throw questionsError;
        setQuestions(questionsData || []);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching exam data:', error);
        alert('حدث خطأ أثناء تحميل الاختبار');
        navigate('/home');
      }
    };

    fetchData();
  }, [sessionId, navigate]);

  // Anti-cheat: Detect tab switching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isFinished) {
        setWarningCount(prev => prev + 1);
        setCheatWarningType('tab');
        setShowCheatWarning(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect PrintScreen or common screenshot shortcuts
      const isScreenshot = 
        e.key === 'PrintScreen' || 
        (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '3' || e.key === '5')) || // Mac
        (e.ctrlKey && e.key === 'p') || // Print
        (e.metaKey && e.shiftKey && e.key === 's'); // Windows Snipping Tool

      if (isScreenshot && !isFinished) {
        e.preventDefault();
        const newCount = screenshotWarnings + 1;
        setScreenshotWarnings(newCount);
        
        if (newCount >= 3) {
          alert('تم إنهاء الاختبار بسبب محاولات تصوير الشاشة المتكررة.');
          handleSubmit();
        } else {
          setCheatWarningType('screenshot');
          setShowCheatWarning(true);
        }
      }
    };

    const preventCopy = (e: any) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('paste', preventCopy);
    document.addEventListener('contextmenu', preventCopy);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('paste', preventCopy);
      document.removeEventListener('contextmenu', preventCopy);
    };
  }, [isFinished, screenshotWarnings]);

  // Prevent Refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isFinished) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFinished]);

  // Exam Timer
  useEffect(() => {
    if (!session || isFinished) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const endTime = new Date(session.end_time).getTime();
      const distance = endTime - now;

      if (distance <= 0) {
        clearInterval(timer);
        handleSubmit(); // Auto-submit when time is up
      } else {
        setExamTimeLeft({
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [session, isFinished]);

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission for now
    setTimeout(() => {
      setIsSubmitting(false);
      setIsFinished(true);
      // In a real app, you'd save to 'exam_submissions' table
    }, 2000);
  };

  const isArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900">جاري تجهيز الاختبار...</h2>
        <p className="text-gray-500 mt-2">يرجى عدم إغلاق الصفحة</p>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-xl border border-gray-100 max-w-md w-full"
        >
          <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">تم تسليم الاختبار!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            شكراً لك، لقد تم استلام إجاباتك بنجاح. سيتم مراجعة الاختبار وإظهار النتائج في الموعد المحدد.
          </p>
          <Button onClick={() => navigate('/home')} className="w-full py-6 text-lg rounded-2xl">
            العودة للرئيسية
          </Button>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans" dir="rtl">
      {/* Exam Header (No standard header) */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary-50 text-primary-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="font-black text-gray-900 text-xs sm:text-sm line-clamp-1">{exam?.title}</h1>
              <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-wider">{exam?.subject}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] text-gray-400 font-bold uppercase">الوقت المتبقي</span>
              <div className="flex items-center gap-1 text-primary-600 font-black text-xs">
                <Clock className="w-3 h-3" />
                <span>{examTimeLeft.minutes.toString().padStart(2, '0')}:{examTimeLeft.seconds.toString().padStart(2, '0')}</span>
              </div>
            </div>
            <div className="h-8 w-[1px] bg-gray-100 hidden sm:block"></div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-primary-600 hidden sm:flex h-8 w-8 p-0"
            >
              <Maximize className="w-4 h-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowExitConfirm(true)}
              className="text-red-500 border-red-100 hover:bg-red-50 text-[10px] h-8 px-3 rounded-lg"
            >
              إنهاء
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="h-1 w-full bg-gray-50">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-primary-600"
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 sm:p-6 md:p-8">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          
          {/* Passage Section (If exists) */}
          <AnimatePresence mode="wait">
            {currentQuestion?.passage_excerpt && (
              <motion.div
                key={`passage-${currentQuestionIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm select-none"
                dir={isArabic(currentQuestion.passage_excerpt) ? 'rtl' : 'ltr'}
              >
                <div className="flex items-center gap-1.5 mb-4 text-primary-600">
                  <BookOpen className="w-4 h-4" />
                  <span className="font-bold text-xs">
                    {isArabic(currentQuestion.passage_excerpt) ? 'اقرأ النص التالي بعناية:' : 'Read the following passage carefully:'}
                  </span>
                </div>
                <div className="prose prose-blue max-w-none">
                  <p className={cn(
                    "text-gray-800 leading-relaxed text-sm sm:text-base font-medium",
                    isArabic(currentQuestion.passage_excerpt) ? "text-justify" : "text-left"
                  )}>
                    {currentQuestion.passage_excerpt}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question Section */}
          <motion.div
            key={`question-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm select-none"
            dir={isArabic(currentQuestion?.question_text || '') ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-[10px] sm:text-xs font-black">
                {isArabic(currentQuestion?.question_text || '') 
                  ? `السؤال ${currentQuestionIndex + 1} من ${questions.length}`
                  : `Question ${currentQuestionIndex + 1} of ${questions.length}`}
              </span>
            </div>

            <h2 className="text-base sm:text-xl font-black text-gray-900 mb-6 sm:mb-8 leading-relaxed">
              {currentQuestion?.question_text}
            </h2>

            {/* Options / Input based on type */}
            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {(currentQuestion?.question_type === 'mcq' || currentQuestion?.question_type === 'true_false') ? (
                currentQuestion?.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === option;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(currentQuestion.id, option)}
                      className={cn(
                        "group flex items-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all",
                        isArabic(option) ? "text-right" : "text-left",
                        isSelected 
                          ? "border-primary-600 bg-primary-50/50 shadow-sm" 
                          : "border-gray-100 hover:border-primary-200 hover:bg-gray-50 bg-white"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-colors",
                        isArabic(option) ? "ml-3 sm:ml-4" : "mr-3 sm:mr-4",
                        isSelected ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600"
                      )}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className={cn(
                        "flex-1 font-bold text-sm sm:text-base",
                        isSelected ? "text-primary-900" : "text-gray-700"
                      )}>
                        {option}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="space-y-3">
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value)}
                    placeholder={isArabic(currentQuestion?.question_text || '') ? "اكتب إجابتك هنا..." : "Type your answer here..."}
                    className="w-full h-32 sm:h-40 p-4 sm:p-6 rounded-xl sm:rounded-3xl border-2 border-gray-100 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all text-sm sm:text-base font-medium resize-none"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-400 font-bold">
                    {isArabic(currentQuestion?.question_text || '') 
                      ? "يرجى التأكد من صحة الإملاء قبل الانتقال للسؤال التالي."
                      : "Please ensure correct spelling before moving to the next question."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Navigation */}
      <footer className="bg-white border-t border-gray-100 p-3 sm:p-4 sticky bottom-0 z-30">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="rounded-xl px-3 sm:px-6 text-xs"
          >
            <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
            السابق
          </Button>

          <div className="hidden sm:flex items-center gap-1.5">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentQuestionIndex === idx ? "bg-primary-600 w-6" : "bg-gray-200 hover:bg-gray-300"
                )}
              />
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setShowSubmitConfirm(true)}
              className="rounded-xl px-4 sm:px-8 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100 text-xs"
            >
              تسليم الاختبار
              <Send className="w-3 h-3 mr-1.5 sm:mr-2" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
              className="rounded-xl px-4 sm:px-8 text-xs"
            >
              التالي
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
            </Button>
          )}
        </div>
      </footer>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-center text-gray-900 mb-2">تأكيد تسليم الاختبار</h3>
              <p className="text-center text-xs text-gray-600 mb-6 leading-relaxed">
                هل أنت متأكد من رغبتك في تسليم الإجابات الآن؟ 
                لقد أجبت على <span className="font-bold text-primary-600">{Object.keys(answers).length}</span> سؤال من أصل <span className="font-bold text-primary-600">{questions.length}</span>.
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmit}
                  isLoading={isSubmitting}
                  className="w-full py-4 bg-green-600 hover:bg-green-700 rounded-xl text-sm font-bold"
                >
                  نعم، تسليم الآن
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowSubmitConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full py-4 rounded-xl text-sm"
                >
                  مراجعة الإجابات
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Anti-cheat Warning Modal */}
      <AnimatePresence>
        {showCheatWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-red-100"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-center text-gray-900 mb-2">
                {cheatWarningType === 'tab' ? 'تحذير مكافحة الغش!' : 'تحذير تصوير الشاشة!'}
              </h3>
              <p className="text-center text-xs text-gray-600 mb-6 leading-relaxed">
                {cheatWarningType === 'tab' 
                  ? 'لقد قمت بمغادرة نافذة الاختبار. يرجى العلم أن هذا السلوك مسجل وسيتم إبلاغ المعلم.'
                  : 'محاولة تصوير الشاشة ممنوعة تماماً. سيتم إنهاء اختبارك تلقائياً في حال تكرار المحاولة.'}
                <br />
                <span className="text-red-600 font-bold mt-2 block">
                  تحذير رقم: {cheatWarningType === 'tab' ? warningCount : screenshotWarnings}
                </span>
              </p>
              <Button
                onClick={() => setShowCheatWarning(false)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl text-sm"
              >
                فهمت، سأكمل الاختبار
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-[2rem] p-6 sm:p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-center text-gray-900 mb-2">
                {exitStep === 1 ? 'هل أنت متأكد؟' : 'تنبيه نهائي!'}
              </h3>
              <p className="text-center text-xs text-gray-600 mb-6 leading-relaxed">
                {exitStep === 1 
                  ? 'أنت على وشك مغادرة الاختبار. لن يتم حفظ تقدمك الحالي إذا خرجت الآن.' 
                  : 'إذا خرجت الآن، فلن تتمكن من العودة لتقديم هذا الاختبار مرة أخرى. هل تريد الخروج فعلاً؟'}
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleConfirmExit}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 rounded-xl text-sm"
                >
                  {exitStep === 1 ? 'نعم، أريد الخروج' : 'نعم، خروج نهائي'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCancelExit}
                  className="w-full py-4 rounded-xl text-sm"
                >
                  إلغاء والعودة للاختبار
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
