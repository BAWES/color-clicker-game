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

// Get the deployment URL for OpenGraph
const baseUrl = process.env.VERCEL_ENV === 'production'
  ? 'https://color-clicker-game.vercel.app'
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';

export const metadata: Metadata = {
  title: "Blob",
  description: "A mesmerizing blob clicking game",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Blob",
    description: "A mesmerizing blob clicking game",
    type: "website",
    siteName: "Blob Game",
    locale: 'en_US',
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Blob - A mesmerizing clicking game',
      type: 'image/png',
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blob",
    description: "A mesmerizing blob clicking game",
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Blob - A mesmerizing clicking game',
      type: 'image/png',
    }],
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
