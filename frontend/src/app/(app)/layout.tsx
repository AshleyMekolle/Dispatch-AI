import { Sidebar } from "@/components/app/sidebar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <Sidebar />
      <main className="quiet-scroll flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
