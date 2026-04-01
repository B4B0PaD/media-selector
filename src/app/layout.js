import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Media Selector Torneo",
  description: "Organizza le tue risorse e scegli le migliori in stile torneo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Script src="https://apis.google.com/js/api.js" strategy="beforeInteractive" />
        <Script src="https://accounts.google.com/gsi/client" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
