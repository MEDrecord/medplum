import { Header, SearchInput } from '@/components/header';
import { Plus, Star, FileText, MoreVertical } from 'lucide-react';

// Mock data - in production this comes from templates API
const mockTemplates = [
  {
    id: '1',
    name: 'SSib Leefstijl Intake',
    status: 'GEPUBLICEERD',
    isFavorite: true,
    languages: ['EN', 'NL'],
  },
  {
    id: '2',
    name: 'Kort belscript - Team toegang sociaal domein',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor het documenteren van telefonische gesprekken door het Team Toegang Sociaal Domein.',
    tags: ['Sociaal Domein', 'Telefonisch contact', 'Gemeente'],
    languages: ['EN', 'NL'],
  },
  {
    id: '3',
    name: 'Keukentafelgesprek',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor keukentafelgesprekken binnen de Uitvoering Sociaal Domein bij de gemeente.',
    tags: ['Sociaal Domein', 'WMO', 'Gemeente'],
    languages: ['EN', 'NL'],
  },
  {
    id: '4',
    name: 'Embloombespreking',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor het bespreken van Embloom-vragenlijstresultaten.',
    tags: ['Diagnostiek', 'Embloom', 'GGZ'],
    languages: ['EN', 'NL'],
  },
  {
    id: '5',
    name: 'Evaluatieverslag',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor periodieke behandelevaluatie.',
    tags: ['Behandeling', 'Evaluatie', 'GGZ'],
    languages: ['EN', 'NL'],
  },
  {
    id: '6',
    name: 'Heteroanamnese',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor het documenteren van heteroanamnese-interviews met familieleden.',
    tags: ['Intake', 'Anamnese', 'GGZ'],
    languages: ['EN', 'NL'],
  },
  {
    id: '7',
    name: 'Medicatieconsult',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor documentatie van medicatieconsulten.',
    tags: ['Psychiatrie', 'Medicatie', 'Consult'],
    languages: ['EN', 'NL'],
  },
  {
    id: '8',
    name: 'CGT Sessie',
    status: 'GEPUBLICEERD',
    description: 'Gebruik dit sjabloon voor CGT (Cognitieve Gedragstherapie) sessiedocumentatie.',
    tags: ['Behandeling', 'CGT', 'Psychotherapie'],
    languages: ['EN', 'NL'],
  },
];

export default function SjablonenPage() {
  const favorites = mockTemplates.filter(t => t.isFavorite);
  const allTemplates = mockTemplates.filter(t => !t.isFavorite);

  return (
    <div className="flex flex-col">
      <Header 
        title="Sjablonen" 
        subtitle="Beheer uw sjablonen"
        action={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
              Nieuwste eerst
            </button>
            <SearchInput placeholder="Zoek sjabloon..." />
            <button className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Sjabloon maken
            </button>
          </div>
        }
      />
      
      <div className="p-6">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-medium">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              Favorieten
            </h2>
            <div className="space-y-2">
              {favorites.map((template) => (
                <TemplateRow key={template.id} template={template} />
              ))}
            </div>
          </div>
        )}

        {/* All Templates Section */}
        <div>
          <h2 className="mb-4 text-lg font-medium">Alle templates</h2>
          <div className="space-y-2">
            {allTemplates.map((template) => (
              <TemplateRow key={template.id} template={template} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ template }: { template: typeof mockTemplates[0] }) {
  return (
    <div className="flex items-start justify-between rounded-lg bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <button className="mt-1 text-muted-foreground hover:text-yellow-400">
          <Star className={template.isFavorite ? 'h-4 w-4 fill-yellow-400 text-yellow-400' : 'h-4 w-4'} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
          <FileText className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{template.name}</span>
            <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {template.status}
            </span>
            {template.tags?.map((tag) => (
              <span key={tag} className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          {template.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-1">
              {template.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {template.languages.map((lang) => (
          <span 
            key={lang} 
            className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
          >
            {lang}
          </span>
        ))}
        <button className="rounded-md p-1 text-muted-foreground hover:bg-muted">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
