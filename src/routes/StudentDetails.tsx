import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { 
  ArrowRight, 
  User, 
  Calendar, 
  Hash, 
  Mail, 
  School, 
  MapPin, 
  GraduationCap, 
  Users, 
  Loader2,
  Clock,
  IdCard,
  Award,
  BookOpenCheck,
  MessageSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface Student {
  id: string;
  name: string;
  dob: string;
  id_number: string;
  grade: string;
  section: string;
  email: string;
  school: string;
  governorate: string;
  region: string;
  created_at: string;
}

export default function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [studentExams, setStudentExams] = useState<any[]>([]);
  const [studentComments, setStudentComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
      fetchStudentExams();
      fetchStudentComments();
    }
  }, [id]);

  const fetchStudentComments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_comments')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setStudentComments(data);
      }
    } catch (error) {
      console.error("Error fetching student comments:", error);
    }
  };

  const fetchStudentExams = async () => {
    try {
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
        .eq('student_id', id)
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
            status: statusText,
            color: color
          };
        });
        setStudentExams(formattedExams);
      }
    } catch (error) {
      console.error("Error fetching student exams:", error);
    }
  };

  const fetchStudentDetails = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (error) {
      console.error("Error fetching student details:", error);
      alert("حدث خطأ أثناء تحميل بيانات الطالب");
      navigate('/profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500 font-bold">جاري تحميل بيانات الطالب...</p>
        </div>
      </MainLayout>
    );
  }

  if (!student) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">معلومات الطالب</h1>
            <p className="text-gray-500 text-sm">عرض التفاصيل الكاملة للسجل</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <div className="px-6 pb-8 -mt-12 text-center">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-md flex items-center justify-center mx-auto mb-4 border-4 border-white overflow-hidden">
                  <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-3xl">
                    {student.name.charAt(0)}
                  </div>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">{student.name}</h2>
                <span className="inline-block px-3 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded-full mb-4">
                  {student.id_number}
                </span>
                
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>أضيف في: {new Date(student.created_at).toLocaleDateString('ar-EG')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Personal Data */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <IdCard className="w-5 h-5 text-primary-600" />
                البيانات الشخصية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem icon={<User />} label="الاسم الكامل" value={student.name} />
                <DetailItem icon={<Calendar />} label="تاريخ الميلاد" value={student.dob} />
                <DetailItem icon={<Hash />} label="رقم الهوية" value={student.id_number} />
                <DetailItem icon={<Mail />} label="البريد الإلكتروني" value={student.email || 'غير متوفر'} />
              </div>
            </div>

            {/* Academic Data */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-600" />
                البيانات الأكاديمية
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem icon={<School />} label="المدرسة" value={student.school || 'غير محدد'} />
                <DetailItem icon={<GraduationCap />} label="الصف" value={student.grade || 'غير محدد'} />
                <DetailItem icon={<Users />} label="الشعبة" value={student.section || 'غير محدد'} />
              </div>
            </div>

            {/* Location Data */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-600" />
                العنوان والسكن
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailItem icon={<MapPin />} label="المحافظة" value={student.governorate || 'غير محدد'} />
                <DetailItem icon={<MapPin />} label="المنطقة" value={student.region || 'غير محدد'} />
              </div>
            </div>
            {/* Exams History */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600" />
                سجل الاختبارات
              </h3>
              
              <div className="space-y-3">
                {studentExams.length > 0 ? (
                  studentExams.map((exam, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={exam.id}
                      className="group p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-md hover:border-primary-100 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm", exam.color)}>
                            <BookOpenCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xs font-black text-gray-900">{exam.title} - {exam.subject}</h3>
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
                  </div>
                )}
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                تعليقات المعلمين
              </h3>
              
              <div className="space-y-4">
                {studentComments.length > 0 ? (
                  studentComments.map((comment) => (
                    <div key={comment.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-900">{comment.teacher_name}</h4>
                            <p className="text-[10px] text-gray-500">{comment.subject}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-md",
                            comment.comment_type === 'إيجابي' ? 'bg-green-100 text-green-700' :
                            comment.comment_type === 'سلوكي' ? 'bg-orange-100 text-orange-700' :
                            comment.comment_type === 'أكاديمي' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-200 text-gray-700'
                          )}>
                            {comment.comment_type}
                          </span>
                          <span className="text-[9px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(comment.created_at).toLocaleDateString('ar-EG')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-gray-100">
                        {comment.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-xs font-bold">لا توجد تعليقات حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center shrink-0">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <div>
        <span className="block text-xs text-gray-400 mb-0.5">{label}</span>
        <span className="block font-bold text-gray-900">{value}</span>
      </div>
    </div>
  );
}
