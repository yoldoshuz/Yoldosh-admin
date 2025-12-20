import { AuthGuard } from "@/components/pages/auth/AuthGuard";
import { AdminSidebar } from "@/components/shared/layout/AdminSidebar";
import { Navbar } from "@/components/shared/layout/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard requiredRole="Admin">
      <SidebarProvider>
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
