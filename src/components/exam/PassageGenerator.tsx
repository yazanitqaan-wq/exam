import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { motion } from 'motion/react';
import { GoogleGenAI, Type as GenAIType } from '@google/genai';
import { Question } from '@/types/exam';
import { ToggleLeft, ToggleRight, BookOpen, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PassageGeneratorProps {
  onGenerate: (questions: Question[]) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export function PassageGenerator({ onGenerate, language, setLanguage }: PassageGeneratorProps) {
  const [passageText, setPassageText] = useState('');
  const [whCount, setWhCount] = useState('3');
  const [pronounCount, setPronounCount] = useState('1');
  const [fillBlankCount, setFillBlankCount] = useState('2');
  const [keepOrder, setKeepOrder] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setProgress(10);
    setStatus('جاري تحليل القطعة...');

    try {
      if (!passageText.trim()) throw new Error('الرجاء إدخال نص القطعة.');

      setProgress(40);
      setStatus('جاري الاتصال بالذكاء الاصطناعي...');

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        You are an expert teacher creating a reading comprehension exam.
        Based ON THE FOLLOWING PASSAGE ONLY, generate:
        - ${whCount} WH-questions (Who, What, Where, When, Why, How).
        - ${pronounCount} Pronoun reference questions (e.g., "What does the underlined word 'it' refer to?").
        - ${fillBlankCount} Fill-in-the-blank questions (use '___' for the blank).

        All questions MUST be Multiple Choice Questions (MCQ) with exactly 4 options.
        The output language MUST be ${language}.

        CRITICAL REQUIREMENT: For EACH question, you MUST extract a comprehensive excerpt (a full paragraph or at least 4 to 8 lines) from the passage that provides the complete context where the answer is found. Put this excerpt in the 'passageExcerpt' field.

        Passage:
        """
        ${passageText.substring(0, 15000)}
        """
      `;

      setProgress(60);
      setStatus('جاري توليد الأسئلة المتنوعة...');

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
                type: { type: GenAIType.STRING, description: "Must be 'mcq'" },
                text: { type: GenAIType.STRING, description: "The question text" },
                passageExcerpt: { type: GenAIType.STRING, description: "The specific 1-4 lines from the passage containing the answer" },
                options: { type: GenAIType.ARRAY, items: { type: GenAIType.STRING } },
                correctAnswer: { type: GenAIType.STRING },
                points: { type: GenAIType.NUMBER }
              },
              required: ["type", "text", "passageExcerpt", "options", "correctAnswer", "points"]
            }
          }
        }
      });

      setProgress(90);
      setStatus('جاري تنسيق الأسئلة...');

      const generatedQuestions = JSON.parse(response.text || '[]');
      
      const formattedQuestions: Question[] = generatedQuestions.map((q: any, i: number) => ({
        id: `passage_${Date.now()}_${i}`,
        type: 'mcq', // All are MCQ as requested
        text: q.text,
        passageExcerpt: q.passageExcerpt,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 1,
        keepOrder: keepOrder
      }));

      onGenerate(formattedQuestions);
      
      setProgress(100);
      setStatus('تم توليد أسئلة القطعة بنجاح!');
      await new Promise(resolve => setTimeout(resolve, 800));
      
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'حدث خطأ أثناء توليد الأسئلة.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
      setStatus('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="w-10 h-10 shrink-0 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">نظام أسئلة القطعة (Reading Comprehension)</h3>
          <p className="text-sm text-gray-500">قم بلصق القطعة وتوليد أسئلة استيعابية متنوعة</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-bold">
          {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        <textarea 
          value={passageText}
          onChange={(e) => setPassageText(e.target.value)}
          placeholder="الصق نص القطعة هنا..."
          dir="auto"
          className="w-full h-40 px-4 py-3 rounded-2xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
        ></textarea>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">أسئلة عامة (WH)</label>
            <input 
              type="number" 
              value={whCount}
              onChange={(e) => setWhCount(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">أسئلة الضمائر</label>
            <input 
              type="number" 
              value={pronounCount}
              onChange={(e) => setPronounCount(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">أسئلة أكمل الفراغ</label>
            <input 
              type="number" 
              value={fillBlankCount}
              onChange={(e) => setFillBlankCount(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">لغة الأسئلة</label>
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full pr-10 pl-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 outline-none appearance-none bg-white"
              >
                <option value="Arabic">العربية</option>
                <option value="English">English</option>
                <option value="French">Français</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
          <div>
            <h4 className="font-bold text-amber-900">تثبيت ترتيب الأسئلة</h4>
            <p className="text-sm text-amber-700/70">عند التفعيل، لن يتم خلط ترتيب هذه الأسئلة للطالب (ستظهر متتالية).</p>
          </div>
          <button 
            onClick={() => setKeepOrder(!keepOrder)}
            className={cn("transition-colors shrink-0", keepOrder ? "text-amber-600" : "text-gray-300")}
          >
            {keepOrder ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
          </button>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !passageText.trim()}
          className="w-full py-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg"
        >
          {isGenerating ? 'جاري التوليد...' : 'توليد أسئلة القطعة'}
        </Button>

        {isGenerating && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-600">
              <span>{status}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden flex flex-row-reverse">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-amber-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
