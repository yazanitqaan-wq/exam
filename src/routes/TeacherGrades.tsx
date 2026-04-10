import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layouts/MainLayout';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, Filter, BookOpen, GraduationCap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function TeacherGrades() {
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  
  // Unique options for filters
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);
  const [availableSections, setAvailableSections] = useState<string[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_submissions')
        .select(`
          id,
          score,
          status,
          student_id,
          students (
            name,
            grade,
            section
          ),
          exam_sessions (
            exams (
              title,
              subject,
              questions (count)
            )
          )
        `)
        .eq('status', 'submitted');

      if (error) throw error;

      if (data) {
        setGradesData(data);
        
        // Extract unique values for filters
        const grades = new Set<string>();
        const sections = new Set<string>();
        const subjects = new Set<string>();
        
        data.forEach(item => {
          const student = Array.isArray(item.students) ? item.students[0] : item.students;
          const examSession = Array.isArray(item.exam_sessions) ? item.exam_sessions[0] : item.exam_sessions;
          const exam = examSession?.exams ? (Array.isArray(examSession.exams) ? examSession.exams[0] : examSession.exams) : null;

          if (student?.grade) grades.add(student.grade);
          if (student?.section) sections.add(student.section);
          if (exam?.subject) subjects.add(exam.subject);
        });
        
        setAvailableGrades(Array.from(grades));
        setAvailableSections(Array.from(sections));
        setAvailableSubjects(Array.from(subjects));
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logic
  const filteredData = gradesData.filter(item => {
    const student = Array.isArray(item.students) ? item.students[0] : item.students;
    const examSession = Array.isArray(item.exam_sessions) ? item.exam_sessions[0] : item.exam_sessions;
    const exam = examSession?.exams ? (Array.isArray(examSession.exams) ? examSession.exams[0] : examSession.exams) : null;

    const matchGrade = selectedGrade === 'all' || student?.grade === selectedGrade;
    const matchSection = selectedSection === 'all' || student?.section === selectedSection;
    const matchSubject = selectedSubject === 'all' || exam?.subject === selectedSubject;
    return matchGrade && matchSection && matchSubject;
  });

  // Group by Exam Title
  const groupedByExam = filteredData.reduce((acc, item) => {
    const examSession = Array.isArray(item.exam_sessions) ? item.exam_sessions[0] : item.exam_sessions;
    const exam = examSession?.exams ? (Array.isArray(examSession.exams) ? examSession.exams[0] : examSession.exams) : null;
    const examTitle = exam?.title || 'غير محدد';
    if (!acc[examTitle]) acc[examTitle] = [];
    acc[examTitle].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <MainLayout>
      <div className="flex flex-col gap-6 pb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-gray-900">سجل علامات الطلاب</h1>
              <p className="text-xs text-gray-500 font-bold">تصفية وعرض نتائج الاختبارات</p>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 px-1">الصف</label>
              <select 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">جميع الصفوف</option>
                {availableGrades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 px-1">الشعبة</label>
              <select 
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">جميع الشعب</option>
                {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 px-1">المادة</label>
              <select 
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="all">جميع المواد</option>
                {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-600" />
              <p className="text-xs font-bold">جاري تحميل العلامات...</p>
            </div>
          ) : Object.keys(groupedByExam).length > 0 ? (
            Object.entries(groupedByExam).map(([examTitle, submissions]) => (
              <div key={examTitle} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-emerald-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-black text-gray-900 text-sm">{examTitle}</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-md border border-emerald-100 text-emerald-700">
                    {(submissions as any[]).length} تقديم
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-[10px]">
                        <th className="py-3 px-4 font-bold">اسم الطالب</th>
                        <th className="py-3 px-4 font-bold">الصف والشعبة</th>
                        <th className="py-3 px-4 font-bold">العلامة</th>
                        <th className="py-3 px-4 font-bold">النسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(submissions as any[]).map((sub, idx) => {
                        const student = Array.isArray(sub.students) ? sub.students[0] : sub.students;
                        const examSession = Array.isArray(sub.exam_sessions) ? sub.exam_sessions[0] : sub.exam_sessions;
                        const exam = examSession?.exams ? (Array.isArray(examSession.exams) ? examSession.exams[0] : examSession.exams) : null;
                        const questions = exam?.questions ? (Array.isArray(exam.questions) ? exam.questions[0] : exam.questions) : null;
                        const total = questions?.count || 0;
                        const percentage = total > 0 ? Math.round((sub.score / total) * 100) : 0;
                        return (
                          <tr key={idx} className="border-b border-gray-50 hover:bg-emerald-50/30 transition-colors last:border-0">
                            <td className="py-3 px-4 font-bold text-gray-900 text-xs">
                              {student?.name || 'غير معروف'}
                            </td>
                            <td className="py-3 px-4 text-[10px] text-gray-500">
                              {student?.grade} {student?.section}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-black text-gray-900">{sub.score}</span>
                              <span className="text-[10px] text-gray-400 mx-1">/</span>
                              <span className="text-[10px] text-gray-500">{total}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[10px] font-black w-8 text-left",
                                  percentage >= 90 ? "text-emerald-600" : 
                                  percentage >= 70 ? "text-blue-600" : 
                                  percentage >= 50 ? "text-amber-600" : "text-red-600"
                                )}>
                                  {percentage}%
                                </span>
                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full",
                                      percentage >= 90 ? "bg-emerald-500" : 
                                      percentage >= 70 ? "bg-blue-500" : 
                                      percentage >= 50 ? "bg-amber-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
              <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-gray-900 mb-1">لا توجد نتائج</h4>
              <p className="text-gray-500 text-[10px]">لم يتم العثور على علامات تطابق خيارات التصفية المحددة.</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
