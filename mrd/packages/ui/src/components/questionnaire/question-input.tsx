'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { QuestionnaireItemBuilder, AnswerOption, QuestionType } from '@mrd/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface QuestionInputProps {
  /** The question item to render */
  item: QuestionnaireItemBuilder;
  /** Current value */
  value?: string | number | boolean | string[];
  /** Value change handler */
  onChange: (value: string | number | boolean | string[]) => void;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether to show patient-facing text */
  showPatientText?: boolean;
  /** Error message */
  error?: string;
  /** Additional class name */
  className?: string;
}

export interface QuestionInputEditorProps {
  /** The question item being edited */
  item: QuestionnaireItemBuilder;
  /** Update handler */
  onUpdate: (updates: Partial<QuestionnaireItemBuilder>) => void;
  /** Delete handler */
  onDelete: () => void;
  /** Duplicate handler */
  onDuplicate: () => void;
  /** Move up handler */
  onMoveUp?: () => void;
  /** Move down handler */
  onMoveDown?: () => void;
  /** Whether this is the first item */
  isFirst?: boolean;
  /** Whether this is the last item */
  isLast?: boolean;
  /** Whether scoring is enabled */
  scoringEnabled?: boolean;
  /** Additional class name */
  className?: string;
}

// =============================================================================
// QUESTION TYPE LABELS
// =============================================================================

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  boolean: 'Ja/Nee',
  decimal: 'Decimaal getal',
  integer: 'Geheel getal',
  date: 'Datum',
  dateTime: 'Datum en tijd',
  time: 'Tijd',
  string: 'Korte tekst',
  text: 'Lange tekst',
  choice: 'Enkele keuze',
  'open-choice': 'Enkele keuze + anders',
  'multi-choice': 'Meerkeuze',
  display: 'Instructie/tekst',
  group: 'Groep',
};

export const QUESTION_TYPE_ICONS: Record<QuestionType, string> = {
  boolean: 'ToggleLeft',
  decimal: 'Hash',
  integer: 'Hash',
  date: 'Calendar',
  dateTime: 'CalendarClock',
  time: 'Clock',
  string: 'Type',
  text: 'AlignLeft',
  choice: 'CircleDot',
  'open-choice': 'CircleDot',
  'multi-choice': 'CheckSquare',
  display: 'FileText',
  group: 'Folder',
};

// =============================================================================
// QUESTION INPUT COMPONENT (FOR PATIENT/FORM VIEW)
// =============================================================================

/**
 * QuestionInput renders a single question for patient/form filling view.
 * It handles all question types and renders the appropriate input component.
 */
