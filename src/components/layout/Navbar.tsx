"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Menu,
  X,
  AlertCircle,
  RotateCcw,
  PlusCircle,
  Briefcase,
  CheckSquare,
  Database,
  ExternalLink,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { isPreviewMode, isConfigured, user, resetPreviewData, setPreviewMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Needs attention", icon: CheckSquare },
    { href: "/applications", label: "Applications", icon: Briefcase },
    { href: "/applications/new", label: "Add application", icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-stone-200">
      {/* Sample Preview Banner */}
      {isPreviewMode && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded font-semibold text-[10px] bg-amber-200 text-amber-900 uppercase tracking-wide">
              Sample Preview
            </span>
            <span className="font-medium">
              Sample workspace — nothing entered here is saved to your account.
            </span>
            <span className="text-amber-700 hidden sm:inline">
              Sign in or return to your applications to save your own records.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (confirm("Reset sample preview data back to initial fictional applications?")) {
                  resetPreviewData();
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-amber-800 hover:text-amber-950 font-medium underline underline-offset-2"
              title="Reset sample data back to default fictional records"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset sample data
            </button>
            {user ? (
              <button onClick={() => { setPreviewMode(false); window.location.assign("/applications"); }} className="text-xs bg-amber-200 px-2 py-1 rounded font-medium">Back to my applications</button>
            ) : (
              <Link href="/auth" className="text-xs bg-amber-200 px-2 py-1 rounded font-medium">{isConfigured ? "Sign in to save your applications" : "Supabase setup"}</Link>
            )}
          </div>
        </div>
      )}

      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
            JT
          </span>
          <span className="tracking-tight text-base">Job Tracker</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 px-4 pt-2 pb-4 space-y-1 bg-surface">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-stone-200">
            <Link
              href="/auth"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            >
              <Database className="w-4 h-4" />
              {user ? `Account (${user.email})` : "Authentication & Setup"}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
