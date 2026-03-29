"use client";

import { Sidebar, MobileSidebarProvider, MobileHeader, useSidebarCollapsed } from "@/components/layout/sidebar";
import { HexxonAiProvider } from "@/components/hexxon-ai/hexxon-ai-provider";
import { cn } from "@/lib/utils";

function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebarCollapsed();

  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto pt-14 transition-[margin-left] duration-300 ease-in-out md:pt-0",
        collapsed ? "md:ml-16" : "md:ml-60"
      )}
    >
      <MobileHeader />
      <div className="mx-auto max-w-[1600px] px-4 py-4 md:px-6 md:py-6">
        {children}
      </div>
    </main>
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <MainContent>{children}</MainContent>
        <HexxonAiProvider />
      </div>
    </MobileSidebarProvider>
  );
}
