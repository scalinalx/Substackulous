"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import LoginForm from "@/components/LoginForm"

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="text-center text-2xl font-bold mb-4">Sign In or Sign Up</DialogTitle>
        <LoginForm />
      </DialogContent>
    </Dialog>
  );
} 