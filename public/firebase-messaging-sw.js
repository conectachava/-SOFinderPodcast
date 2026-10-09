// Firebase Cloud Messaging Service Worker for SourceFinder Pod
// Background Push Notification Handler

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "google-mpf-fbe01rgpl0il",
  appId: "1:1036405011052:web:a05ca9cb017ebdd782de49",
  apiKey: "AIzaSyCTaKAoL9d1atFkARkj_JjZcpfzvd_Vzdc",
  authDomain: "mpf-fbe01rgpl0il.firebaseapp.com",
  messagingSenderId: "1036405011052",
  storageBucket: "google-mpf-fbe01rgpl0il.firebasestorage.app"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background Push Event Handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message:', payload);

    const title = payload.notification?.title || payload.data?.title || '🎙️ SourceFinder Pod';
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      'Actualización en el estado de renderizado de tu podcast.';
    const podcastId = payload.data?.podcastId || '';
    const status = payload.data?.status || 'completed';

    const options = {
      body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `podcast-render-${podcastId || Date.now()}`,
      renotify: true,
      requireInteraction: status === 'completed',
      data: {
        url: podcastId ? `/podcast/${podcastId}` : '/',
        podcastId,
        status,
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open-studio',
          title: 'Abrir Estudio',
        },
        {
          action: 'dismiss',
          title: 'Cerrar',
        },
      ],
    };

    return self.registration.showNotification(title, options);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Firebase Messaging initialization notice:', err);
}

// Notification interaction click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            if ('navigate' in client) {
              client.navigate(targetUrl);
            }
            return;
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
