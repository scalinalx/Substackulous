import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a single instance of the Supabase client
const supabase = createClientComponentClient();

export default supabase;

export interface UserProfile {
  id: string;
  email: string;
  credits: number;
  created_at: string;
  last_login: string;
}

export interface AuthError {
  message: string;
} 