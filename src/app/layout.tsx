import './globals.css';

export const metadata = {
  title: 'SUBSTACKULOUS - Grow Your Substack Revenue',
  description: '100x Your Substack Revenue in 90 Days',
};

import ClientLayout from './ClientLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
