import React from 'react';
// Cache bust: 2026-08-21T16:31:00-07:00
import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from './AuthProvider';
import { ToastProvider } from '@/components/Toast';
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler';
import { SystemStatusProvider, SystemStatusBanner } from '@/components/SystemStatusBanner';
import { DevHealthConsole } from '@/components/DevHealthConsole';
import { DynamicSeoHead } from '@/components/DynamicSeoHead';
import { ThemeDebugger } from '@/components/ThemeDebugger';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ia.conectachava.com'),
  title: 'SourceFinder Pod',
  description: 'Automated Intelligence Gathering & Multi-Voice Podcast Generation Platform powered by Gemini AI.',
  keywords: 'SourceFinder Pod, Podcast AI, Generador de Podcasts, Verificación de Fuentes, Google Search Grounding, Gemini AI, TTS Multivoz',
  authors: [{ name: 'VSNRY LABS' }],
  creator: 'VSNRY LABS',
  publisher: 'SourceFinder Pod',
  applicationName: 'SourceFinder Pod',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'SourceFinder Pod',
    description: 'Automated Intelligence Gathering & Multi-Voice Podcast Generation Platform powered by Gemini AI.',
    url: '/',
    siteName: 'SourceFinder Pod',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SourceFinder Pod',
    description: 'Automated Intelligence Gathering & Multi-Voice Podcast Generation Platform powered by Gemini AI.',
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://ia.conectachava.com/#webapp',
      'name': 'SourceFinder Pod',
      'url': 'https://ia.conectachava.com',
      'description': 'Plataforma de inteligencia automatizada, fact-checking periodístico y producción de podcasts multivoz con síntesis de audio HD impulsada por Google Gemini AI.',
      'applicationCategory': 'MultimediaApplication',
      'operatingSystem': 'All',
      'browserRequirements': 'Requires JavaScript. Requires HTML5.',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': '4.95',
        'ratingCount': '1420',
      },
      'author': {
        '@type': 'Organization',
        'name': 'VSNRY LABS',
        'url': 'https://vsnrylabs.com',
      },
    },
    {
      '@type': 'FAQPage',
      'mainEntity': [
        {
          '@type': 'Question',
          'name': '¿Cómo funciona SourceFinder Pod para verificar fuentes?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'SourceFinder utiliza la tecnología Google Search Grounding de Gemini 2.0 para auditar noticias y consultar múltiples fuentes web activas, asignando un Score de Credibilidad con enlaces citables.',
          },
        },
        {
          '@type': 'Question',
          'name': '¿Qué formatos de podcast puedo crear?',
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': 'Puedes generar diálogos multivoz bajo formatos de Debate de Opiniones, Análisis Técnico Profundo o Resumen Noticioso con moderadores y analistas virtuales.',
          },
        },
      ],
    },
  ],
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body suppressHydrationWarning className="antialiased selection:bg-indigo-500 selection:text-white bg-white dark:bg-slate-950">
        <ThemeDebugger />
        <DynamicSeoHead />
        <script
          id="json-ld-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <AuthProvider>
          <SystemStatusProvider>
            <GlobalErrorHandler />
            <ToastProvider>
              <SystemStatusBanner />
              {children}
              <DevHealthConsole />
            </ToastProvider>
          </SystemStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

