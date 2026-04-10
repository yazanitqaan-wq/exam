import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = 'student' | 'teacher';

interface RoleSelectorProps {
  selectedRole: Role;
  onRoleChange: (role: Role) => void;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({ selectedRole, onRoleChange }) => {
  return (
    <div className="flex p-1.5 space-x-1 space-x-reverse bg-gray-100/80 rounded-2xl">
      <button
        type="button"
        onClick={() => onRoleChange('student')}
        className={cn(
          'relative flex-1 flex items-center justify-center py-2.5 sm:py-3 text-[10px] sm:text-sm font-bold rounded-xl transition-colors z-10',
          selectedRole === 'student' ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        {selectedRole === 'student' && (
          <motion.div
            layoutId="role-bg"
            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50"
            initial={false}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5" />
          طالب
        </span>
      </button>
      <button
        type="button"
        onClick={() => onRoleChange('teacher')}
        className={cn(
          'relative flex-1 flex items-center justify-center py-2.5 sm:py-3 text-[10px] sm:text-sm font-bold rounded-xl transition-colors z-10',
          selectedRole === 'teacher' ? 'text-primary-700' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        {selectedRole === 'teacher' && (
          <motion.div
            layoutId="role-bg"
            className="absolute inset-0 bg-white rounded-xl shadow-sm border border-gray-200/50"
            initial={false}
            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
          <Presentation className="w-4 h-4 sm:w-5 sm:h-5" />
          معلم
        </span>
      </button>
    </div>
  );
};
