export const metadata = {
  title: 'La Chispa Gamer 1.8',
  description: 'Salón gamer en Berazategui — experiencias, PoolFútbol, cumpleaños y más.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0E0F14' }}>{children}</body>
    </html>
  );
}
