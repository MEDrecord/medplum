'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { ScoreConfiguration, ScoreRange, ScoreSeverity } from '@mrd/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface ScoreRangeEditorProps {
  /** Current score configuration */
  config: ScoreConfiguration;
  /** Update handler */
  onChange: (config: ScoreConfiguration) => void;
  /** Validation errors */
  errors?: string[];
  /** Additional class name */
  className?: string;
}

// =============================================================================
// PRESETS
// =============================================================================

export interface ScorePreset {
  id: string;
  name: string;
  description: string;
  loincCode?: string;
  maxScore: number;
  ranges: ScoreRange[];
}

export const SCORE_PRESETS: ScorePreset[] = [
  {
    id: 'phq-9',
    name: 'PHQ-9 (Depressie)',
    description: 'Patient Health Questionnaire - 9 items',
    loincCode: '44261-6',
    maxScore: 27,
    ranges: [
      { min: 0, max: 4, severity: 'minimal', label: 'Minimaal', color: '#22C55E' },
      { min: 5, max: 9, severity: 'mild', label: 'Mild', color: '#EAB308' },
      { min: 10, max: 14, severity: 'moderate', label: 'Matig', color: '#F97316' },
      { min: 15, max: 19, severity: 'moderately-severe', label: 'Matig-ernstig', color: '#EF4444' },
      { min: 20, max: 27, severity: 'severe', label: 'Ernstig', color: '#DC2626' },
    ],
  },
  {
    id: 'gad-7',
    name: 'GAD-7 (Angst)',
    description: 'Generalized Anxiety Disorder - 7 items',
    loincCode: '70274-6',
    maxScore: 21,
    ranges: [
      { min: 0, max: 4, severity: 'minimal', label: 'Minimaal', color: '#22C55E' },
      { min: 5, max: 9, severity: 'mild', label: 'Mild', color: '#EAB308' },
      { min: 10, max: 14, severity: 'moderate', label: 'Matig', color: '#F97316' },
      { min: 15, max: 21, severity: 'severe', label: 'Ernstig', color: '#DC2626' },
    ],
  },
  {
    id: 'pcl-5',
    name: 'PCL-5 (PTSS)',
    description: 'PTSD Checklist for DSM-5 - 20 items',
    loincCode: '71549-6',
    maxScore: 80,
    ranges: [
      { min: 0, max: 30, severity: 'minimal', label: 'Minimaal', color: '#22C55E' },
      { min: 31, max: 32, severity: 'mild', label: 'Subklinisch', color: '#EAB308' },
      { min: 33, max: 80, severity: 'severe', label: 'Klinisch significant', color: '#DC2626' },
    ],
  },
  {
    id: 'who-5',
    name: 'WHO-5 (Welzijn)',
    description: 'WHO Well-Being Index - 5 items',
    loincCode: '76459-0',
    maxScore: 25,
    ranges: [
      { min: 0, max: 12, severity: 'severe', label: 'Laag welzijn', color: '#DC2626' },
      { min: 13, max: 25, severity: 'minimal', label: 'Goed welzijn', color: '#22C55E' },
    ],
  },
  {
    id: 'k10',
    name: 'K10 (Distress)',
    description: 'Kessler Psychological Distress Scale - 10 items',
    loincCode: '71483-8',
    maxScore: 50,
    ranges: [
      { min: 10, max: 15, severity: 'minimal', label: 'Laag', color: '#22C55E' },
      { min: 16, max: 21, severity: 'mild', label: 'Matig', color: '#EAB308' },
      { min: 22, max: 29, severity: 'moderate', label: 'Hoog', color: '#F97316' },
      { min: 30, max: 50, severity: 'severe', label: 'Zeer hoog', color: '#DC2626' },
    ],
  },
];

// =============================================================================
// SEVERITY OPTIONS
// =============================================================================

const SEVERITY_OPTIONS: Array<{ value: ScoreSeverity; label: string }> = [
  { value: 'minimal', label: 'Minimaal' },
  { value: 'mild', label: 'Mild' },
  { value: 'moderate', label: 'Matig' },
  { value: 'moderately-severe', label: 'Matig-ernstig' },
  { value: 'severe', label: 'Ernstig' },
];

const DEFAULT_COLORS: Record<ScoreSeverity, string> = {
  'minimal': '#22C55E',
  'mild': '#EAB308',
  'moderate': '#F97316',
  'moderately-severe': '#EF4444',
  'severe': '#DC2626',
};

