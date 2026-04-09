import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// تحديث إجباري: هذا التعليق لإجبار Vercel على عمل Build جديد ومسح الكاش القديم
import { MainLayout } from '@/layouts/MainLayout';
import { motion } from 'motion/react';
import { 
  ArrowRight, BookOpenCheck, Settings, Upload, Type, PenTool, 
  PlusCircle, Save, FileText, CheckCircle2, Circle, Clock, Target, Trash2, Globe, BookOpen, Pin
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { GoogleGenAI, Type as GenAIType } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist';
import { Question } from '@/types/exam';
import { PassageGenerator } from '@/components/exam/PassageGenerator';
import { supabase } from '@/lib/supabase';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type GenerationMethod = 'manual' | 'text' | 'pdf' | 'passage';

export default function CreateExam() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GenerationMethod>('manual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Exam Settings
  const [examTitle, setExamTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [duration, setDuration] = useState('60');

  // Save Modal State
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveClick = () => {
    if (!examTitle.trim()) {
      alert('الرجاء إدخال عنوان الاختبار أولاً');
      return;
    }
    if (questions.length === 0) {
      alert('الرجاء إضافة سؤال واحد على الأقل');
      return;
    }
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      // 1. Insert Exam
      const { data: examData, error: examError } = await supabase
        .from('exams')
        .insert({
          title: examTitle,
          subject: subject || 'غير محدد',
          grade: grade || 'غير محدد',
          duration_minutes: parseInt(duration) || 60
          // Note: teacher_id is omitted here because we are not using Supabase Auth yet.
          // You will need to alter the exams table to make teacher_id NULLABLE:
          // ALTER TABLE exams ALTER COLUMN teacher_id DROP NOT NULL;
        })
        .select()
        .single();

      if (examError) throw examError;

      // 2. Insert Questions
      const questionsToInsert = questions.map((q, index) => ({
        exam_id: examData.id,
        question_type: q.type,
        question_text: q.text,
        options: q.options || [],
        correct_answer: q.correctAnswer,
        passage_excerpt: q.passageExcerpt || null,
        keep_order: q.keepOrder || false,
        order_index: index
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      setIsSaving(false);
      setShowSaveConfirm(false);
      alert('تم حفظ الاختبار بنجاح!');
      navigate('/profile');
    } catch (error: any) {
      console.error('Error saving exam:', error);
      alert('حدث خطأ أثناء حفظ الاختبار: ' + error.message);
      setIsSaving(false);
    }
  };

  // Generation Settings
  const [mcqCount, setMcqCount] = useState('10');
  const [tfCount, setTfCount] = useState('5');
  const [language, setLanguage] = useState('Arabic');
  const [sourceText, setSourceText] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  // Questions Preview
  const [questions, setQuestions] = useState<Question[]>([]);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';

      const progress = 10 + Math.floor((i / pdf.numPages) * 30);
      setGenerationProgress(progress);
      setGenerationStatus(`جاري قراءة الصفحة ${i} من ${pdf.numPages}...`);
    }
    
    return fullText;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationProgress(5);
    setGenerationStatus('جاري تجهيز البيانات...');
    
    try {
      let contentToProcess = '';
      
      if (activeTab === 'text') {
        contentToProcess = sourceText;
        setGenerationProgress(40);
        setGenerationStatus('جاري معالجة النص...');
      } else if (activeTab === 'pdf' && pdfFile) {
        setGenerationStatus('جاري تهيئة ملف PDF...');
        contentToProcess = await extractTextFromPdf(pdfFile);
      }

      if (!contentToProcess.trim()) {
        throw new Error('لا يوجد محتوى لتوليد الأسئلة منه.');
      }

      setGenerationProgress(50);
      setGenerationStatus('جاري الاتصال بالذكاء الاصطناعي لتوليد الأسئلة...');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are an expert teacher creating an exam. 
        Generate ${mcqCount} multiple-choice questions (MCQ) and ${tfCount} true/false questions (TF) based ON THE FOLLOWING TEXT ONLY.
        The output language MUST be ${language}.
        
        Text to base questions on:
        """
        ${contentToProcess.substring(0, 30000)} // Limiting text length to avoid token limits if PDF is huge
        """
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: GenAIType.ARRAY,
            items: {
              type: GenAIType.OBJECT,
              properties: {
                type: {
                  type: GenAIType.STRING,
                  description: "Must be exactly 'mcq' or 'tf'",
                },
                text: {
                  type: GenAIType.STRING,
                  description: "The question text",
                },
                options: {
                  type: GenAIType.ARRAY,
                  items: { type: GenAIType.STRING },
                  description: "Array of 4 options for MCQ. Leave empty or omit for TF.",
                },
                correctAnswer: {
                  type: GenAIType.STRING,
                  description: "The exact correct option string for MCQ, or exactly 'صح' or 'خطأ' (or 'True'/'False' depending on language) for TF.",
                },
                points: {
                  type: GenAIType.NUMBER,
                  description: "Points for this question (e.g., 1 or 2)",
                }
              },
              required: ["type", "text", "correctAnswer", "points"]
            }
          }
        }
      });

      setGenerationProgress(90);
      setGenerationStatus('جاري تنسيق الأسئلة المستخرجة...');

      const generatedQuestions = JSON.parse(response.text || '[]');
      
      // Map and add unique IDs
      const formattedQuestions: Question[] = generatedQuestions.map((q: any, i: number) => ({
        id: `gen_${Date.now()}_${i}`,
        type: q.type === 'mcq' ? 'mcq' : 'tf',
        text: q.text,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1
      }));

      setQuestions(prev => [...prev, ...formattedQuestions]);
      
      setGenerationProgress(100);
      setGenerationStatus('تم توليد الأسئلة بنجاح!');
      
      // Wait a moment to show 100%
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء توليد الأسئلة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus('');
    }
  };

  const handleAddManualQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(),
      type: 'mcq',
      text: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      points: 1
    }]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 sm:gap-8 h-full pb-12 max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
        
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
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight mb-1">إنشاء اختبار جديد</h1>
              <p className="text-gray-500 text-xs sm:text-sm">قم بتصميم اختبارك وتوليد الأسئلة بسهولة</p>
            </div>
          </div>
          <Button 
            onClick={handleSaveClick}
            className="w-full sm:w-auto gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 sm:py-2"
          >
            <Save className="w-4 h-4" />
            حفظ الاختبار
          </Button>
        </div>

        {/* Step 1: Exam Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">إعدادات الاختبار</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">عنوان الاختبار</label>
              <input 
                type="text" 
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="مثال: امتحان الشهر الأول"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">المادة</label>
              <input 
                type="text" 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: الرياضيات"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">الصف المستهدف</label>
              <select 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white"
              >
                <option value="">اختر الصف...</option>
                <option value="10">الصف العاشر</option>
                <option value="11">الصف الحادي عشر</option>
                <option value="12">الصف الثاني عشر</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">مدة الاختبار (بالدقائق)</label>
              <div className="relative">
                <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Step 2: Question Generation */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">إضافة الأسئلة</h2>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8 p-1 bg-gray-50 rounded-2xl">
            <button
              onClick={() => setActiveTab('manual')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all",
                activeTab === 'manual' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <PenTool className="w-4 h-4 shrink-0" />
              <span className="truncate">إضافة يدوية</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all",
                activeTab === 'text' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Type className="w-4 h-4 shrink-0" />
              <span className="truncate">توليد من نص</span>
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all",
                activeTab === 'pdf' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <Upload className="w-4 h-4 shrink-0" />
              <span className="truncate">رفع ملف PDF</span>
            </button>
            <button
              onClick={() => setActiveTab('passage')}
              className={cn(
                "flex items-center justify-center gap-2 py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all",
                activeTab === 'passage' ? "bg-white text-amber-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">أسئلة القطعة</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'passage' && (
              <PassageGenerator 
                language={language} 
                setLanguage={setLanguage}
                onGenerate={(newQuestions) => setQuestions(prev => [...prev, ...newQuestions])} 
              />
            )}

            {(activeTab === 'text' || activeTab === 'pdf') && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">عدد أسئلة (اختر من متعدد)</label>
                  <input 
                    type="number" 
                    value={mcqCount}
                    onChange={(e) => setMcqCount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">عدد أسئلة (صح وخطأ)</label>
                  <input 
                    type="number" 
                    value={tfCount}
                    onChange={(e) => setTfCount(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">لغة الأسئلة</label>
                  <div className="relative">
                    <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select 
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 outline-none appearance-none bg-white"
                    >
                      <option value="Arabic">العربية</option>
                      <option value="English">English</option>
                      <option value="French">Français</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold">
                {errorMsg}
              </div>
            )}

            {activeTab === 'text' && (
              <div className="space-y-4">
                <textarea 
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="الصق النص هنا لتوليد الأسئلة منه..."
                  className="w-full h-48 px-4 py-3 rounded-2xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none resize-none"
                ></textarea>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !sourceText.trim()}
                  className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg"
                >
                  {isGenerating ? 'جاري التوليد...' : 'توليد الأسئلة الآن'}
                </Button>
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>{generationStatus}</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex flex-row-reverse">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full bg-purple-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'pdf' && (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:bg-emerald-50 transition-colors cursor-pointer">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Upload className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-900 mb-2">اسحب وأفلت ملف PDF هنا</h3>
                  <p className="text-emerald-600/70 text-sm mb-6">أو اضغط لاختيار ملف من جهازك</p>
                  <input 
                    type="file" 
                    accept=".pdf"
                    className="hidden" 
                    id="pdf-upload"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  />
                  <label htmlFor="pdf-upload" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold cursor-pointer hover:bg-emerald-700 transition-colors">
                    اختيار ملف
                  </label>
                  {pdfFile && <p className="mt-4 text-sm font-bold text-emerald-700">تم اختيار: {pdfFile.name}</p>}
                </div>
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !pdfFile}
                  className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg"
                >
                  {isGenerating ? 'جاري التوليد...' : 'توليد الأسئلة الآن'}
                </Button>
                {isGenerating && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm font-bold text-gray-600">
                      <span>{generationStatus}</span>
                      <span>{generationProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex flex-row-reverse">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${generationProgress}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                <PlusCircle className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 mb-6">قم بإضافة الأسئلة يدوياً للاختبار</p>
                <Button onClick={handleAddManualQuestion} className="rounded-xl px-8">
                  إضافة سؤال جديد
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Step 3: Questions Preview */}
        {questions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">معاينة الأسئلة ({questions.length})</h2>
              </div>
              <Button onClick={handleAddManualQuestion} variant="outline" size="sm" className="rounded-lg">
                <PlusCircle className="w-4 h-4 ml-2" />
                إضافة سؤال
              </Button>
            </div>

            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={q.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 relative group">
                  <button 
                    onClick={() => handleRemoveQuestion(q.id)}
                    className="absolute top-4 left-4 w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      {q.passageExcerpt && (
                        <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-sm font-bold text-amber-800 mb-1">النص المستخرج:</p>
                          <p className="text-gray-700 text-sm" dir="auto">{q.passageExcerpt}</p>
                        </div>
                      )}
                      <input 
                        type="text" 
                        value={q.text}
                        onChange={(e) => {
                          const newQ = [...questions];
                          newQ[index].text = e.target.value;
                          setQuestions(newQ);
                        }}
                        placeholder="نص السؤال..."
                        dir="auto"
                        className="w-full bg-transparent font-bold text-lg text-gray-900 border-b border-transparent focus:border-blue-300 outline-none pb-1"
                      />
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="bg-gray-200 px-2 py-0.5 rounded-md font-bold">
                          {q.type === 'mcq' ? 'اختر من متعدد' : q.type === 'tf' ? 'صح وخطأ' : 'أكمل الفراغ'}
                        </span>
                        {q.keepOrder && (
                          <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-bold">
                            <Pin className="w-3 h-3" />
                            مُثبت الترتيب
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <span>العلامة:</span>
                          <input 
                            type="number" 
                            value={q.points}
                            onChange={(e) => {
                              const newQ = [...questions];
                              newQ[index].points = Number(e.target.value);
                              setQuestions(newQ);
                            }}
                            className="w-16 px-2 py-1 rounded border border-gray-200 outline-none focus:border-blue-400"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {q.type === 'mcq' && q.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-12">
                      {q.options.map((opt, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                          opt === q.correctAnswer ? "border-emerald-500 bg-emerald-50" : "border-gray-200 bg-white"
                        )}>
                          <button 
                            onClick={() => {
                              const newQ = [...questions];
                              newQ[index].correctAnswer = opt;
                              setQuestions(newQ);
                            }}
                            className="shrink-0"
                          >
                            {opt === q.correctAnswer ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-300 hover:text-emerald-400" />
                            )}
                          </button>
                          <input 
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newQ = [...questions];
                              if (newQ[index].options) {
                                newQ[index].options![i] = e.target.value;
                                // If this was the correct answer, update it too
                                if (opt === newQ[index].correctAnswer) {
                                  newQ[index].correctAnswer = e.target.value;
                                }
                              }
                              setQuestions(newQ);
                            }}
                            dir="auto"
                            className={cn(
                              "w-full bg-transparent outline-none font-medium",
                              opt === q.correctAnswer ? "text-emerald-700" : "text-gray-700"
                            )}
                            placeholder={`الخيار ${i + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {q.type === 'tf' && (
                    <div className="flex gap-4 pr-12">
                      <button 
                        onClick={() => {
                          const newQ = [...questions];
                          newQ[index].correctAnswer = language === 'English' ? 'True' : 'صح';
                          setQuestions(newQ);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-xl border font-bold transition-colors",
                          (q.correctAnswer === 'صح' || q.correctAnswer === 'True') ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {(q.correctAnswer === 'صح' || q.correctAnswer === 'True') && <CheckCircle2 className="w-4 h-4" />}
                        {language === 'English' ? 'True' : 'صح'}
                      </button>
                      <button 
                        onClick={() => {
                          const newQ = [...questions];
                          newQ[index].correctAnswer = language === 'English' ? 'False' : 'خطأ';
                          setQuestions(newQ);
                        }}
                        className={cn(
                          "flex items-center gap-2 px-6 py-3 rounded-xl border font-bold transition-colors",
                          (q.correctAnswer === 'خطأ' || q.correctAnswer === 'False') ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {(q.correctAnswer === 'خطأ' || q.correctAnswer === 'False') && <CheckCircle2 className="w-4 h-4" />}
                        {language === 'English' ? 'False' : 'خطأ'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
              <Button onClick={handleSaveClick} className="px-10 py-6 rounded-2xl text-lg shadow-lg shadow-blue-600/20 group">
                <Save className="w-5 h-5 ml-2" />
                حفظ الاختبار
              </Button>
            </div>
          </motion.div>
        )}

      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Save className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">تأكيد حفظ الاختبار</h3>
            <p className="text-gray-500 text-center mb-8">
              هل أنت متأكد من حفظ هذا الاختبار بعنوان "{examTitle}" والذي يحتوي على {questions.length} سؤال؟
            </p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowSaveConfirm(false)}
                disabled={isSaving}
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'جاري الحفظ...' : 'تأكيد الحفظ'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}

    </MainLayout>
  );
}
