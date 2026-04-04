import { Header, SearchInput } from '@/components/header';
import { Plus, Calendar, Trash2 } from 'lucide-react';

// Mock data - in production this comes from FHIR Patient resources
const mockClients = [
  {
    id: '1',
    name: 'Wiebe',
    pronouns: 'Zij/Haar',
    birthDate: '1 jan 1970',
    initials: 'W',
  },
];

export default function ClientenPage() {
  return (
    <div className="flex flex-col">
      <Header 
        title="Cliënten" 
        subtitle="Beheer uw cliënten"
        action={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
              Op Naam
            </button>
            <SearchInput placeholder="Zoek cliënt..." />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Cliënt toevoegen
            </button>
          </div>
        }
      />
      
      <div className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {mockClients.length} cliënten
        </p>
        
        <div className="space-y-2">
          {mockClients.map((client) => (
            <div
              key={client.id}
              className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                  {client.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-sm text-primary">{client.pronouns}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {client.birthDate}
                  </div>
                </div>
              </div>
              <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
