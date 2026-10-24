import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Job Tracker | HelloPM Buildathon",
  description:
    "Help active job seekers keep application information, latest interactions, and their own next actions together.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF9F5] text-stone-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <AppProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 flex w-full">
              <Sidebar />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
