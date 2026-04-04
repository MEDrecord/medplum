import { Header, SearchInput } from '@/components/header';
import { Plus, Mic } from 'lucide-react';

export default function GesprekkenPage() {
  return (
    <div className="flex flex-col">
      <Header 
        title="Gesprekken" 
        subtitle="Beheer uw opgenomen gesprekken"
        action={
          <div className="flex items-center gap-3">
            <SearchInput placeholder="Zoek gesprek..." />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Nieuw gesprek
            </button>
          </div>
        }
      />
      
      <div className="p-6">
        {/* Empty state */}
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/20 py-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mic className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-medium">Geen gesprekken</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Start een nieuw gesprek om te beginnen met opnemen
          </p>
          <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Nieuw gesprek starten
          </button>
        </div>
      </div>
    </div>
  );
}
