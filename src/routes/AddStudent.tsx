import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ArrowRight, User, Calendar, Hash, Sparkles, Loader2, Mail, School, MapPin, GraduationCap, Users, CheckCircle2, Trash2, Plus, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/lib/supabase';

interface StudentData {
  name: string;
  dob: string;
  idNumber: string;
  grade: string;
  section: string;
  email: string;
  school: string;
  governorate: string;
  region: string;
}

export default function AddStudent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [extractedStudents, setExtractedStudents] = useState<StudentData[]>([]);
  const [existingStudentsError, setExistingStudentsError] = useState<{name: string, idNumber: string}[] | null>(null);
  
  const [formData, setFormData] = useState<StudentData>({
    name: '',
    dob: '',
    idNumber: '',
    grade: '',
    section: '',
    email: '',
    school: '',
    governorate: '',
    region: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAIExtract = async () => {
    if (!pasteText.trim()) return;
    
    setIsAILoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `
        استخرج بيانات جميع الطلاب المذكورين في النص التالي.
        لكل طالب، استخرج: الاسم (name)، تاريخ الميلاد YYYY-MM-DD (dob)، رقم الهوية (idNumber)، الصف (grade)، الشعبة (section)، البريد الإلكتروني (email)، المدرسة (school)، المحافظة (governorate)، المنطقة (region).
        أرجع النتيجة كـ JSON Array يحتوي على كائنات بهذه المفاتيح بالضبط: name, dob, idNumber, grade, section, email, school, governorate, region.
        حتى لو كان طالباً واحداً، أرجعه داخل مصفوفة [].
        إذا لم تجد معلومة معينة، اترك قيمتها فارغة "".
        تأكد من استخراج جميع الطلاب المذكورين في النص بلا استثناء.
        النص:
        ${pasteText}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      if (response.text) {
        const extracted = JSON.parse(response.text);
        const newList = Array.isArray(extracted) ? extracted : [extracted];
        setExtractedStudents([...extractedStudents, ...newList]);
        setPasteText(''); 
      }
    } catch (error) {
      console.error("Error extracting data with AI:", error);
      alert("حدث خطأ أثناء استخراج البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsAILoading(false);
    }
  };

  const removeExtracted = (index: number) => {
    setExtractedStudents(extractedStudents.filter((_, i) => i !== index));
  };

  const addManualToExtracted = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.idNumber) return;
    setExtractedStudents([...extractedStudents, { ...formData }]);
    setFormData({
      name: '',
      dob: '',
      idNumber: '',
      grade: '',
      section: '',
      email: '',
      school: '',
      governorate: '',
      region: ''
    });
  };

  const handleSaveAll = async () => {
    if (extractedStudents.length === 0) return;
    
    setIsLoading(true);
    setExistingStudentsError(null);
    try {
      // 1. Filter out empty ID numbers
      const validStudents = extractedStudents.filter(s => s.idNumber && s.idNumber.trim() !== '');
      
      if (validStudents.length === 0) {
        alert("لا يوجد طلاب بأرقام هوية صحيحة للحفظ.");
        setIsLoading(false);
        return;
      }

      // 2. Remove duplicates within the extracted list itself
      const uniqueStudents: StudentData[] = [];
      const seenIds = new Set<string>();
      for (const s of validStudents) {
        if (!seenIds.has(s.idNumber)) {
          seenIds.add(s.idNumber);
          uniqueStudents.push(s);
        }
      }

      // Check for existing students in DB
      const idNumbers = uniqueStudents.map(s => s.idNumber);
      const { data: existingStudents, error: checkError } = await supabase
        .from('students')
        .select('id_number, name')
        .in('id_number', idNumbers);
        
      if (checkError) throw checkError;
      
      if (existingStudents && existingStudents.length > 0) {
        setExistingStudentsError(existingStudents.map(s => ({ name: s.name, idNumber: s.id_number })));
        setIsLoading(false);
        return;
      }

      const { error } = await supabase
        .from('students')
        .insert(
          uniqueStudents.map(s => ({
            name: s.name || 'بدون اسم',
            dob: s.dob || '2000-01-01',
            id_number: s.idNumber,
            grade: s.grade,
            section: s.section,
            email: s.email,
            school: s.school,
            governorate: s.governorate,
            region: s.region,
            password: Math.floor(100000 + Math.random() * 900000).toString()
          }))
        );

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error: any) {
      console.error("Error saving students:", error);
      alert(`حدث خطأ أثناء حفظ البيانات: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
          <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">تم إضافة الطلاب بنجاح!</h1>
          <p className="text-gray-500 text-lg mb-8">تم حفظ بيانات {extractedStudents.length} طالب في قاعدة البيانات.</p>
          <p className="mt-8 text-sm text-gray-400">سيتم توجيهك للملف الشخصي خلال لحظات...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إضافة طلاب</h1>
            <p className="text-gray-500 text-sm">يمكنك إضافة مجموعة طلاب دفعة واحدة باستخدام الذكاء الاصطناعي</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* AI Extraction Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-indigo-900">الاستخراج الذكي (متعدد)</h2>
                <p className="text-sm text-indigo-700/70">انسخ نصاً يحتوي على بيانات طالب واحد أو أكثر</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="مثال: الطالب أحمد محمد، مدرسة النور، الصف 10 أ... والطالبة سارة علي، مدرسة الأمل، الصف 11 ب..."
                className="w-full h-32 rounded-xl border border-indigo-200 bg-white/50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 resize-none"
              />
              <div className="flex flex-wrap gap-3 justify-end">
                <Button 
                  type="button" 
                  onClick={handleAIExtract} 
                  disabled={!pasteText.trim() || isAILoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isAILoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      استخراج البيانات
                    </>
                  )}
                </Button>
                
                {extractedStudents.length > 0 && (
                  <Button 
                    onClick={handleSaveAll}
                    isLoading={isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    حفظ الكل ({extractedStudents.length})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Extracted List Preview */}
          {existingStudentsError && (
            <div className="bg-red-50 border border-red-200 p-6 rounded-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-red-900">عذراً، بعض الطلاب مضافين مسبقاً</h2>
                  <p className="text-sm text-red-700/70">يرجى إزالة الطلاب التاليين من القائمة للمتابعة</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {existingStudentsError.map((s, i) => (
                  <div key={i} className="bg-white p-3 rounded-xl border border-red-100 text-sm flex justify-between items-center">
                    <span className="font-bold text-gray-900">{s.name}</span>
                    <span className="text-gray-500 font-mono text-xs">{s.idNumber}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end">
                <Button variant="outline" onClick={() => setExistingStudentsError(null)} className="border-red-200 text-red-600 hover:bg-red-50">
                  حسناً، فهمت
                </Button>
              </div>
            </div>
          )}

          {extractedStudents.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                قائمة الطلاب المستخرجة ({extractedStudents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extractedStudents.map((s, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-start group">
                    <div>
                      <h3 className="font-bold text-gray-900">{s.name}</h3>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        <span>الهوية: {s.idNumber}</span>
                        <span>الصف: {s.grade} {s.section}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeExtracted(i)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-8 border-b border-gray-50 pb-4">
              <h2 className="font-bold text-gray-900 text-lg">إضافة يدوية للقائمة</h2>
              <p className="text-xs text-gray-400">أضف طالباً يدوياً ثم اضغط "حفظ الكل" في الأعلى</p>
            </div>
            
            <form onSubmit={addManualToExtracted} className="space-y-8">
              {/* Personal Info */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم الرباعي</label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="الاسم كما في الهوية"
                    icon={<User className="w-5 h-5" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ الميلاد</label>
                    <Input
                      name="dob"
                      value={formData.dob}
                      onChange={handleInputChange}
                      type="date"
                      icon={<Calendar className="w-5 h-5" />}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهوية</label>
                    <Input
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="9 أرقام"
                      icon={<Hash className="w-5 h-5" />}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Academic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المدرسة</label>
                  <Input
                    name="school"
                    value={formData.school}
                    onChange={handleInputChange}
                    type="text"
                    placeholder="اسم المدرسة"
                    icon={<School className="w-5 h-5" />}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الصف</label>
                    <Input
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="مثال: 10"
                      icon={<GraduationCap className="w-5 h-5" />}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الشعبة</label>
                    <Input
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="مثال: أ"
                      icon={<Users className="w-5 h-5" />}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Button type="submit" variant="outline" className="w-full border-primary-100 text-primary-600 hover:bg-primary-50">
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة للقائمة المؤقتة
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
