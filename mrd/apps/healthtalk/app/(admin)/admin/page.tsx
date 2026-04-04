import { Header, SearchInput } from '@/components/header';
import { Plus, Building2, ChevronRight, Trash2 } from 'lucide-react';

// Mock data - in production this comes from FHIR Organization resources
const mockOrganizations = [
  { id: '1', name: "Alex's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '2', name: 'ARQ', type: 'Alleen Eigen Cliënten' },
  { id: '3', name: "Bedriye's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '4', name: "Dennis's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '5', name: "Dessa's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '6', name: "Dr's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '7', name: "Dylan's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '8', name: "Erkam's Practice", type: 'Alleen Eigen Cliënten' },
  { id: '9', name: 'GGNet', type: 'Alleen Eigen Cliënten' },
];

export default function AdminPage() {
  return (
    <div className="flex flex-col">
      <Header 
        title="Beheerpaneel" 
        subtitle="Beheer alle organisaties in het systeem"
        action={
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Zoek organisatie..." />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Organisatie Aanmaken
            </button>
          </div>
        }
      />
      
      <div className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {mockOrganizations.length} organisaties
        </p>
        
        <div className="space-y-2">
          {mockOrganizations.map((org) => (
            <div
              key={org.id}
              className="flex items-center justify-between rounded-lg bg-card p-4 shadow-sm hover:bg-muted/50 cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="font-medium">{org.name}</span>
                  <p className="text-sm text-primary">{org.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                <button className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
