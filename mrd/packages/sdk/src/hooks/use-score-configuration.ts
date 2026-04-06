/**
 * useScoreConfiguration Hook
 * 
 * Headless hook for managing questionnaire score configuration.
 * Handles score ranges, severity levels, and validation.
 * 
 * @example
 * ```tsx
 * const {
 *   config,
 *   enabled,
 *   toggleEnabled,
 *   addRange,
 *   updateRange,
 *   removeRange,
 *   validate,
 * } = useScoreConfiguration({ initialConfig, maxPossibleScore: 27 });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  ScoreConfiguration,
  ScoreRange,
  ScoreSeverity,
  DEFAULT_SCORE_COLORS,
} from '@mrd/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface UseScoreConfigurationOptions {
  /** Initial score configuration */
  initialConfig?: ScoreConfiguration;
  /** Maximum possible score (based on questionnaire items) */
  maxPossibleScore?: number;
  /** Callback when configuration changes */
  onChange?: (config: ScoreConfiguration) => void;
}

export interface ScoreValidationError {
  path: string;
  message: string;
  rangeIndex?: number;
}

export interface UseScoreConfigurationReturn {
  // State
  config: ScoreConfiguration;
  enabled: boolean;
  ranges: ScoreRange[];
  validationErrors: ScoreValidationError[];
  isValid: boolean;
  
  // Enable/disable
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  
  // Scoring method
  setMethod: (method: ScoreConfiguration['method']) => void;
  setCustomExpression: (expression: string) => void;
  
  // Score bounds
  setMinScore: (min: number) => void;
  setMaxScore: (max: number) => void;
  
  // LOINC
  setLoincCode: (code: string | undefined) => void;
  setDisplayName: (name: string | undefined) => void;
  
  // Range CRUD
  addRange: (range?: Partial<ScoreRange>) => void;
  updateRange: (index: number, updates: Partial<ScoreRange>) => void;
  removeRange: (index: number) => void;
  moveRange: (index: number, direction: 'up' | 'down') => void;
  
  // Presets
  applyPreset: (preset: ScorePreset) => void;
  
  // Validation
  validate: () => ScoreValidationError[];
  
  // Utilities
  getSeverityForScore: (score: number) => ScoreRange | undefined;
  calculatePercentage: (score: number) => number;
  
  // Reset
  reset: () => void;
  setConfig: (config: ScoreConfiguration) => void;
}

// =============================================================================
// PRESETS
// =============================================================================

export type ScorePreset = 
  | 'phq-9'      // PHQ-9 Depression
  | 'gad-7'      // GAD-7 Anxiety
  | 'pcl-5'      // PCL-5 PTSD
  | 'who-5'      // WHO-5 Wellbeing
  | 'k10'        // Kessler K10
  | 'custom';

const SCORE_PRESETS: Record<Exclude<ScorePreset, 'custom'>, ScoreConfiguration> = {
  'phq-9': {
    enabled: true,
    method: 'sum',
    minScore: 0,
    maxScore: 27,
    loincCode: '44261-6',
    displayName: 'PHQ-9 Score',
    ranges: [
      { min: 0, max: 4, severity: 'minimal', label: 'Minimaal', color: '#22C55E' },
      { min: 5, max: 9, severity: 'mild', label: 'Mild', color: '#EAB308' },
      { min: 10, max: 14, severity: 'moderate', label: 'Matig', color: '#F97316' },
      { min: 15, max: 19, severity: 'moderately-severe', label: 'Matig-ernstig', color: '#EF4444' },
      { min: 20, max: 27, severity: 'severe', label: 'Ernstig', color: '#DC2626' },
    ],
  },
  'gad-7': {
    enabled: true,
    method: 'sum',
    minScore: 0,
    maxScore: 21,
    loincCode: '70274-6',
    displayName: 'GAD-7 Score',
    ranges: [
      { min: 0, max: 4, severity: 'minimal', label: 'Minimaal', color: '#22C55E' },
      { min: 5, max: 9, severity: 'mild', label: 'Mild', color: '#EAB308' },
      { min: 10, max: 14, severity: 'moderate', label: 'Matig', color: '#F97316' },
      { min: 15, max: 21, severity: 'severe', label: 'Ernstig', color: '#DC2626' },
    ],
  },
  'pcl-5': {
    enabled: true,
    method: 'sum',
    minScore: 0,
    maxScore: 80,
    loincCode: '77869-2',
    displayName: 'PCL-5 Score',
    ranges: [
      { min: 0, max: 30, severity: 'minimal', label: 'Onder drempel', color: '#22C55E' },
      { min: 31, max: 32, severity: 'mild', label: 'Grenswaarde', color: '#EAB308' },
      { min: 33, max: 80, severity: 'severe', label: 'Boven drempel (PTSD)', color: '#DC2626' },
    ],
  },
  'who-5': {
    enabled: true,
    method: 'sum',
    minScore: 0,
    maxScore: 100,
    loincCode: '89555-6',
    displayName: 'WHO-5 Score',
    ranges: [
      { min: 0, max: 28, severity: 'severe', label: 'Laag welbevinden', color: '#DC2626' },
      { min: 29, max: 50, severity: 'moderate', label: 'Verminderd welbevinden', color: '#F97316' },
      { min: 51, max: 100, severity: 'minimal', label: 'Goed welbevinden', color: '#22C55E' },
    ],
  },
  'k10': {
    enabled: true,
    method: 'sum',
    minScore: 10,
    maxScore: 50,
    loincCode: '89556-4',
    displayName: 'K10 Score',
    ranges: [
      { min: 10, max: 19, severity: 'minimal', label: 'Laag', color: '#22C55E' },
      { min: 20, max: 24, severity: 'mild', label: 'Mild', color: '#EAB308' },
      { min: 25, max: 29, severity: 'moderate', label: 'Matig', color: '#F97316' },
      { min: 30, max: 50, severity: 'severe', label: 'Ernstig', color: '#DC2626' },
    ],
  },
};

