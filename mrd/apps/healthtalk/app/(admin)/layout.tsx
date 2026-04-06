import { Sidebar } from '@/components/sidebar';
import { UserMenu } from '@/components/user-menu';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with user menu - uses auth context automatically */}
        <div className="flex h-14 items-center justify-end border-b bg-background px-6">
          <UserMenu />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
