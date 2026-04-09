import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { UserPlus, LogOut, Users, GraduationCap, School, MapPin, Loader2, Calendar, Mail, Award, Clock, ChevronRight, Sparkles, BookOpenCheck, User, ChevronDown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/Button';
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
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const mockExams: ExamResult[] = [];

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
    }
  }, [role, studentId]);

  const fetchCurrentStudent = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id_number', studentId)
        .single();

      if (error) throw error;
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">ملف الإدارة</h1>
              <p className="text-gray-500">لوحة تحكم الإدارة والمعلمين</p>
            </div>
          </div>
        )}

        {role === 'teacher' && (
          <>
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">أدوات الإدارة</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => navigate('/add-student')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 hover:bg-primary-50 hover:border-primary-300 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <UserPlus className="w-6 h-6 text-primary-600" />
                  </div>
                  <span className="font-bold text-primary-700 text-lg">إضافة طالب</span>
                </button>
                
                <button 
                  onClick={() => navigate('/create-exam')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-300 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <BookOpenCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="font-bold text-blue-700 text-lg">إنشاء اختبار</span>
                </button>

                <button 
                  onClick={() => navigate('/publish-exam')}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all group"
                >
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Send className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="font-bold text-indigo-700 text-lg">نشر امتحان متزامن</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex-1">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">قائمة الطلاب المضافين</h2>
                </div>
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
                  {students.length} طالب
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>جاري تحميل قائمة الطلاب...</p>
                </div>
              ) : Object.keys(groupedStudents).length > 0 ? (
                <div className="space-y-4">
                  {(Object.entries(groupedStudents) as [string, Student[]][]).sort().map(([group, groupStudents]) => (
                    <div key={group} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center justify-between p-5 bg-gray-50/50 hover:bg-primary-50/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center font-black text-lg">
                            {groupStudents.length}
                          </div>
                          <span className="font-black text-gray-900 text-lg">صف {group}</span>
                        </div>
                        <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-300", expandedGroups[group] && "rotate-180")} />
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
                                    <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
                                      <th className="py-4 px-6 font-bold">اسم الطالب</th>
                                      <th className="py-4 px-6 font-bold">رقم الهوية</th>
                                      <th className="py-4 px-6 font-bold">المدرسة</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {groupStudents.map((student) => (
                                      <tr 
                                        key={student.id}
                                        onClick={() => navigate(`/student/${student.id}`)}
                                        className="border-b border-gray-50 hover:bg-primary-50/50 cursor-pointer transition-colors group last:border-0"
                                      >
                                        <td className="py-4 px-6 font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                                          {formatName(student.name)}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500 font-mono">
                                          {student.id_number}
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500">
                                          {student.school || 'غير محدد'}
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
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                  <Users className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-lg">لا يوجد طلاب مضافون حالياً</p>
                  <p className="text-sm">ابدأ بإضافة أول طالب باستخدام الزر أعلاه</p>
                </div>
              )}
            </div>
          </>
        )}

        {role === 'student' && (
          <div className="space-y-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-600" />
                <p className="text-lg font-bold">جاري تحميل ملفك الشخصي...</p>
              </div>
            ) : currentStudent ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-900/5 border border-gray-100 text-center relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-primary-600 to-blue-600 opacity-10"></div>
                    <div className="relative">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-lg flex items-center justify-center mx-auto mb-6 border-4 border-white">
                        <span className="text-4xl font-black text-primary-600">{currentStudent.name.charAt(0)}</span>
                      </div>
                      <h2 className="text-2xl font-black text-gray-900 mb-1">{currentStudent.name}</h2>
                      <p className="text-primary-600 font-bold text-sm mb-6 bg-primary-50 px-4 py-1.5 rounded-full inline-block">
                        طالب - {currentStudent.grade} {currentStudent.section}
                      </p>
                    </div>

                    <div className="space-y-4 text-right">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">تاريخ الميلاد</p>
                          <p className="font-bold text-gray-700">{currentStudent.dob}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                          <School className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">المدرسة</p>
                          <p className="font-bold text-gray-700 truncate max-w-[180px]">{currentStudent.school}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">البريد الإلكتروني</p>
                          <p className="font-bold text-gray-700 truncate max-w-[180px]">{currentStudent.email || 'غير متوفر'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-400 shadow-sm">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">العنوان</p>
                          <p className="font-bold text-gray-700">{currentStudent.governorate} - {currentStudent.region}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Exams History */}
                <div className="lg:col-span-2 space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-primary-900/5 border border-gray-100 h-full"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200">
                          <Award className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-gray-900">سجل الامتحانات</h2>
                          <p className="text-gray-400 text-sm font-bold">نتائجك في الاختبارات السابقة</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-100">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-black">أداء متميز</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {mockExams.length > 0 ? (
                        mockExams.map((exam, index) => (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + index * 0.1 }}
                            key={exam.id}
                            className="group p-5 rounded-3xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-2xl hover:shadow-primary-900/5 hover:border-primary-100 transition-all cursor-pointer"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", exam.color)}>
                                  <BookOpenCheck className="w-7 h-7" />
                                </div>
                                <div>
                                  <h3 className="text-lg font-black text-gray-900 group-hover:text-primary-600 transition-colors">{exam.subject}</h3>
                                  <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{exam.date}</span>
                                    </div>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span className="text-xs font-black text-primary-600">{exam.status}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-6">
                                <div className="text-left">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-gray-900">{exam.score}</span>
                                    <span className="text-sm font-bold text-gray-400">/ {exam.total}</span>
                                  </div>
                                  <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${(exam.score / exam.total) * 100}%` }}
                                      transition={{ duration: 1, delay: 0.5 }}
                                      className={cn("h-full rounded-full", exam.color)}
                                    />
                                  </div>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-all">
                                  <ChevronRight className="w-5 h-5" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                          <BookOpenCheck className="w-12 h-12 mb-4 opacity-20" />
                          <p className="text-lg font-bold">لا توجد امتحانات مسجلة حالياً</p>
                          <p className="text-sm">سيتم عرض نتائج اختباراتك هنا فور صدورها</p>
                        </div>
                      )}
                    </div>

                    <Button variant="ghost" className="w-full mt-8 py-6 rounded-2xl border-2 border-dashed border-gray-100 text-gray-400 hover:text-primary-600 hover:border-primary-200 hover:bg-primary-50 font-bold transition-all">
                      عرض جميع النتائج
                    </Button>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                  <User className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">لم يتم العثور على بياناتك</h2>
                <p className="text-gray-500">يرجى التأكد من تسجيل الدخول بشكل صحيح</p>
                <Button onClick={() => navigate('/login')} className="mt-8 px-8 rounded-xl">العودة لتسجيل الدخول</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
