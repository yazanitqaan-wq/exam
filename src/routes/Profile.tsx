import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { UserPlus, LogOut, Users, GraduationCap, School, MapPin, Loader2, Calendar, Mail, Award, Clock, ChevronRight, Sparkles, BookOpenCheck, User, ChevronDown, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  id_number: string;
  dob: string;
  grade: string;
  section: string;
  school: string;
  email: string;
  governorate: string;
  region: string;
}

interface ExamResult {
  id: string;
  subject: string;
  score: number;
  total: number;
  date: string;
  status: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول';
  color: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const role = localStorage.getItem('userRole') || 'student';
  const studentId = localStorage.getItem('studentId');
  const [students, setStudents] = useState<Student[]>([]);
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [studentExams, setStudentExams] = useState<ExamResult[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const normalizeText = (text: string) => {
    if (!text) return '';
    return text.replace(/\s+/g, '')
               .replace(/[أإآ]/g, 'ا')
               .replace(/ة/g, 'ه')
               .replace(/[-_]/g, '');
  };

  const formatName = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  useEffect(() => {
    if (role === 'teacher') {
      fetchStudents();
    } else if (role === 'student' && studentId) {
      fetchCurrentStudent();
      fetchStudentExams();
    }
  }, [role, studentId]);

  const fetchStudentExams = async () => {
    try {
      let currentStudentId = studentId;
      if (currentStudentId && currentStudentId.length !== 36) {
        const { data: sData } = await supabase.from('students').select('id').eq('id_number', currentStudentId).single();
        if (sData) {
          currentStudentId = sData.id;
          localStorage.setItem('studentId', currentStudentId);
        }
      }

      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          score,
          status,
          submitted_at,
          exam_sessions (
            exams (
              title,
              subject,
              questions (count)
            )
          )
        `)
        .eq('student_id', currentStudentId)
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedExams = data.map((sub: any) => {
          const total = sub.exam_sessions?.exams?.questions?.[0]?.count || 0;
          const percentage = total > 0 ? (sub.score / total) * 100 : 0;
          let statusText = 'مقبول';
          let color = 'bg-gray-500';
          if (percentage >= 90) { statusText = 'ممتاز'; color = 'bg-emerald-500'; }
          else if (percentage >= 80) { statusText = 'جيد جداً'; color = 'bg-blue-500'; }
          else if (percentage >= 70) { statusText = 'جيد'; color = 'bg-amber-500'; }

          return {
            id: sub.id,
            subject: sub.exam_sessions?.exams?.subject || 'غير محدد',
            title: sub.exam_sessions?.exams?.title || 'اختبار',
            score: sub.score,
            total: total,
            date: new Date(sub.submitted_at).toLocaleDateString('ar-EG'),
            status: statusText as any,
            color: color
          };
        });
        setStudentExams(formattedExams);
      }
    } catch (error) {
      console.error("Error fetching student exams:", error);
    }
  };

  const fetchCurrentStudent = async () => {
    setIsLoading(true);
    try {
      let currentStudentId = studentId;
      let queryColumn = 'id';
      if (currentStudentId && currentStudentId.length !== 36) {
        queryColumn = 'id_number';
      }

      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq(queryColumn, currentStudentId)
        .single();

      if (error) throw error;
      
      if (queryColumn === 'id_number' && data) {
        localStorage.setItem('studentId', data.id);
      }
      
      setCurrentStudent(data);
    } catch (error) {
      console.error("Error fetching student details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('students').delete().eq('id', studentToDelete.id);
      if (error) throw error;
      
      // Update local state
      setStudents(students.filter(s => s.id !== studentToDelete.id));
      setStudentToDelete(null);
      setDeleteConfirmationText('');
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("حدث خطأ أثناء حذف الطالب.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Group students by Grade and Section
  const groupedStudents = students.reduce((acc, student) => {
    const key = `${student.grade || 'غير محدد'} ${student.section || ''}`.trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  // Sort students alphabetically within each group
  Object.keys(groupedStudents).forEach(key => {
    groupedStudents[key].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  });

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 md:gap-10 h-full pb-12">
        {/* Header Section - Only for Teachers (Students have it in Layout Header) */}
        {role === 'teacher' && (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-gray-900 mb-1">ملف الإدارة</h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-bold">لوحة تحكم الإدارة والمعلمين</p>
            </div>
          </div>
        )}

        {role === 'teacher' && (
          <>
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-black text-gray-900 mb-4 px-1">أدوات الإدارة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <button 
                  onClick={() => navigate('/add-student')}
                  className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <UserPlus className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="font-black text-primary-700 text-xs">إضافة طالب</span>
                </button>
                
                <button 
                  onClick={() => navigate('/create-exam')}
                  className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <BookOpenCheck className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-black text-blue-700 text-xs">إنشاء اختبار</span>
                </button>

                <button 
                  onClick={() => navigate('/publish-exam')}
                  className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="font-black text-indigo-700 text-xs">نشر امتحان متزامن</span>
                </button>
                <button 
                  onClick={() => navigate('/grades')}
                  className="flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-black text-emerald-700 text-xs">علامات الطلاب</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100 flex-1">
              <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-sm font-black text-gray-900">قائمة الطلاب المضافين</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {students.length} طالب
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs font-bold">جاري تحميل قائمة الطلاب...</p>
                </div>
              ) : Object.keys(groupedStudents).length > 0 ? (
                <div className="space-y-3">
                  {(Object.entries(groupedStudents) as [string, Student[]][]).sort().map(([group, groupStudents]) => (
                    <div key={group} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between p-3 sm:p-4 bg-gray-50/50 hover:bg-primary-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-lg flex items-center justify-center font-black text-xs">
                            {groupStudents.length}
                          </div>
                          <span className="font-black text-gray-900 text-xs">صف {group}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform duration-300", expandedGroups[group] && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {expandedGroups[group] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-0 border-t border-gray-100">
                              <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                  <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-[10px]">
                                      <th className="py-2 px-4 font-bold">اسم الطالب</th>
                                      <th className="py-2 px-4 font-bold">رقم الهوية</th>
                                      <th className="py-2 px-4 font-bold">المدرسة</th>
                                      <th className="py-2 px-4 font-bold w-10"></th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupStudents.map((student) => (
                                      <tr 
                                        key={student.id}
                                        onClick={() => navigate(`/student/${student.id}`)}
                                        className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors group last:border-0"
                                      >
                                        <td className="py-2 px-4 font-bold text-gray-900 text-xs group-hover:text-primary-600 transition-colors">
                                          {formatName(student.name)}
                                        </td>
                                        <td className="py-2 px-4 text-[10px] text-gray-500 font-mono">
                                          {student.id_number}
                                        </td>
                                        <td className="py-2 px-4 text-[10px] text-gray-500">
                                          {student.school || 'غير محدد'}
                                        </td>
                                        <td className="py-2 px-4 text-left">
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setStudentToDelete(student);
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  <Users className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs font-bold">لا يوجد طلاب مضافون حالياً</p>
                  <p className="text-[10px]">ابدأ بإضافة أول طالب باستخدام الزر أعلاه</p>
                </div>
              )}
            </div>
          </>
        )}

        {role === 'student' && (
          <div className="space-y-4 sm:space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary-600" />
                <p className="text-xs font-bold">جاري تحميل ملفك الشخصي...</p>
              </div>
            ) : currentStudent ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-br from-primary-600 to-blue-600 opacity-10"></div>
                    <div className="relative">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border-2 border-white">
                        <span className="text-2xl font-black text-primary-600">{currentStudent.name.charAt(0)}</span>
                      </div>
                      <h2 className="text-sm sm:text-lg font-black text-gray-900 mb-1">{currentStudent.name}</h2>
                      <p className="text-primary-600 font-bold text-[10px] mb-5 bg-primary-50 px-3 py-1 rounded-full inline-block">
                        طالب - {currentStudent.grade} {currentStudent.section}
                      </p>
                    </div>

                    <div className="space-y-3 text-right">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">تاريخ الميلاد</p>
                          <p className="font-bold text-xs text-gray-700">{currentStudent.dob}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                          <School className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">المدرسة</p>
                          <p className="font-bold text-xs text-gray-700 truncate max-w-[150px] sm:max-w-[180px]">{currentStudent.school}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</p>
                          <p className="font-bold text-xs text-gray-700 truncate max-w-[150px] sm:max-w-[180px]">{currentStudent.email || 'غير متوفر'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-400 shadow-sm shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">العنوان</p>
                          <p className="font-bold text-xs text-gray-700">{currentStudent.governorate} - {currentStudent.region}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Exams History */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] shadow-sm border border-gray-100 h-full"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-primary-200">
                          <Award className="w-5 h-5" />
                        </div>
                        <div>
                          <h2 className="text-sm font-black text-gray-900">سجل الامتحانات</h2>
                          <p className="text-gray-400 text-[10px] font-bold">نتائجك في الاختبارات السابقة</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-black">أداء متميز</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {studentExams.length > 0 ? (
                        studentExams.map((exam, index) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            key={exam.id}
                            className="group p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-primary-100 transition-all cursor-pointer"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", exam.color)}>
                                  <BookOpenCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h3 className="text-xs font-black text-gray-900 group-hover:text-primary-600 transition-colors">{(exam as any).title} - {exam.subject}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center gap-1 text-gray-400 text-[9px] font-bold">
                                      <Clock className="w-3 h-3" />
                                      <span>{exam.date}</span>
                                    </div>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="text-[9px] font-black text-primary-600">{exam.status}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                                <div className="text-left">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-lg font-black text-gray-900">{exam.score}</span>
                                    <span className="text-[10px] font-bold text-gray-400">/ {exam.total}</span>
                                  </div>
                                  <div className="w-20 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${exam.total > 0 ? (exam.score / exam.total) * 100 : 0}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      className={cn("h-full rounded-full", exam.color)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                          <BookOpenCheck className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs font-bold">لا توجد امتحانات مسجلة حالياً</p>
                          <p className="text-[10px]">سيتم عرض نتائج اختباراتك هنا فور صدورها</p>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" className="w-full mt-6 py-3 rounded-xl border-2 border-dashed border-gray-100 text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 text-xs font-bold transition-all">
                      عرض جميع النتائج
                    </Button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-sm font-black text-gray-900 mb-1">لم يتم العثور على بياناتك</h2>
                <p className="text-xs text-gray-500">يرجى التأكد من تسجيل الدخول بشكل صحيح</p>
                <Button onClick={() => navigate('/login')} className="mt-6 px-6 py-2 h-auto text-xs rounded-lg">العودة لتسجيل الدخول</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">تأكيد الحذف</h2>
            <p className="text-center text-gray-500 mb-6">
              هل أنت متأكد من رغبتك في حذف الطالب <span className="font-bold text-gray-900">{studentToDelete.name}</span>؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            
            <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100 text-right">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                يرجى كتابة اسم الطالب لتأكيد الحذف:
              </label>
              <Input 
                type="text" 
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="اكتب الاسم هنا..."
              />
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => { setStudentToDelete(null); setDeleteConfirmationText(''); }}
                className="flex-1"
                disabled={isDeleting}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleDeleteStudent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                isLoading={isDeleting}
                disabled={isDeleting || normalizeText(deleteConfirmationText) !== normalizeText(studentToDelete.name)}
              >
                نعم، احذف الطالب
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </MainLayout>
  );
}
