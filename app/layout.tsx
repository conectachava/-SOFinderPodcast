import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css'; // Global styles

import { AuthProvider } from './AuthProvider';
import { ToastProvider } from '@/components/Toast';

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ais-dev-6uz52gv5plsbm5qyowpnha-7486352881.us-east1.run.app'),
  title: 'SourceFinder Pod — Plataforma de Investigación AI & Podcasts Multivoz',
  description: 'Plataforma líder en investigación automatizada, verificación de fuentes con Google Search Grounding y producción de podcasts multivoz impulsados por Gemini 2.0 AI.',
  keywords: 'SourceFinder Pod, Podcast IA, Generador de Podcasts, Verificación de Fuentes, Google Search Grounding, Gemini AI, TTS Multivoz',
  authors: [{ name: 'VSNRY LABS' }],
  creator: 'VSNRY LABS',
  publisher: 'SourceFinder Pod',
  applicationName: 'SourceFinder Pod',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'SourceFinder Pod — Plataforma de Investigación AI & Podcasts Multivoz',
    description: 'Investiga fuentes verificadas en tiempo real, redacta guiones periodísticos multivoz y produce podcasts de nivel profesional en minutos.',
    url: '/',
    siteName: 'SourceFinder Pod',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SourceFinder Pod — Plataforma de Investigación AI & Podcasts Multivoz',
    description: 'Investiga fuentes verificadas en tiempo real, redacta guiones periodísticos multivoz y produce podcasts de nivel profesional en minutos.',
  },
};

const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': 'https://ais-dev-6uz52gv5plsbm5qyowpnha-7486352881.us-east1.run.app/#webapp',
      'name': 'SourceFinder Pod',
      'url': 'https://ais-dev-6uz52gv5plsbm5qyowpnha-7486352881.us-east1.run.app',
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
      <body suppressHydrationWarning className="antialiased selection:bg-indigo-500 selection:text-white">
        <script
          id="json-ld-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

