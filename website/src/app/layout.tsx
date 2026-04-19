import type { Metadata } from "next";
import { Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "FAHIN | Admin Health Portal",
  description: "Automated Health Identification Network - Administrative Command Center",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
      <body className="font-body bg-bg text-ink min-h-screen overflow-x-hidden">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-72 p-10 min-h-screen">
            <div className="max-w-7xl mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