export function QuestionInput({
  item,
  value,
  onChange,
  disabled = false,
  showPatientText = true,
  error,
  className,
}: QuestionInputProps) {
  const displayText = showPatientText && item.patientText ? item.patientText : item.text;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Question Label */}
      {item.type !== 'display' && (
        <label className="block text-sm font-medium text-foreground">
          {item.prefix && <span className="mr-1">{item.prefix}</span>}
          {displayText}
          {item.validation?.required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </label>
      )}

      {/* Help Text */}
      {item.helpText && (
        <p className="text-sm text-muted-foreground">{item.helpText}</p>
      )}

      {/* Input Component */}
      {renderInput(item, value, onChange, disabled)}

      {/* Error Message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

function renderInput(
  item: QuestionnaireItemBuilder,
  value: string | number | boolean | string[] | undefined,
  onChange: (value: string | number | boolean | string[]) => void,
  disabled: boolean
) {
  switch (item.type) {
    case 'boolean':
      return (
        <BooleanInput
          value={value as boolean | undefined}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case 'integer':
    case 'decimal':
      return (
        <NumberInput
          value={value as number | undefined}
          onChange={onChange}
          disabled={disabled}
          type={item.type}
          min={item.validation?.minValue}
          max={item.validation?.maxValue}
        />
      );

    case 'date':
      return (
        <DateInput
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
        />
      );

    case 'dateTime':
      return (
        <DateTimeInput
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
        />
      );

    case 'time':
      return (
        <TimeInput
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
        />
      );

    case 'string':
      return (
        <TextInput
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
          maxLength={item.validation?.maxLength}
          pattern={item.validation?.pattern}
        />
      );

    case 'text':
      return (
        <TextareaInput
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
          maxLength={item.validation?.maxLength}
        />
      );

    case 'choice':
    case 'open-choice':
      return (
        <ChoiceInput
          options={item.options || []}
          value={value as string | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
          allowOther={item.type === 'open-choice'}
        />
      );

    case 'multi-choice':
      return (
        <MultiChoiceInput
          options={item.options || []}
          value={value as string[] | undefined}
          onChange={(v) => onChange(v)}
          disabled={disabled}
          minSelections={item.validation?.minSelections}
          maxSelections={item.validation?.maxSelections}
        />
      );

    case 'display':
      return (
        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          {item.text}
        </div>
      );

    case 'group':
      // Groups are containers - they don't render input themselves
      return null;

    default:
      return null;
  }
}

// =============================================================================
// INPUT COMPONENTS
// =============================================================================

interface BooleanInputProps {
  value?: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

function BooleanInput({ value, onChange, disabled }: BooleanInputProps) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={() => onChange(true)}
        disabled={disabled}
        className={cn(
          'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors',
          value === true
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        Ja
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        disabled={disabled}
        className={cn(
          'flex-1 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors',
          value === false
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background hover:border-primary/50',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        Nee
      </button>
    </div>
  );
}

interface NumberInputProps {
  value?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  type: 'integer' | 'decimal';
  min?: number;
  max?: number;
}

function NumberInput({ value, onChange, disabled, type, min, max }: NumberInputProps) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const v = type === 'integer' 
          ? parseInt(e.target.value, 10) 
          : parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      disabled={disabled}
      min={min}
      max={max}
      step={type === 'decimal' ? '0.01' : '1'}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface DateInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function DateInput({ value, onChange, disabled }: DateInputProps) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface DateTimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function DateTimeInput({ value, onChange, disabled }: DateTimeInputProps) {
  return (
    <input
      type="datetime-local"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface TimeInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function TimeInput({ value, onChange, disabled }: TimeInputProps) {
  return (
    <input
      type="time"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface TextInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
  pattern?: string;
}

function TextInput({ value, onChange, disabled, maxLength, pattern }: TextInputProps) {
  return (
    <input
      type="text"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      pattern={pattern}
      className={cn(
        'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface TextareaInputProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

function TextareaInput({ value, onChange, disabled, maxLength }: TextareaInputProps) {
  return (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      maxLength={maxLength}
      rows={4}
      className={cn(
        'w-full resize-none rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    />
  );
}

interface ChoiceInputProps {
  options: AnswerOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowOther?: boolean;
}

function ChoiceInput({ options, value, onChange, disabled, allowOther }: ChoiceInputProps) {
  const [showOther, setShowOther] = React.useState(false);
  const [otherValue, setOtherValue] = React.useState('');

  const isOtherSelected = value && !options.some(o => String(o.value) === value);

  React.useEffect(() => {
    if (isOtherSelected && value) {
      setShowOther(true);
      setOtherValue(value);
    }
  }, [isOtherSelected, value]);

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.id}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors',
            String(option.value) === value
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            type="radio"
            checked={String(option.value) === value}
            onChange={() => {
              onChange(String(option.value));
              setShowOther(false);
            }}
            disabled={disabled}
            className="sr-only"
          />
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2',
              String(option.value) === value
                ? 'border-primary'
                : 'border-muted-foreground/30'
            )}
          >
            {String(option.value) === value && (
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-sm">{option.text}</span>
          {option.score !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground">
              ({option.score} pt)
            </span>
          )}
        </label>
      ))}

      {allowOther && (
        <>
          <label
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors',
              showOther && isOtherSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="radio"
              checked={showOther && isOtherSelected}
              onChange={() => setShowOther(true)}
              disabled={disabled}
              className="sr-only"
            />
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border-2',
                showOther && isOtherSelected
                  ? 'border-primary'
                  : 'border-muted-foreground/30'
              )}
            >
              {showOther && isOtherSelected && (
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
              )}
            </div>
            <span className="text-sm">Anders...</span>
          </label>

          {showOther && (
            <input
              type="text"
              value={otherValue}
              onChange={(e) => {
                setOtherValue(e.target.value);
                onChange(e.target.value);
              }}
              placeholder="Specificeer..."
              disabled={disabled}
              className={cn(
                'w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            />
          )}
        </>
      )}
    </div>
  );
}

interface MultiChoiceInputProps {
  options: AnswerOption[];
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

function MultiChoiceInput({ 
  options, 
  value = [], 
  onChange, 
  disabled,
  maxSelections 
}: MultiChoiceInputProps) {
  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      if (maxSelections && value.length >= maxSelections) return;
      onChange([...value, optionValue]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const isSelected = value.includes(String(option.value));
        const isDisabledByMax = !isSelected && maxSelections && value.length >= maxSelections;

        return (
          <label
            key={option.id}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors',
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              (disabled || isDisabledByMax) && 'cursor-not-allowed opacity-50'
            )}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleOption(String(option.value))}
              disabled={disabled || !!isDisabledByMax}
              className="sr-only"
            />
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border-2',
                isSelected
                  ? 'border-primary bg-primary'
                  : 'border-muted-foreground/30'
              )}
            >
              {isSelected && (
                <svg
                  className="h-3 w-3 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm">{option.text}</span>
            {option.score !== undefined && (
              <span className="ml-auto text-xs text-muted-foreground">
                ({option.score} pt)
              </span>
            )}
          </label>
        );
      })}

      {maxSelections && (
        <p className="text-xs text-muted-foreground">
          {value.length} / {maxSelections} geselecteerd
        </p>
      )}
    </div>
  );
}

// =============================================================================
// QUESTION INPUT EDITOR (FOR BUILDER VIEW)
// =============================================================================

/**
 * QuestionInputEditor is the edit mode for a question in the builder.
 * It allows editing the question text, type, options, validation, etc.
 */
export function QuestionInputEditor({
  item,
  onUpdate,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
  scoringEnabled,
  className,
}: QuestionInputEditorProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const hasOptions = ['choice', 'open-choice', 'multi-choice'].includes(item.type);

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card transition-shadow',
        isExpanded && 'ring-2 ring-primary/20',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div className="cursor-grab text-muted-foreground hover:text-foreground">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* Prefix */}
        <input
          type="text"
          value={item.prefix || ''}
          onChange={(e) => onUpdate({ prefix: e.target.value })}
          placeholder="#"
          className="w-12 rounded border border-input bg-background px-2 py-1 text-center text-sm"
        />

        {/* Question Text */}
        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Vraag tekst..."
          className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
        />

        {/* Type Selector */}
        <select
          value={item.type}
          onChange={(e) => onUpdate({ type: e.target.value as QuestionType })}
          className="rounded border border-input bg-background px-3 py-1.5 text-sm"
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title={isExpanded ? 'Inklappen' : 'Uitklappen'}
          >
            <svg
              className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Omhoog"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30"
            title="Omlaag"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Dupliceren"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            title="Verwijderen"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
          {/* Patient Text */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Tekst voor client (optioneel)
            </label>
            <input
              type="text"
              value={item.patientText || ''}
              onChange={(e) => onUpdate({ patientText: e.target.value })}
              placeholder="Tekst die de client ziet..."
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Help Text */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Hulptekst (optioneel)
            </label>
            <input
              type="text"
              value={item.helpText || ''}
              onChange={(e) => onUpdate({ helpText: e.target.value })}
              placeholder="Extra uitleg voor de client..."
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Answer Options */}
          {hasOptions && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Antwoordopties
              </label>
              <AnswerOptionsEditor
                options={item.options || []}
                onChange={(options) => onUpdate({ options })}
                scoringEnabled={scoringEnabled}
              />
            </div>
          )}

          {/* Validation */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.validation?.required || false}
                onChange={(e) => onUpdate({
                  validation: { ...item.validation, required: e.target.checked }
                })}
                className="h-4 w-4 rounded border-input"
              />
              Verplicht
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ANSWER OPTIONS EDITOR
// =============================================================================

interface AnswerOptionsEditorProps {
  options: AnswerOption[];
  onChange: (options: AnswerOption[]) => void;
  scoringEnabled?: boolean;
}

function AnswerOptionsEditor({ options, onChange, scoringEnabled }: AnswerOptionsEditorProps) {
  const addOption = () => {
    const newOption: AnswerOption = {
      id: `opt_${Date.now()}`,
      text: '',
      value: options.length.toString(),
      score: scoringEnabled ? 0 : undefined,
    };
    onChange([...options, newOption]);
  };

  const updateOption = (index: number, updates: Partial<AnswerOption>) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    onChange(newOptions);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <input
            type="text"
            value={option.text}
            onChange={(e) => updateOption(index, { text: e.target.value })}
            placeholder={`Optie ${index + 1}`}
            className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm"
          />
          {scoringEnabled && (
            <input
              type="number"
              value={option.score ?? 0}
              onChange={(e) => updateOption(index, { score: parseInt(e.target.value, 10) || 0 })}
              className="w-16 rounded border border-input bg-background px-2 py-1.5 text-center text-sm"
              title="Score punten"
            />
          )}
          <button
            type="button"
            onClick={() => removeOption(index)}
            className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className="flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Optie toevoegen
      </button>
    </div>
  );
}
