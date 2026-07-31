import React from 'react';
import type {Metadata} from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from './AuthProvider';

export const metadata: Metadata = {
  title: 'SourceFinder Pod | AI-Powered Verified Podcast Orchestrator',
  description: 'Investigate facts, verify sources, generate multi-speaker scripts, and produce studio-grade podcasts powered by Gemini AI.',
  openGraph: {
    title: 'SourceFinder Pod | AI-Powered Verified Podcast Orchestrator',
    description: 'Investigate facts, verify sources, generate multi-speaker scripts, and produce studio-grade podcasts powered by Gemini AI.',
    type: 'website',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
