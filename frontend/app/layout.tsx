import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import Sidebar from "@/components/ui/Sidebar";
import { AuthProvider } from "@/components/providers/AuthContext";

export const metadata: Metadata = {
  title: "FAHIN — Health Intelligence Network",
  description: "Federated Agentic Health Intelligence Network",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
        {/* Soft gradient blobs in background */}
        <div className="blob-bg">
          <div className="blob w-96 h-96 bg-amber-300 top-[-10%] left-[-5%]" style={{animationDelay:"0s"}} />
          <div className="blob w-80 h-80 bg-orange-200 top-[30%] right-[-8%]" style={{animationDelay:"4s"}} />
          <div className="blob w-72 h-72 bg-blue-200 bottom-[-5%] left-[20%]" style={{animationDelay:"8s"}} />
        </div>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 ml-64 p-8 min-h-screen">{children}</main>
        </div>
        </AuthProvider>
      </body>
    </html>
  );
}
