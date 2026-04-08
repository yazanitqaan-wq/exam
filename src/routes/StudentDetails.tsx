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
  IdCard
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchStudentDetails();
    }
  }, [id]);

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
