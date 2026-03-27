import { Sidebar } from "@/components/layout/sidebar";
import { JarvisProvider } from "@/components/jarvis/jarvis-provider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="ml-60 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1280px] px-8 py-6">
          {children}
        </div>
      </main>
      <JarvisProvider />
    </div>
  );
}
