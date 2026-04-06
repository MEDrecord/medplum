"use client";

import { useState } from "react";
import { Header, SearchInput } from "@/components/header";
import { Plus, Calendar, Trash2, X, MessageCircle } from "lucide-react";
import { cn } from "@mrd/ui/lib/utils";

// Mock data - in production this comes from FHIR Patient resources
const initialClients = [
  {
    id: "1",
    name: "Wiebe",
    pronouns: "Zij/Haar",
    birthDate: "1 jan 1970",
    initials: "W",
  },
];

interface NewClientFormData {
  name: string;
  pronouns: string;
  birthDate: string;
  phone: string;
  email: string;
}

function NewClientModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewClientFormData) => void;
}) {
  const [formData, setFormData] = useState<NewClientFormData>({
    name: "",
    pronouns: "",
    birthDate: "",
    phone: "",
    email: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-background p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Nieuwe Client Toevoegen</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Naam of ID */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Naam of ID <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Client name or ID"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Voornaamwoord */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Voornaamwoord
            </label>
            <select
              value={formData.pronouns}
              onChange={(e) =>
                setFormData({ ...formData, pronouns: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecteer voornaamwoord</option>
              <option value="Hij/Hem">Hij/Hem</option>
              <option value="Zij/Haar">Zij/Haar</option>
              <option value="Hen/Hun">Hen/Hun</option>
            </select>
          </div>

          {/* Geboortedatum */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Geboortedatum
            </label>
            <input
              type="date"
              placeholder="dd-mm-jjjj"
              value={formData.birthDate}
              onChange={(e) =>
                setFormData({ ...formData, birthDate: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Telefoon */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Telefoon</label>
            <div className="relative">
              <input
                type="tel"
                placeholder="+31 6 12 34 56 78"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-destructive hover:bg-destructive/10"
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm font-medium mb-1.5">E-mail</label>
            <input
              type="email"
              placeholder="patient@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Annuleren
            </button>
            <button
              type="submit"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Opslaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClientenPage() {
  const [clients, setClients] = useState(initialClients);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddClient = (data: NewClientFormData) => {
    const newClient = {
      id: String(clients.length + 1),
      name: data.name,
      pronouns: data.pronouns || "Niet opgegeven",
      birthDate: data.birthDate
        ? new Date(data.birthDate).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Niet opgegeven",
      initials: data.name.charAt(0).toUpperCase(),
    };
    setClients([...clients, newClient]);
  };

  const handleDeleteClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id));
  };

  return (
    <div className="flex flex-col">
      <Header
        title="Clienten"
        subtitle="Beheer uw clienten"
        action={
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
              Op Naam
            </button>
            <SearchInput placeholder="Zoek client..." />
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Client toevoegen
            </button>
          </div>
        }
      />

      <div className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          {clients.length} clienten
        </p>

        <div className="space-y-2">
          {clients.map((client) => (
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
                    <span className="text-sm text-primary">
                      {client.pronouns}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {client.birthDate}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDeleteClient(client.id)}
                className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <NewClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddClient}
      />
    </div>
  );
}
