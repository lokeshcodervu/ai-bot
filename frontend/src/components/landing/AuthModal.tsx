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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#060607]">
      <AuthFlow
        initialView={initialMode === 'signin' ? 'login' : 'signup'}
        isModal={true}
        onClose={onClose}
      />
    </div>
  );
};
