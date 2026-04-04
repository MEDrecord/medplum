import { Sidebar } from '@/components/sidebar';
import { UserMenu } from '@/components/user-menu';

// Mock user data - in production this comes from Gateway auth
const mockUser = {
  name: 'Jan-Marc',
  email: 'jan-marc@medrecord.io',
  role: 'Practitioner',
  initials: 'JM',
};

const mockOrganizations = [
  { id: '1', name: "Bedriye's Practice" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar with user menu */}
        <div className="flex h-14 items-center justify-end border-b bg-background px-6">
          <UserMenu 
            user={mockUser} 
            organizations={mockOrganizations}
            currentOrganization="1"
          />
        </div>
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
