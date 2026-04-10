import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, MessageSquare, Search, User, BookOpen, Tag, Send, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  grade: string;
  section: string;
  id_number: string;
}

export default function TeacherComments() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    teacherName: '',
    subject: '',
    commentType: 'أكاديمي',
    content: ''
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, grade, section, id_number')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.id_number.includes(searchQuery)
  );

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('student_comments')
        .insert({
          student_id: selectedStudent.id,
          teacher_name: formData.teacherName,
          subject: formData.subject,
          comment_type: formData.commentType,
          content: formData.content
        });

      if (error) throw error;

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedStudent(null);
        setFormData({ ...formData, content: '' }); // Keep teacher name and subject for convenience
      }, 2000);

    } catch (error) {
      console.error("Error saving comment:", error);
      alert("حدث خطأ أثناء حفظ التعليق.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تعليقات المعلمين</h1>
            <p className="text-gray-500 text-sm">أضف تعليقات وملاحظات لملفات الطلاب</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <div className="relative max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن طالب بالاسم أو رقم الهوية..."
                className="w-full pr-12 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary-600" />
              <p className="font-bold">جاري تحميل قائمة الطلاب...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {filteredStudents.map((student) => (
                <div 
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="p-4 rounded-2xl border border-gray-100 hover:border-primary-300 hover:bg-primary-50/50 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm group-hover:text-primary-700 transition-colors">{student.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{student.id_number}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">الصف {student.grade}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">شعبة {student.section}</span>
                  </div>
                </div>
              ))}
              {filteredStudents.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  لا يوجد طلاب مطابقين للبحث.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {showSuccess ? (
                <div className="p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إضافة التعليق بنجاح!</h2>
                  <p className="text-gray-500">سيظهر هذا التعليق في ملف الطالب.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">إضافة تعليق</h2>
                        <p className="text-xs text-gray-500">للطالب: <span className="font-bold text-primary-600">{selectedStudent.name}</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedStudent(null)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto">
                    <form id="comment-form" onSubmit={handleSubmitComment} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">اسم المعلم</label>
                          <Input 
                            type="text" 
                            value={formData.teacherName}
                            onChange={(e) => setFormData({...formData, teacherName: e.target.value})}
                            placeholder="مثال: أ. أحمد"
                            icon={<User className="w-4 h-4" />}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">المادة</label>
                          <Input 
                            type="text" 
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            placeholder="مثال: الرياضيات"
                            icon={<BookOpen className="w-4 h-4" />}
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نوع التعليق</label>
                        <div className="relative">
                          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <select 
                            value={formData.commentType}
                            onChange={(e) => setFormData({...formData, commentType: e.target.value})}
                            className="w-full pr-10 pl-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none appearance-none bg-white font-medium"
                            required
                          >
                            <option value="أكاديمي">أكاديمي (مستوى دراسي)</option>
                            <option value="سلوكي">سلوكي (تصرفات وانضباط)</option>
                            <option value="نفسي">نفسي (دعم وتوجيه)</option>
                            <option value="إداري">إداري (غياب وملاحظات عامة)</option>
                            <option value="إيجابي">إيجابي (شكر وتقدير)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">نص التعليق</label>
                        <textarea 
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                          placeholder="اكتب ملاحظاتك هنا..."
                          className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
                          required
                        />
                      </div>
                    </form>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={() => setSelectedStudent(null)}
                      className="flex-1"
                      disabled={isSubmitting}
                    >
                      إلغاء
                    </Button>
                    <Button 
                      form="comment-form"
                      type="submit"
                      className="flex-1 gap-2"
                      isLoading={isSubmitting}
                    >
                      <Send className="w-4 h-4" />
                      حفظ التعليق
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </MainLayout>
  );
}
