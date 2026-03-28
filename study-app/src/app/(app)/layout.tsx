import { Sidebar, MobileSidebarProvider, MobileHeader } from "@/components/layout/sidebar";
import { JarvisProvider } from "@/components/jarvis/jarvis-provider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto md:ml-60 pt-14 md:pt-0">
          <MobileHeader />
          <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-8 md:py-6">
            {children}
          </div>
        </main>
        <JarvisProvider />
      </div>
    </MobileSidebarProvider>
  );
}