// =============================================================================
// SCORE RANGE EDITOR COMPONENT
// =============================================================================

/**
 * ScoreRangeEditor allows configuring score ranges for a questionnaire.
 * It supports presets (PHQ-9, GAD-7, etc.) and custom ranges.
 */
export function ScoreRangeEditor({
  config,
  onChange,
  errors,
  className,
}: ScoreRangeEditorProps) {
  const [showPresets, setShowPresets] = React.useState(false);

  // Add a new range
  const addRange = () => {
    const lastRange = config.ranges[config.ranges.length - 1];
    const newMin = lastRange ? lastRange.max + 1 : 0;
    const newMax = Math.min(newMin + 4, config.maxScore);

    const newRange: ScoreRange = {
      min: newMin,
      max: newMax,
      severity: 'mild',
      label: 'Nieuw bereik',
      color: DEFAULT_COLORS['mild'],
    };

    onChange({
      ...config,
      ranges: [...config.ranges, newRange],
    });
  };

  // Update a specific range
  const updateRange = (index: number, updates: Partial<ScoreRange>) => {
    const newRanges = [...config.ranges];
    newRanges[index] = { ...newRanges[index], ...updates };

    // Auto-update color when severity changes
    if (updates.severity && !updates.color) {
      newRanges[index].color = DEFAULT_COLORS[updates.severity];
    }

    onChange({ ...config, ranges: newRanges });
  };

  // Remove a range
  const removeRange = (index: number) => {
    onChange({
      ...config,
      ranges: config.ranges.filter((_, i) => i !== index),
    });
  };

  // Apply a preset
  const applyPreset = (preset: ScorePreset) => {
    onChange({
      ...config,
      maxScore: preset.maxScore,
      ranges: preset.ranges,
      loincCode: preset.loincCode,
      displayName: preset.name,
    });
    setShowPresets(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with Toggle and Preset Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            Score berekening inschakelen
          </label>
        </div>

        {config.enabled && (
          <button
            type="button"
            onClick={() => setShowPresets(!showPresets)}
            className="text-sm text-primary hover:underline"
          >
            Preset gebruiken
          </button>
        )}
      </div>

      {/* Preset Selector */}
      {showPresets && config.enabled && (
        <div className="rounded-lg border border-border bg-muted/50 p-4">
          <p className="mb-3 text-sm font-medium">Kies een preset:</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCORE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className="flex flex-col items-start rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary"
              >
                <span className="font-medium">{preset.name}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
                <span className="mt-1 text-xs text-muted-foreground">
                  Max score: {preset.maxScore}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {config.enabled && (
        <>
          {/* Score Settings */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Minimale score</label>
              <input
                type="number"
                value={config.minScore}
                onChange={(e) => onChange({ ...config, minScore: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Maximale score</label>
              <input
                type="number"
                value={config.maxScore}
                onChange={(e) => onChange({ ...config, maxScore: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Berekeningsmethode</label>
              <select
                value={config.method}
                onChange={(e) => onChange({ ...config, method: e.target.value as 'sum' | 'average' | 'weighted' })}
                className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="sum">Som (totaal)</option>
                <option value="average">Gemiddelde</option>
                <option value="weighted">Gewogen</option>
              </select>
            </div>
          </div>

          {/* LOINC Code */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              LOINC code (optioneel)
            </label>
            <input
              type="text"
              value={config.loincCode || ''}
              onChange={(e) => onChange({ ...config, loincCode: e.target.value })}
              placeholder="bijv. 44261-6 voor PHQ-9"
              className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          {/* Score Ranges */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium">Score bereiken</label>
              <button
                type="button"
                onClick={addRange}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Bereik toevoegen
              </button>
            </div>

            <div className="space-y-2">
              {config.ranges.map((range, index) => (
                <ScoreRangeRow
                  key={index}
                  range={range}
                  onChange={(updates) => updateRange(index, updates)}
                  onRemove={() => removeRange(index)}
                  maxScore={config.maxScore}
                />
              ))}

              {config.ranges.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  Geen score bereiken gedefinieerd. Voeg een bereik toe of gebruik een preset.
                </div>
              )}
            </div>
          </div>

          {/* Visual Score Bar */}
          {config.ranges.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium">Preview</label>
              <ScoreBar ranges={config.ranges} maxScore={config.maxScore} />
            </div>
          )}

          {/* Validation Errors */}
          {errors && errors.length > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="mb-1 text-sm font-medium text-destructive">Validatiefouten:</p>
              <ul className="list-inside list-disc text-sm text-destructive">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// SCORE RANGE ROW
// =============================================================================

interface ScoreRangeRowProps {
  range: ScoreRange;
  onChange: (updates: Partial<ScoreRange>) => void;
  onRemove: () => void;
  maxScore: number;
}

function ScoreRangeRow({ range, onChange, onRemove, maxScore }: ScoreRangeRowProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-3">
      {/* Color Indicator */}
      <div
        className="h-8 w-3 rounded"
        style={{ backgroundColor: range.color }}
      />

      {/* Min Score */}
      <div className="w-16">
        <input
          type="number"
          value={range.min}
          onChange={(e) => onChange({ min: parseInt(e.target.value, 10) || 0 })}
          min={0}
          max={maxScore}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-center text-sm"
          title="Minimum"
        />
      </div>

      <span className="text-muted-foreground">-</span>

      {/* Max Score */}
      <div className="w-16">
        <input
          type="number"
          value={range.max}
          onChange={(e) => onChange({ max: parseInt(e.target.value, 10) || 0 })}
          min={0}
          max={maxScore}
          className="w-full rounded border border-input bg-background px-2 py-1.5 text-center text-sm"
          title="Maximum"
        />
      </div>

      {/* Severity Select */}
      <select
        value={range.severity}
        onChange={(e) => onChange({ severity: e.target.value as ScoreSeverity })}
        className="flex-1 rounded border border-input bg-background px-2 py-1.5 text-sm"
      >
        {SEVERITY_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      {/* Label */}
      <input
        type="text"
        value={range.label}
        onChange={(e) => onChange({ label: e.target.value })}
        placeholder="Label"
        className="w-32 rounded border border-input bg-background px-2 py-1.5 text-sm"
      />

      {/* Color Picker */}
      <input
        type="color"
        value={range.color}
        onChange={(e) => onChange({ color: e.target.value })}
        className="h-8 w-8 cursor-pointer rounded border border-input"
        title="Kleur"
      />

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        title="Verwijderen"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// =============================================================================
// SCORE BAR VISUALIZATION
// =============================================================================

interface ScoreBarProps {
  ranges: ScoreRange[];
  maxScore: number;
  currentScore?: number;
}

export function ScoreBar({ ranges, maxScore, currentScore }: ScoreBarProps) {
  // Sort ranges by min value
  const sortedRanges = [...ranges].sort((a, b) => a.min - b.min);

  return (
    <div className="relative">
      {/* Bar */}
      <div className="flex h-8 overflow-hidden rounded-lg">
        {sortedRanges.map((range, index) => {
          const width = ((range.max - range.min + 1) / (maxScore + 1)) * 100;
          return (
            <div
              key={index}
              className="flex items-center justify-center text-xs font-medium text-white"
              style={{
                backgroundColor: range.color,
                width: `${width}%`,
              }}
              title={`${range.min}-${range.max}: ${range.label}`}
            >
              {width > 10 && range.label}
            </div>
          );
        })}
      </div>

      {/* Scale */}
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span>{maxScore}</span>
      </div>

      {/* Current Score Indicator */}
      {currentScore !== undefined && (
        <div
          className="absolute top-0 h-8 w-0.5 bg-foreground"
          style={{
            left: `${(currentScore / maxScore) * 100}%`,
          }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-xs text-background">
            {currentScore}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SCORE DISPLAY COMPONENT
// =============================================================================

export interface ScoreDisplayProps {
  score: number;
  maxScore: number;
  ranges: ScoreRange[];
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * ScoreDisplay shows the calculated score with severity interpretation.
 */
export function ScoreDisplay({
  score,
  maxScore,
  ranges,
  showBar = true,
  size = 'md',
  className,
}: ScoreDisplayProps) {
  // Find the matching range
  const matchingRange = ranges.find(r => score >= r.min && score <= r.max);
  const severity = matchingRange?.severity || 'minimal';
  const label = matchingRange?.label || 'Onbekend';
  const color = matchingRange?.color || '#6B7280';

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-end gap-2">
        <span className={cn('font-bold', sizeClasses[size])} style={{ color }}>
          {score}
        </span>
        <span className="mb-1 text-muted-foreground">/ {maxScore}</span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium" style={{ color }}>
          {label}
        </span>
      </div>

      {showBar && (
        <ScoreBar ranges={ranges} maxScore={maxScore} currentScore={score} />
      )}
    </div>
  );
}
