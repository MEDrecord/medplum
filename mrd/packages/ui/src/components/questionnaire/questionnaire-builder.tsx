'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { QuestionInputEditor, QUESTION_TYPE_LABELS } from './question-input';
import { ScoreRangeEditor } from './score-range-editor';
import type { 
  QuestionnaireBuilder as QuestionnaireBuilderState,
  QuestionnaireItemBuilder,
  QuestionType,
  ScoreConfiguration,
} from '@mrd/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface QuestionnaireBuilderProps {
  /** Current questionnaire state */
  questionnaire: QuestionnaireBuilderState;
  /** Update handler */
  onChange: (questionnaire: QuestionnaireBuilderState) => void;
  /** Save handler */
  onSave?: () => void;
  /** Publish handler */
  onPublish?: () => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Whether publish is in progress */
  isPublishing?: boolean;
  /** Validation errors */
  errors?: string[];
  /** Additional class name */
  className?: string;
}

// =============================================================================
// DEFAULT SCORE CONFIG
// =============================================================================

const DEFAULT_SCORE_CONFIG: ScoreConfiguration = {
  enabled: false,
  method: 'sum',
  minScore: 0,
  maxScore: 27,
  ranges: [],
};

// =============================================================================
// QUESTIONNAIRE BUILDER COMPONENT
// =============================================================================

/**
 * QuestionnaireBuilder is the main component for creating/editing questionnaires.
 * It manages the questionnaire metadata, items, and score configuration.
 */
