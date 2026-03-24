"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { BottomNav } from "@/components/bottom-nav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <div className="ambient-wrap">
        <div className="ambient ambient-top" />
        <div className="ambient ambient-bottom" />
      </div>
      <main className="screen-shell">{children}</main>
      <BottomNav pathname={pathname} />
    </div>
  );
}

