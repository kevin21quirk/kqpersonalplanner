import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "KQ Personal Planner | AI Bridge Solutions",
  description: "AI-powered personal planner for Kevin — manage tasks, calendar, meetings, and more with natural language.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-full overflow-hidden bg-[#0d0f14] text-slate-200 antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e2535",
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#0d0f14" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#0d0f14" } },
          }}
        />
      </body>
    </html>
  );
}
