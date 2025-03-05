"use client"

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import LoginForm from "@/components/LoginForm"

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="text-center text-2xl font-bold mb-2">Sign In or Sign Up</DialogTitle>
        <DialogDescription className="text-center mb-4">
          Access your account or create a new one to get started
        </DialogDescription>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
} 