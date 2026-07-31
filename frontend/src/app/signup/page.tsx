'use client';

import React from 'react';
import { AuthFlow } from '../../components/auth/AuthFlow';

export default function SignupPage() {
  return <AuthFlow initialView="signup" />;
}
