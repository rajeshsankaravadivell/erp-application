import './globals.css';
import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/components/providers/auth-provider";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'ERP Application',
  description: 'Enterprise Resource Planning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
