import React from 'react';
import type {Metadata} from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from './AuthProvider';
import { ToastProvider } from '@/components/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://ais-dev-6uz52gv5plsbm5qyowpnha-7486352881.us-east1.run.app'),
  title: 'SourceFinder Pod | AI-Powered Verified Podcast Orchestrator',
  description: 'Investigate facts, verify sources, generate multi-speaker scripts, and produce studio-grade podcasts powered by Gemini AI.',
  openGraph: {
    title: 'SourceFinder Pod | AI-Powered Verified Podcast Orchestrator',
    description: 'Investigate facts, verify sources, generate multi-speaker scripts, and produce studio-grade podcasts powered by Gemini AI.',
    url: './',
    siteName: 'SourceFinder Pod',
    type: 'website',
    images: [{ url: '/icon.png', width: 800, height: 600, alt: 'SourceFinder Pod Preview' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SourceFinder Pod | AI-Powered Verified Podcast Orchestrator',
    description: 'Investigate facts, verify sources, generate multi-speaker scripts, and produce studio-grade podcasts powered by Gemini AI.',
    images: ['/icon.png'],
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
