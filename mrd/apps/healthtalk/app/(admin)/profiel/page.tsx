import { Header } from '@/components/header';
import { User, Mail, Building2, Shield } from 'lucide-react';

// Mock data - in production this comes from Gateway auth
const mockUser = {
  name: 'Jan-Marc',
  email: 'jan-marc@medrecord.io',
  role: 'Practitioner',
  initials: 'JM',
  organization: "Bedriye's Practice",
};

export default function ProfielPage() {
  return (
    <div className="flex flex-col">
      <Header 
        title="Profiel" 
        subtitle="Beheer uw account instellingen"
      />
      
      <div className="p-6">
        <div className="mx-auto max-w-2xl">
          {/* Profile Card */}
          <div className="rounded-lg bg-card p-6 shadow-sm">
            <div className="flex items-center gap-6 border-b pb-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-medium text-primary-foreground">
                {mockUser.initials}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{mockUser.name}</h2>
                <span className="inline-block mt-1 rounded bg-primary/10 px-2 py-0.5 text-sm text-primary">
                  {mockUser.role}
                </span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{mockUser.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Organisatie</p>
                  <p className="font-medium">{mockUser.organization}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Rol</p>
                  <p className="font-medium">{mockUser.role}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3 border-t pt-6">
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Profiel bewerken
              </button>
              <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
                Wachtwoord wijzigen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
