/**
 * Utility functions for tracking user actions in the usage_history table
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client for database operations that bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Interface for recording user actions
 */
export interface UsageRecordParams {
  user_email: string;
  action: string;
  credits_consumed: number;
}

/**
 * Records a user action in the usage_history table
 * 
 * @param params The usage record parameters
 * @returns A promise that resolves to a success boolean and any error message
 */
export const recordUsage = async (params: UsageRecordParams): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!params.user_email) {
      console.error('recordUsage: user_email is required');
      return { success: false, error: 'User email is required' };
    }

    if (!params.action) {
      console.error('recordUsage: action is required');
      return { success: false, error: 'Action description is required' };
    }

    if (params.credits_consumed < 0) {
      console.error('recordUsage: credits_consumed must be a non-negative number');
      return { success: false, error: 'Credits consumed must be a non-negative number' };
    }

    console.log(`Recording usage: ${params.user_email} - ${params.action} - ${params.credits_consumed} credits`);

    const { error } = await supabaseAdmin
      .from('usage_history')
      .insert({
        user_email: params.user_email,
        action: params.action,
        credits_consumed: params.credits_consumed
      });

    if (error) {
      console.error('Error recording usage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception in recordUsage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error recording usage' 
    };
  }
}; 