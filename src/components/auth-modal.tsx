"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import LoginForm from "@/components/LoginForm"
import LogintoUpgrade from "@/components/LogintoUpgrade"

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type?: 'default' | 'upgrade';
}

export function AuthModal({ isOpen, onClose, type = 'default' }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="text-center text-2xl font-bold mb-2">
          {type === 'upgrade' ? 'Sign In to Upgrade' : 'Sign In or Sign Up'}
        </DialogTitle>
        <DialogDescription className="text-center mb-4">
          {type === 'upgrade' 
            ? 'Access your account or create a new one to upgrade your plan'
            : 'Access your account or create a new one to get started'
          }
        </DialogDescription>
        {type === 'upgrade' ? <LogintoUpgrade /> : <LoginForm />}
      </DialogContent>
    </Dialog>
  );
} 