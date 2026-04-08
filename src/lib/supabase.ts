import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.error('❌ Supabase configuration is missing!');
  console.info('If you are seeing this in production (Vercel/GitHub Pages):');
  console.info('1. Go to your project settings on Vercel.');
  console.info('2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Environment Variables.');
  console.info('3. Redeploy your application.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
