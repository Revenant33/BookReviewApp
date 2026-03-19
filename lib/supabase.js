import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://gfsyaldojiyevezyoucg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmc3lhbGRvaml5ZXZlenlvdWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDc0MDUsImV4cCI6MjA4NDEyMzQwNX0.D0-Chalo29CN1Xo9_AG6vhHA-MhKkBxUmW_dC97yzxA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});