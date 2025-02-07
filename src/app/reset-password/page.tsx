import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const ResetPasswordForm = dynamic(() => import('@/app/components/ResetPasswordForm'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center px-4 h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your password to access your account.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
} 