// =============================================================================
// HELPERS
// =============================================================================

const DEFAULT_COLORS: Record<ScoreSeverity, string> = {
  'minimal': '#22C55E',
  'mild': '#EAB308',
  'moderate': '#F97316',
  'moderately-severe': '#EF4444',
  'severe': '#DC2626',
};

const createDefaultConfig = (maxPossibleScore = 100): ScoreConfiguration => ({
  enabled: false,
  method: 'sum',
  minScore: 0,
  maxScore: maxPossibleScore,
  ranges: [],
});

const createDefaultRange = (index: number, maxScore: number): ScoreRange => {
  const severities: ScoreSeverity[] = ['minimal', 'mild', 'moderate', 'moderately-severe', 'severe'];
  const severity = severities[Math.min(index, severities.length - 1)];
  
  return {
    min: 0,
    max: maxScore,
    severity,
    label: severity.charAt(0).toUpperCase() + severity.slice(1),
    color: DEFAULT_COLORS[severity],
  };
};

// =============================================================================
// HOOK
// =============================================================================

export function useScoreConfiguration(
  options: UseScoreConfigurationOptions = {}
): UseScoreConfigurationReturn {
  const {
    initialConfig,
    maxPossibleScore = 100,
    onChange,
  } = options;

  const [config, setConfigState] = useState<ScoreConfiguration>(
    initialConfig ?? createDefaultConfig(maxPossibleScore)
  );
  const [validationErrors, setValidationErrors] = useState<ScoreValidationError[]>([]);

  const updateConfig = useCallback((
    updater: (c: ScoreConfiguration) => ScoreConfiguration
  ) => {
    setConfigState(prev => {
      const next = updater(prev);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  // ============================================
  // Enable/disable
  // ============================================

  const toggleEnabled = useCallback(() => {
    updateConfig(c => ({ ...c, enabled: !c.enabled }));
  }, [updateConfig]);

  const setEnabled = useCallback((enabled: boolean) => {
    updateConfig(c => ({ ...c, enabled }));
  }, [updateConfig]);

  // ============================================
  // Scoring method
  // ============================================

  const setMethod = useCallback((method: ScoreConfiguration['method']) => {
    updateConfig(c => ({ ...c, method }));
  }, [updateConfig]);

  const setCustomExpression = useCallback((expression: string) => {
    updateConfig(c => ({ ...c, customExpression: expression }));
  }, [updateConfig]);

  // ============================================
  // Score bounds
  // ============================================

  const setMinScore = useCallback((min: number) => {
    updateConfig(c => ({ ...c, minScore: min }));
  }, [updateConfig]);

  const setMaxScore = useCallback((max: number) => {
    updateConfig(c => ({ ...c, maxScore: max }));
  }, [updateConfig]);

  // ============================================
  // LOINC
  // ============================================

  const setLoincCode = useCallback((code: string | undefined) => {
    updateConfig(c => ({ ...c, loincCode: code }));
  }, [updateConfig]);

  const setDisplayName = useCallback((name: string | undefined) => {
    updateConfig(c => ({ ...c, displayName: name }));
  }, [updateConfig]);

  // ============================================
  // Range CRUD
  // ============================================

  const addRange = useCallback((range?: Partial<ScoreRange>) => {
    updateConfig(c => {
      const newRange: ScoreRange = {
        ...createDefaultRange(c.ranges.length, c.maxScore),
        ...range,
      };
      return { ...c, ranges: [...c.ranges, newRange] };
    });
  }, [updateConfig]);

  const updateRange = useCallback((index: number, updates: Partial<ScoreRange>) => {
    updateConfig(c => ({
      ...c,
      ranges: c.ranges.map((r, i) => i === index ? { ...r, ...updates } : r),
    }));
  }, [updateConfig]);

  const removeRange = useCallback((index: number) => {
    updateConfig(c => ({
      ...c,
      ranges: c.ranges.filter((_, i) => i !== index),
    }));
  }, [updateConfig]);

  const moveRange = useCallback((index: number, direction: 'up' | 'down') => {
    updateConfig(c => {
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= c.ranges.length) return c;

      const newRanges = [...c.ranges];
      [newRanges[index], newRanges[newIndex]] = [newRanges[newIndex], newRanges[index]];
      return { ...c, ranges: newRanges };
    });
  }, [updateConfig]);

  // ============================================
  // Presets
  // ============================================

  const applyPreset = useCallback((preset: ScorePreset) => {
    if (preset === 'custom') {
      updateConfig(c => ({
        ...c,
        enabled: true,
        ranges: c.ranges.length === 0 
          ? [createDefaultRange(0, c.maxScore)]
          : c.ranges,
      }));
    } else {
      setConfigState(SCORE_PRESETS[preset]);
      onChange?.(SCORE_PRESETS[preset]);
    }
  }, [onChange, updateConfig]);

  // ============================================
  // Validation
  // ============================================

  const validate = useCallback((): ScoreValidationError[] => {
    const errors: ScoreValidationError[] = [];

    if (!config.enabled) {
      setValidationErrors([]);
      return [];
    }

    // Check ranges exist
    if (config.ranges.length === 0) {
      errors.push({ path: 'ranges', message: 'At least one score range is required' });
    }

    // Check ranges don't overlap and cover full range
    const sortedRanges = [...config.ranges].sort((a, b) => a.min - b.min);
    
    for (let i = 0; i < sortedRanges.length; i++) {
      const range = sortedRanges[i];
      
      // Check range is valid
      if (range.min > range.max) {
        errors.push({
          path: `ranges[${i}]`,
          message: `Range ${i + 1}: min (${range.min}) cannot be greater than max (${range.max})`,
          rangeIndex: i,
        });
      }

      // Check label
      if (!range.label.trim()) {
        errors.push({
          path: `ranges[${i}].label`,
          message: `Range ${i + 1}: label is required`,
          rangeIndex: i,
        });
      }

      // Check for gaps/overlaps with next range
      if (i < sortedRanges.length - 1) {
        const nextRange = sortedRanges[i + 1];
        if (range.max >= nextRange.min) {
          errors.push({
            path: `ranges[${i}]`,
            message: `Range ${i + 1} overlaps with range ${i + 2}`,
            rangeIndex: i,
          });
        } else if (range.max + 1 < nextRange.min) {
          errors.push({
            path: `ranges[${i}]`,
            message: `Gap between range ${i + 1} and ${i + 2} (${range.max + 1} - ${nextRange.min - 1})`,
            rangeIndex: i,
          });
        }
      }
    }

    // Check first range starts at minScore
    if (sortedRanges.length > 0 && sortedRanges[0].min !== config.minScore) {
      errors.push({
        path: 'ranges[0].min',
        message: `First range should start at ${config.minScore}`,
        rangeIndex: 0,
      });
    }

    // Check last range ends at maxScore
    if (sortedRanges.length > 0) {
      const lastRange = sortedRanges[sortedRanges.length - 1];
      if (lastRange.max !== config.maxScore) {
        errors.push({
          path: `ranges[${sortedRanges.length - 1}].max`,
          message: `Last range should end at ${config.maxScore}`,
          rangeIndex: sortedRanges.length - 1,
        });
      }
    }

    // Custom expression validation
    if (config.method === 'custom' && !config.customExpression?.trim()) {
      errors.push({
        path: 'customExpression',
        message: 'Custom expression is required when using custom scoring method',
      });
    }

    setValidationErrors(errors);
    return errors;
  }, [config]);

  const isValid = useMemo(() => validationErrors.length === 0, [validationErrors]);

  // ============================================
  // Utilities
  // ============================================

  const getSeverityForScore = useCallback((score: number): ScoreRange | undefined => {
    return config.ranges.find(r => score >= r.min && score <= r.max);
  }, [config.ranges]);

  const calculatePercentage = useCallback((score: number): number => {
    const range = config.maxScore - config.minScore;
    if (range === 0) return 0;
    return Math.round(((score - config.minScore) / range) * 100);
  }, [config.minScore, config.maxScore]);

  // ============================================
  // Reset
  // ============================================

  const reset = useCallback(() => {
    setConfigState(initialConfig ?? createDefaultConfig(maxPossibleScore));
    setValidationErrors([]);
  }, [initialConfig, maxPossibleScore]);

  const setConfig = useCallback((c: ScoreConfiguration) => {
    setConfigState(c);
  }, []);

  return {
    config,
    enabled: config.enabled,
    ranges: config.ranges,
    validationErrors,
    isValid,
    
    toggleEnabled,
    setEnabled,
    
    setMethod,
    setCustomExpression,
    
    setMinScore,
    setMaxScore,
    
    setLoincCode,
    setDisplayName,
    
    addRange,
    updateRange,
    removeRange,
    moveRange,
    
    applyPreset,
    
    validate,
    
    getSeverityForScore,
    calculatePercentage,
    
    reset,
    setConfig,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export { SCORE_PRESETS };
