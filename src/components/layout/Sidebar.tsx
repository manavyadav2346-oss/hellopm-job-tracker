"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { DataService } from "@/lib/data-service";
import {
  CheckSquare,
  Briefcase,
  PlusCircle,
  Database,
  Info,
  LogOut,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { isPreviewMode, user, signOut, isConfigured, setPreviewMode } = useApp();
  const [counts, setCounts] = useState<{ attention: number; applications: number }>({
    attention: 0,
    applications: 0,
  });

  const loadCounts = async () => {
    try {
      const [apps, actions] = await Promise.all([
        DataService.getApplications(),
        DataService.getDueAndUpcomingActions(),
      ]);
      setCounts({
        attention: actions.dueAndOverdue.length,
        applications: apps.length,
      });
    } catch {
      // In non-blocking count fetch, swallow errors
    }
  };

  useEffect(() => {
    loadCounts();

    const handleUpdate = () => loadCounts();
    window.addEventListener("preview-mode-changed", handleUpdate);
    window.addEventListener("preview-data-reset", handleUpdate);

    return () => {
      window.removeEventListener("preview-mode-changed", handleUpdate);
      window.removeEventListener("preview-data-reset", handleUpdate);
    };
  }, [isPreviewMode, pathname, user?.id]);

  const navItems = [
    {
      href: "/",
      label: "Needs attention",
      icon: CheckSquare,
      badge: counts.attention > 0 ? counts.attention : undefined,
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      href: "/applications",
      label: "Applications",
      icon: Briefcase,
      badge: counts.applications > 0 ? counts.applications : undefined,
      badgeColor: "bg-stone-200 text-stone-700",
    },
  ];

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-stone-200 bg-white min-h-screen p-4 justify-between flex-shrink-0">
      <div className="space-y-6">
        {/* App Title & Identity */}
        <div>
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
              JT
            </span>
            <div>
              <h1 className="font-semibold text-stone-900 tracking-tight leading-none text-base">
                Job Tracker
              </h1>
              <span className="text-[11px] text-stone-500 font-medium">
                HelloPM Buildathon MVP
              </span>
            </div>
          </Link>
        </div>

        {/* Primary Action Button */}
        <div>
          <Link
            href="/applications/new"
            className="flex items-center justify-center gap-2 w-full px-3.5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-sm transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add application</span>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-stone-100 text-stone-900 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-indigo-600" : "text-stone-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Calm UX Research Context Box */}
        <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 space-y-1.5 leading-relaxed">
          <div className="flex items-center gap-1.5 font-medium text-stone-800">
            <Info className="w-3.5 h-3.5 text-stone-500" />
            <span>A helpful reminder</span>
          </div>
          <p>
            No reply does not mean rejection. Record updates when you receive them.
          </p>
        </div>
      </div>

      {/* Account / Preview Status Footer */}
      <div className="pt-4 border-t border-stone-200 space-y-2">
        {isPreviewMode ? (
          <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Sample Preview Mode</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-1 leading-normal">
              Fictional data. Isolated from real accounts. Changes not saved.
            </p>
            <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between">
              <Link
                href="/auth"
                className="text-[11px] font-semibold text-indigo-700 hover:underline flex items-center gap-1"
              >
                <Database className="w-3 h-3" />
                {isConfigured ? "Log in" : "Configure DB"}
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-stone-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{user ? "Signed in" : "Not signed in"}</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1 truncate" title={user?.email || ""}>
              {user?.email || "Sign in to save your applications"}
            </p>
            <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between">
              <button
                onClick={() => setPreviewMode(true)}
                className="text-[11px] text-stone-600 hover:text-stone-900 hover:underline"
              >
                Explore preview
              </button>
              <button
                onClick={() => { if (user) void signOut(); else window.location.assign("/auth"); }}
                className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:underline font-medium"
              >
                <LogOut className="w-3 h-3" />
                {user ? "Sign out" : "Sign in"}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
