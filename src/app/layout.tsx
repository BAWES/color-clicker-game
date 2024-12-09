import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Get the URL from Vercel environment variables in production, fallback to localhost in development
const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Blob",
  description: "A mesmerizing blob clicking game",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Blob",
    description: "A mesmerizing blob clicking game",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blob",
    description: "A mesmerizing blob clicking game",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