export function QuestionnaireBuilder({
  questionnaire,
  onChange,
  onSave,
  onPublish,
  onCancel,
  isSaving,
  isPublishing,
  errors,
  className,
}: QuestionnaireBuilderProps) {
  const [activeTab, setActiveTab] = React.useState<'details' | 'vragen' | 'score'>('details');

  // Helper to update questionnaire
  const update = (updates: Partial<QuestionnaireBuilderState>) => {
    onChange({ ...questionnaire, ...updates });
  };

  // Helper to update items
  const updateItems = (items: QuestionnaireItemBuilder[]) => {
    update({ items });
  };

  // Add a new question
  const addItem = (type: QuestionType = 'string') => {
    const newItem: QuestionnaireItemBuilder = {
      id: `q_${Date.now()}`,
      type,
      text: '',
      order: questionnaire.items.length,
      validation: { required: false },
      options: ['choice', 'open-choice', 'multi-choice'].includes(type) ? [] : undefined,
    };
    updateItems([...questionnaire.items, newItem]);
  };

  // Update a specific item
  const updateItem = (id: string, updates: Partial<QuestionnaireItemBuilder>) => {
    updateItems(
      questionnaire.items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  // Remove an item
  const removeItem = (id: string) => {
    updateItems(questionnaire.items.filter(item => item.id !== id));
  };

  // Duplicate an item
  const duplicateItem = (id: string) => {
    const item = questionnaire.items.find(i => i.id === id);
    if (!item) return;

    const newItem: QuestionnaireItemBuilder = {
      ...item,
      id: `q_${Date.now()}`,
      text: `${item.text} (kopie)`,
      order: questionnaire.items.length,
    };
    updateItems([...questionnaire.items, newItem]);
  };

  // Move item up
  const moveItemUp = (id: string) => {
    const index = questionnaire.items.findIndex(i => i.id === id);
    if (index <= 0) return;

    const newItems = [...questionnaire.items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    newItems.forEach((item, i) => { item.order = i; });
    updateItems(newItems);
  };

  // Move item down
  const moveItemDown = (id: string) => {
    const index = questionnaire.items.findIndex(i => i.id === id);
    if (index < 0 || index >= questionnaire.items.length - 1) return;

    const newItems = [...questionnaire.items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    newItems.forEach((item, i) => { item.order = i; });
    updateItems(newItems);
  };

  const hasScoring = questionnaire.scoreConfig?.enabled;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <input
              type="text"
              value={questionnaire.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="Vragenlijst titel..."
              className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0"
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={questionnaire.status} />
              {questionnaire.version && <span>v{questionnaire.version}</span>}
              <span>{questionnaire.items.length} vragen</span>
              {hasScoring && <span>Met score</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className={cn(
              'rounded-lg border border-border px-4 py-2 text-sm font-medium',
              'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isSaving ? 'Opslaan...' : 'Opslaan als concept'}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPublishing || questionnaire.status === 'active'}
            className={cn(
              'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
              'hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            {isPublishing ? 'Publiceren...' : 'Publiceren'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border px-6">
        <TabButton
          active={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          Details
        </TabButton>
        <TabButton
          active={activeTab === 'vragen'}
          onClick={() => setActiveTab('vragen')}
        >
          Vragen ({questionnaire.items.length})
        </TabButton>
        <TabButton
          active={activeTab === 'score'}
          onClick={() => setActiveTab('score')}
        >
          Score
          {hasScoring && (
            <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              Aan
            </span>
          )}
        </TabButton>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {/* Errors */}
        {errors && errors.length > 0 && (
          <div className="mx-6 mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="mb-1 font-medium text-destructive">Validatiefouten:</p>
            <ul className="list-inside list-disc text-sm text-destructive">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'details' && (
          <DetailsTab questionnaire={questionnaire} onChange={update} />
        )}

        {activeTab === 'vragen' && (
          <QuestionsTab
            items={questionnaire.items}
            scoringEnabled={hasScoring}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onDuplicateItem={duplicateItem}
            onMoveItemUp={moveItemUp}
            onMoveItemDown={moveItemDown}
          />
        )}

        {activeTab === 'score' && (
          <ScoreTab
            config={questionnaire.scoreConfig || DEFAULT_SCORE_CONFIG}
            onChange={(scoreConfig) => update({ scoreConfig })}
          />
        )}
      </div>
    </div>
  );
}

// =============================================================================
// TAB BUTTON
// =============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

// =============================================================================
// STATUS BADGE
// =============================================================================

interface StatusBadgeProps {
  status: 'draft' | 'active' | 'retired' | 'unknown';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    draft: { label: 'Concept', className: 'bg-muted text-muted-foreground' },
    active: { label: 'Gepubliceerd', className: 'bg-green-100 text-green-700' },
    retired: { label: 'Ingetrokken', className: 'bg-red-100 text-red-700' },
    unknown: { label: 'Onbekend', className: 'bg-muted text-muted-foreground' },
  };

  const { label, className } = config[status];

  return (
    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', className)}>
      {label}
    </span>
  );
}

// =============================================================================
// DETAILS TAB
// =============================================================================

interface DetailsTabProps {
  questionnaire: QuestionnaireBuilderState;
  onChange: (updates: Partial<QuestionnaireBuilderState>) => void;
}

function DetailsTab({ questionnaire, onChange }: DetailsTabProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Name & Title */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Interne naam</label>
          <input
            type="text"
            value={questionnaire.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="phq-9-nl"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Voor intern gebruik, niet zichtbaar voor clienten
          </p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Titel</label>
          <input
            type="text"
            value={questionnaire.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="PHQ-9 Depressie Vragenlijst"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Zichtbaar voor clienten
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Beschrijving</label>
        <textarea
          value={questionnaire.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Beschrijving van de vragenlijst..."
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
      </div>

      {/* LOINC Code */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">LOINC code (optioneel)</label>
        <input
          type="text"
          value={questionnaire.loincCode || ''}
          onChange={(e) => onChange({ loincCode: e.target.value })}
          placeholder="bijv. 44249-1 voor PHQ-9"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          LOINC code voor interoperabiliteit
        </p>
      </div>

      {/* Languages */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Talen</label>
        <div className="flex flex-wrap gap-2">
          {['nl', 'en', 'de', 'fr'].map((lang) => {
            const isSelected = questionnaire.languages.includes(lang);
            const isPrimary = questionnaire.primaryLanguage === lang;

            return (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    if (isPrimary) return; // Can't remove primary
                    onChange({ languages: questionnaire.languages.filter(l => l !== lang) });
                  } else {
                    onChange({ languages: [...questionnaire.languages, lang] });
                  }
                }}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {lang.toUpperCase()}
                {isPrimary && <span className="ml-1 text-xs">(primair)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Tags</label>
        <TagInput
          tags={questionnaire.tags || []}
          onChange={(tags) => onChange({ tags })}
        />
      </div>
    </div>
  );
}

// =============================================================================
// TAG INPUT
// =============================================================================

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = React.useState('');

  const addTag = () => {
    const tag = input.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInput('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-background p-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-sm text-primary"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-0.5 rounded-full p-0.5 hover:bg-primary/20"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder="Tag toevoegen..."
        className="flex-1 min-w-32 border-none bg-transparent text-sm outline-none"
      />
    </div>
  );
}

// =============================================================================
// QUESTIONS TAB
// =============================================================================

interface QuestionsTabProps {
  items: QuestionnaireItemBuilder[];
  scoringEnabled?: boolean;
  onAddItem: (type: QuestionType) => void;
  onUpdateItem: (id: string, updates: Partial<QuestionnaireItemBuilder>) => void;
  onRemoveItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onMoveItemUp: (id: string) => void;
  onMoveItemDown: (id: string) => void;
}

function QuestionsTab({
  items,
  scoringEnabled,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  onDuplicateItem,
  onMoveItemUp,
  onMoveItemDown,
}: QuestionsTabProps) {
  const [showTypeSelector, setShowTypeSelector] = React.useState(false);

  // Sort items by order
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <div className="p-6 space-y-4">
      {/* Items */}
      {sortedItems.map((item, index) => (
        <QuestionInputEditor
          key={item.id}
          item={item}
          onUpdate={(updates) => onUpdateItem(item.id, updates)}
          onDelete={() => onRemoveItem(item.id)}
          onDuplicate={() => onDuplicateItem(item.id)}
          onMoveUp={() => onMoveItemUp(item.id)}
          onMoveDown={() => onMoveItemDown(item.id)}
          isFirst={index === 0}
          isLast={index === sortedItems.length - 1}
          scoringEnabled={scoringEnabled}
        />
      ))}

      {/* Empty State */}
      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground/50"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 font-medium">Geen vragen</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Voeg vragen toe om je vragenlijst op te bouwen
          </p>
        </div>
      )}

      {/* Add Question Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowTypeSelector(!showTypeSelector)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-3',
            'text-sm font-medium text-muted-foreground transition-colors',
            'hover:border-primary hover:text-primary'
          )}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vraag toevoegen
        </button>

        {/* Type Selector Dropdown */}
        {showTypeSelector && (
          <div className="absolute left-0 right-0 top-full z-10 mt-2 rounded-lg border border-border bg-popover p-2 shadow-lg">
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    onAddItem(type as QuestionType);
                    setShowTypeSelector(false);
                  }}
                  className="rounded-lg px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SCORE TAB
// =============================================================================

interface ScoreTabProps {
  config: ScoreConfiguration;
  onChange: (config: ScoreConfiguration) => void;
}

function ScoreTab({ config, onChange }: ScoreTabProps) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <ScoreRangeEditor config={config} onChange={onChange} />
    </div>
  );
}
