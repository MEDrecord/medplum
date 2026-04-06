"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Copy,
  User,
  Clock,
  Layers,
} from "lucide-react";
import { cn } from "@mrd/ui/lib/utils";

// Mock data - in production this comes from Gateway via useTemplateById hook
const mockTemplate = {
  id: "1",
  title: "SSib Leefstijl Intake",
  status: "published",
  visibility: "public",
  isFavorite: true,
  createdBy: "een andere gebruiker",
  updatedAt: "5 februari 2026",
  sectionCount: 31,
  sections: [
    {
      id: "1",
      number: 1,
      title: "Invuldatum",
      type: "free_text",
      aiGuidelines:
        'Noteer de datum waarop het intakegesprek heeft plaatsgevonden. Indien niet expliciet vermeld, schrijf "Niet besproken".',
    },
    {
      id: "2",
      number: 2,
      title: "Gebruik van afvalmedicatie",
      type: "free_text",
      aiGuidelines:
        'Beschrijf of de deelnemer afvalmedicatie gebruikt (bijv. Saxenda, Mysimba, Xenical, Ozempic of Wegovy), inclusief dosering, duur van gebruik en eventuele gemelde effecten of bijwerkingen. Indien niet besproken, schrijf "Niet besproken".',
    },
    {
      id: "3",
      number: 3,
      title: "Lopende leefstijlbehandeling",
      type: "free_text",
      aiGuidelines:
        'Beschrijf eventuele lopende leefstijlbehandelingen die de deelnemer momenteel volgt, inclusief interventies op het gebied van voeding, beweging, slaap, ontspanning of stressmanagement. Vermeld details over frequentie, behandelaar en ervaren effectiviteit. Indien niet besproken, schrijf "Niet besproken".',
    },
    {
      id: "4",
      number: 4,
      title: "Leefstijldoel van de deelnemer",
      type: "free_text",
      aiGuidelines:
        'Noteer het specifieke leefstijldoel dat de deelnemer zichzelf heeft gesteld. Wees concreet en vermeld meetbare doelen indien genoemd (bijv. gewichtsverlies, betere conditie, verbeterde slaap). Indien niet besproken, schrijf "Niet besproken".',
    },
    {
      id: "5",
      number: 5,
      title: "Belang van het doel",
      type: "free_text",
      aiGuidelines:
        'Beschrijf waarom dit leefstijldoel belangrijk is voor de deelnemer. Vermeld persoonlijke motivaties, onderliggende waarden of levensomstandigheden die dit doel motiveren. Indien niet besproken, schrijf "Niet besproken".',
    },
  ],
  aiGuidelines: {
    general:
      "Dit sjabloon is bedoeld voor leefstijlintakes. Focus op concrete, meetbare informatie.",
    naming:
      'Verwijs naar de client als "deelnemer" (neutraal) of gebruik "hij/zij" op basis van voornaamwoord.',
  },
};

function StatusBadge({ status }: { status: string }) {
  if (status === "published") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Gepubliceerd
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
      Concept
    </span>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  return (
    <span className="inline-flex items-center text-sm text-muted-foreground">
      {visibility === "public" ? "Openbaar" : "Prive"}
    </span>
  );
}

export default function TemplateDetailPage() {
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"sections" | "ai">("sections");
  const [isFavorite, setIsFavorite] = useState(mockTemplate.isFavorite);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/sjablonen"
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-foreground">
                {mockTemplate.title}
              </h1>
              <StatusBadge status={mockTemplate.status} />
              <VisibilityBadge visibility={mockTemplate.visibility} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  isFavorite && "fill-yellow-400 text-yellow-400"
                )}
              />
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
              <Copy className="h-4 w-4" />
              Dupliceren
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="mt-3 flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Gemaakt door {mockTemplate.createdBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Bijgewerkt {mockTemplate.updatedAt}</span>
          </div>
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>{mockTemplate.sectionCount} secties</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b bg-background px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("sections")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "sections"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Secties ({mockTemplate.sectionCount})
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors",
              activeTab === "ai"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            AI-richtlijnen
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === "sections" ? (
          <div className="space-y-4">
            {mockTemplate.sections.map((section) => (
              <div
                key={section.id}
                className="rounded-lg border bg-card p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">
                      {section.number}. {section.title}
                    </h3>
                    <p className="mt-1 text-xs text-primary">AI-richtlijnen</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {section.aiGuidelines}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Vrije tekst
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium text-foreground">
                Algemene richtlijnen
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {mockTemplate.aiGuidelines.general}
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <h3 className="font-medium text-foreground">Naamgeving</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {mockTemplate.aiGuidelines.naming}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
