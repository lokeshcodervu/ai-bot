'use client';

import React from 'react';
import { AuthFlow } from '../auth/AuthFlow';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'signin' | 'signup';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, initialMode = 'signin', onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 md:p-6">
      <div className="relative w-full max-w-6xl bg-[#0B0B0C] border border-[#26262A] rounded-3xl overflow-hidden shadow-2xl">
        <AuthFlow
          initialView={initialMode === 'signin' ? 'login' : 'signup'}
          isModal={true}
          onClose={onClose}
        />
      </div>
    </div>
  );
};
