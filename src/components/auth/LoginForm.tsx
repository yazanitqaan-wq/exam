import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Lock, ArrowLeft, Search, CheckCircle2, Calendar, Hash, AlertCircle, Copy, Check, Smartphone, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RoleSelector, Role } from './RoleSelector';
import { supabase } from '@/lib/supabase';

export const LoginForm = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccessLoading, setIsSuccessLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'recovery' | 'recovery_success'>('login');
  const [recoveredData, setRecoveredData] = useState<{ id: string; pass: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'id' | 'pass' | null>(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('rememberedRole');
    const savedId = localStorage.getItem('rememberedId');
    if (savedRole && savedId) {
      setRole(savedRole as Role);
      setIdentifier(savedId);
    }
  }, []);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setError(null);
    setIdentifier('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();
    
    try {
      if (role === 'teacher') {
        // 1. محاولة تسجيل الدخول عبر Supabase Auth أولاً
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password: cleanPassword,
        });

        if (!authError && authData.user) {
          if (rememberMe) {
            localStorage.setItem('rememberedRole', 'teacher');
            localStorage.setItem('rememberedId', cleanIdentifier);
          }
          localStorage.setItem('userRole', 'teacher');
          localStorage.removeItem('studentName');
          localStorage.removeItem('studentId');
          
          setIsSuccessLoading(true);
          setTimeout(() => {
            navigate('/home');
          }, 1500);
          return;
        }

        // 2. Fallback: التحقق من المعلم (يزن) - الكود القديم
        if (cleanIdentifier === '123456' && cleanPassword === '0') {
          if (rememberMe) {
            localStorage.setItem('rememberedRole', 'teacher');
            localStorage.setItem('rememberedId', cleanIdentifier);
          } else {
            localStorage.removeItem('rememberedRole');
            localStorage.removeItem('rememberedId');
          }
          localStorage.setItem('userRole', 'teacher');
          localStorage.removeItem('studentName');
          localStorage.removeItem('studentId');
          
          setIsSuccessLoading(true);
          setTimeout(() => {
            navigate('/home');
          }, 1500);
        } else {
          setError(authError ? 'خطأ في البريد الإلكتروني أو كلمة السر.' : 'خطأ في الرقم السري أو كلمة السر. يرجى إدخال البيانات الصحيحة.');
          setIsLoading(false);
        }
      } else if (role === 'student') {
        // التحقق من الطالب في قاعدة البيانات
        const { data, error: dbError } = await supabase
          .from('students')
          .select('*')
          .eq('id_number', cleanIdentifier)
          .eq('password', cleanPassword)
          .single();

        if (dbError || !data) {
          setError('عذراً، لم يتم العثور على طالب بهذه البيانات. تأكد من الرمز وكلمة السر.');
          setIsLoading(false);
        } else {
          if (rememberMe) {
            localStorage.setItem('rememberedRole', 'student');
            localStorage.setItem('rememberedId', cleanIdentifier);
          } else {
            localStorage.removeItem('rememberedRole');
            localStorage.removeItem('rememberedId');
          }
          localStorage.setItem('userRole', 'student');
          localStorage.setItem('studentName', data.name);
          localStorage.setItem('studentId', data.id);
          localStorage.setItem('studentIdNumber', data.id_number);
          // Clear any teacher remnants
          localStorage.removeItem('teacherEmail');
          
          setIsSuccessLoading(true);
          setTimeout(() => {
            navigate('/home');
          }, 1500);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة لاحقاً.');
      setIsLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget;
    const firstName = (form.elements[0] as HTMLInputElement).value.trim();
    const lastName = (form.elements[1] as HTMLInputElement).value.trim();
    const dob = (form.elements[2] as HTMLInputElement).value;
    const idNumber = (form.elements[3] as HTMLInputElement).value.trim();

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: dbError } = await supabase
        .from('students')
        .select('id_number, password, name')
        .eq('id_number', idNumber)
        .eq('dob', dob)
        .single();

      if (dbError || !data) {
        setError('عذراً، لم نتمكن من العثور على حساب بهذه البيانات. يرجى التأكد من صحة المعلومات.');
      } else {
        // التحقق من الاسم (بشكل بسيط)
        if (data.name.includes(firstName) || data.name.includes(lastName)) {
          setRecoveredData({ id: data.id_number, pass: data.password });
          setView('recovery_success');
        } else {
          setError('البيانات المدخلة لا تطابق السجل الموجود لدينا.');
        }
      }
    } catch (err) {
      setError('حدث خطأ أثناء الاستعلام. يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: 'id' | 'pass') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleGoToLogin = () => {
    if (recoveredData) {
      setIdentifier(recoveredData.id);
      setPassword(recoveredData.pass);
      setRole('student');
    }
    setView('login');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence>
        {isSuccessLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-3xl shadow-2xl border border-gray-100 flex flex-col items-center"
            >
              <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
              <h2 className="text-xl font-black text-gray-900">جاري تسجيل الدخول...</h2>
              <p className="text-gray-500 mt-2 font-medium">مرحباً بك في منصة الاختبارات</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner border border-primary-100"
              >
                <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">مرحباً بك مجدداً</h1>
              <p className="text-[10px] sm:text-base text-gray-500">سجل دخولك للوصول إلى منصة الامتحانات</p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-5 sm:space-y-6 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <RoleSelector selectedRole={role} onRoleChange={handleRoleChange} />

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl flex items-center gap-3 text-red-600"
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <p className="text-[10px] sm:text-sm font-bold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 sm:space-y-5 mt-6">
                <div>
                  <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">
                    {role === 'student' ? 'الرمز السري' : 'البريد الإلكتروني أو الرقم السري'}
                  </label>
                  <Input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={role === 'student' ? 'أدخل الرمز السري' : 'أدخل البريد الإلكتروني أو الرقم السري'}
                    icon={<User className="w-4 h-4 sm:w-5 sm:h-5" />}
                    required
                    className="text-[10px] sm:text-sm h-10 sm:h-12"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] sm:text-sm font-semibold text-gray-700">كلمة السر</label>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                    required
                    className="text-[10px] sm:text-sm h-10 sm:h-12"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="rememberMe" className="text-[10px] sm:text-sm text-gray-600 cursor-pointer select-none">
                  تذكر بياناتي على هذا الجهاز
                </label>
              </div>

              <Button type="submit" className="w-full group mt-6 sm:mt-8 text-[11px] sm:text-base h-11 sm:h-14" size="lg" isLoading={isLoading}>
                <span>تسجيل الدخول</span>
                {!isLoading && <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2 group-hover:-translate-x-1 transition-transform" />}
              </Button>

              {role === 'student' && (
                <p className="text-center text-[10px] sm:text-sm text-gray-600 mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
                  لا تعرف بيانات الدخول؟{' '}
                  <button type="button" onClick={() => setView('recovery')} className="font-bold text-primary-600 hover:text-primary-700 transition-colors">
                    استعلم عنها الآن
                  </button>
                </p>
              )}
            </form>
          </motion.div>
        )}

        {view === 'recovery' && (
          <motion.div
            key="recovery"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center mb-6 sm:mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, delay: 0.2 }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner border border-blue-100"
              >
                <Search className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2">استعلام عن بيانات الدخول</h1>
              <p className="text-[10px] sm:text-base text-gray-500">أدخل بياناتك كما هي في الهوية لاسترجاع حسابك</p>
            </div>

            <form onSubmit={handleRecoverySubmit} className="space-y-4 sm:space-y-5 bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl flex items-center gap-3 text-red-600 mb-4"
                  >
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                    <p className="text-[10px] sm:text-sm font-bold">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">الاسم الأول</label>
                  <Input type="text" placeholder="الاسم الأول" required className="text-[10px] sm:text-sm h-10 sm:h-12" />
                </div>
                <div>
                  <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">اسم العائلة</label>
                  <Input type="text" placeholder="اسم العائلة" required className="text-[10px] sm:text-sm h-10 sm:h-12" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">تاريخ الميلاد</label>
                <Input type="date" icon={<Calendar className="w-4 h-4 sm:w-5 sm:h-5" />} required className="text-[10px] sm:text-sm h-10 sm:h-12" />
              </div>

              <div>
                <label className="block text-[10px] sm:text-sm font-semibold text-gray-700 mb-2">رقم الهوية</label>
                <Input type="text" placeholder="رقم الهوية المكون من 9 أرقام" icon={<Hash className="w-4 h-4 sm:w-5 sm:h-5" />} required className="text-[10px] sm:text-sm h-10 sm:h-12" />
              </div>

              <div className="flex flex-col gap-3 mt-6 sm:mt-8">
                <Button type="submit" className="w-full text-[11px] sm:text-base h-11 sm:h-14" size="lg" isLoading={isLoading}>
                  موافق
                </Button>
                <Button type="button" variant="ghost" onClick={() => setView('login')} className="w-full text-[11px] sm:text-sm h-10 sm:h-12" disabled={isLoading}>
                  عودة لتسجيل الدخول
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {view === 'recovery_success' && (
          <motion.div
            key="recovery_success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center"
          >
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تم العثور على حسابك</h2>
            <div className="flex items-center justify-center gap-2 text-primary-600 font-bold mb-6 bg-primary-50 py-2 px-4 rounded-xl inline-flex mx-auto">
              <Smartphone className="w-4 h-4" />
              <span className="text-sm">يرجى التقاط الشاشة لحفظ البيانات</span>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 sm:p-6 rounded-2xl mb-8 text-right">
              <div>
                <span className="block text-sm text-gray-500 mb-2">الرمز السري (رقم الهوية):</span>
                <div className="relative">
                  <span className="block text-lg font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-200 text-center tracking-widest">
                    {recoveredData?.id}
                  </span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(recoveredData?.id || '', 'id')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {copiedField === 'id' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-sm text-gray-500 mb-2">كلمة السر:</span>
                <div className="relative">
                  <span className="block text-lg font-bold text-gray-900 bg-white p-3 rounded-xl border border-gray-200 text-center tracking-widest">
                    {recoveredData?.pass}
                  </span>
                  <button 
                    type="button"
                    onClick={() => copyToClipboard(recoveredData?.pass || '', 'pass')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-primary-600 transition-colors"
                  >
                    {copiedField === 'pass' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={handleGoToLogin} className="w-full" size="lg">
              الذهاب لتسجيل الدخول
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
