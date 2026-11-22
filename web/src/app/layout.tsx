import type { Metadata } from "next";
import { IBM_Plex_Sans, Syne } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TaskMaster",
  description: "Track tasks, build streaks, fuel your heat map.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${syne.variable} ${plex.variable} h-full`}>
      <body className="relative z-10 min-h-full font-body text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
