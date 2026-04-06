/**
 * useQuestionnaireBuilder Hook
 * 
 * Headless hook for building and editing FHIR Questionnaires.
 * Manages item CRUD, ordering, validation, and conversion to/from FHIR format.
 * 
 * @example
 * ```tsx
 * const {
 *   items,
 *   addItem,
 *   updateItem,
 *   removeItem,
 *   moveItem,
 *   validate,
 *   toFHIR,
 * } = useQuestionnaireBuilder({ initialQuestionnaire });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  QuestionnaireBuilder,
  QuestionnaireItemBuilder,
  QuestionType,
  AnswerOption,
  QuestionValidation,
  ConditionalRule,
  ScoreConfiguration,
  FHIRQuestionnaire,
  FHIRQuestionnaireItem,
} from '@mrd/shared';

// =============================================================================
// TYPES
// =============================================================================

export interface UseQuestionnaireBuilderOptions {
  /** Initial questionnaire data (for editing) */
  initialQuestionnaire?: QuestionnaireBuilder;
  /** Callback when questionnaire changes */
  onChange?: (questionnaire: QuestionnaireBuilder) => void;
  /** Auto-generate IDs for new items */
  autoGenerateIds?: boolean;
}

export interface ValidationError {
  path: string;
  message: string;
  itemId?: string;
}

export interface UseQuestionnaireBuilderReturn {
  // State
  questionnaire: QuestionnaireBuilder;
  items: QuestionnaireItemBuilder[];
  isDirty: boolean;
  validationErrors: ValidationError[];
  
  // Questionnaire metadata
  setName: (name: string) => void;
  setTitle: (title: string) => void;
  setDescription: (description: string | undefined) => void;
  setStatus: (status: QuestionnaireBuilder['status']) => void;
  setTags: (tags: string[]) => void;
  setLanguages: (languages: string[]) => void;
  setPrimaryLanguage: (language: string) => void;
  setLoincCode: (code: string | undefined) => void;
  
  // Item CRUD
  addItem: (item: Partial<QuestionnaireItemBuilder>, parentId?: string) => string;
  updateItem: (id: string, updates: Partial<QuestionnaireItemBuilder>) => void;
  removeItem: (id: string) => void;
  duplicateItem: (id: string) => string;
  
  // Item ordering
  moveItem: (id: string, direction: 'up' | 'down') => void;
  moveItemTo: (id: string, newIndex: number, newParentId?: string) => void;
  
  // Bulk operations
  addItems: (items: Partial<QuestionnaireItemBuilder>[]) => string[];
  removeItems: (ids: string[]) => void;
  
  // Answer options (for choice types)
  addOption: (itemId: string, option: Partial<AnswerOption>) => string;
  updateOption: (itemId: string, optionId: string, updates: Partial<AnswerOption>) => void;
  removeOption: (itemId: string, optionId: string) => void;
  reorderOptions: (itemId: string, optionIds: string[]) => void;
  
  // Conditional logic
  addEnableWhen: (itemId: string, rule: ConditionalRule) => void;
  updateEnableWhen: (itemId: string, index: number, rule: ConditionalRule) => void;
  removeEnableWhen: (itemId: string, index: number) => void;
  
  // Validation
  validate: () => ValidationError[];
  isValid: boolean;
  
  // Score configuration
  scoreConfig: ScoreConfiguration | undefined;
  setScoreConfig: (config: ScoreConfiguration | undefined) => void;
  
  // Conversion
  toFHIR: () => FHIRQuestionnaire;
  fromFHIR: (fhir: FHIRQuestionnaire) => void;
  
  // Reset
  reset: () => void;
  setQuestionnaire: (questionnaire: QuestionnaireBuilder) => void;
}

// =============================================================================
// HELPERS
// =============================================================================

const generateId = (): string => {
  return `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateOptionId = (): string => {
  return `opt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const createDefaultItem = (
  type: QuestionType,
  order: number,
  autoGenerateIds: boolean
): QuestionnaireItemBuilder => ({
  id: autoGenerateIds ? generateId() : '',
  type,
  text: '',
  order,
  validation: { required: false },
  options: type === 'choice' || type === 'open-choice' || type === 'multi-choice' ? [] : undefined,
});

const createDefaultQuestionnaire = (): QuestionnaireBuilder => ({
  name: '',
  title: '',
  status: 'draft',
  items: [],
  languages: ['nl'],
  primaryLanguage: 'nl',
});

const findItemById = (
  items: QuestionnaireItemBuilder[],
  id: string
): QuestionnaireItemBuilder | undefined => {
  for (const item of items) {
    if (item.id === id) return item;
    if (item.items) {
      const found = findItemById(item.items, id);
      if (found) return found;
    }
  }
  return undefined;
};

const findItemParent = (
  items: QuestionnaireItemBuilder[],
  id: string,
  parent: QuestionnaireItemBuilder | null = null
): QuestionnaireItemBuilder | null => {
  for (const item of items) {
    if (item.id === id) return parent;
    if (item.items) {
      const found = findItemParent(item.items, id, item);
      if (found !== null) return found;
    }
  }
  return null;
};

const updateItemInTree = (
  items: QuestionnaireItemBuilder[],
  id: string,
  updates: Partial<QuestionnaireItemBuilder>
): QuestionnaireItemBuilder[] => {
  return items.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    if (item.items) {
      return { ...item, items: updateItemInTree(item.items, id, updates) };
    }
    return item;
  });
};

const removeItemFromTree = (
  items: QuestionnaireItemBuilder[],
  id: string
): QuestionnaireItemBuilder[] => {
  return items
    .filter(item => item.id !== id)
    .map(item => {
      if (item.items) {
        return { ...item, items: removeItemFromTree(item.items, id) };
      }
      return item;
    });
};

const reorderItems = (items: QuestionnaireItemBuilder[]): QuestionnaireItemBuilder[] => {
  return items.map((item, index) => ({
    ...item,
    order: index,
    items: item.items ? reorderItems(item.items) : undefined,
  }));
};

// =============================================================================
// FHIR CONVERSION
// =============================================================================

const itemToFHIR = (item: QuestionnaireItemBuilder): FHIRQuestionnaireItem => {
  const fhirItem: FHIRQuestionnaireItem = {
    linkId: item.id,
    type: item.type as FHIRQuestionnaireItem['type'],
    text: item.text,
    required: item.validation?.required,
    readOnly: item.readOnly,
    repeats: item.repeats,
  };

  if (item.prefix) fhirItem.prefix = item.prefix;
  if (item.helpText) {
    fhirItem.item = fhirItem.item ?? [];
    fhirItem.item.push({
      linkId: `${item.id}-help`,
      type: 'display',
      text: item.helpText,
    });
  }

  // Answer options
  if (item.options && item.options.length > 0) {
    fhirItem.answerOption = item.options.map(opt => ({
      valueCoding: opt.coding ?? {
        code: String(opt.value),
        display: opt.text,
      },
      extension: opt.score !== undefined ? [{
        url: 'http://hl7.org/fhir/StructureDefinition/ordinalValue',
        valueDecimal: opt.score,
      }] : undefined,
    }));
  }

  // Validation constraints
  if (item.validation) {
    if (item.validation.maxLength) {
      fhirItem.maxLength = item.validation.maxLength;
    }
  }

  // EnableWhen
  if (item.enableWhen && item.enableWhen.length > 0) {
    fhirItem.enableWhen = item.enableWhen.map(rule => ({
      question: rule.questionLinkId,
      operator: rule.operator as NonNullable<FHIRQuestionnaireItem['enableWhen']>[0]['operator'],
      answerBoolean: typeof rule.answerValue === 'boolean' ? rule.answerValue : undefined,
      answerString: typeof rule.answerValue === 'string' ? rule.answerValue : undefined,
      answerInteger: typeof rule.answerValue === 'number' ? rule.answerValue : undefined,
    }));
    fhirItem.enableBehavior = item.enableBehavior ?? 'all';
  }

  // Nested items
  if (item.items && item.items.length > 0) {
    fhirItem.item = [...(fhirItem.item ?? []), ...item.items.map(itemToFHIR)];
  }

  return fhirItem;
};

const fhirToItem = (fhirItem: FHIRQuestionnaireItem, order: number): QuestionnaireItemBuilder => {
  const item: QuestionnaireItemBuilder = {
    id: fhirItem.linkId,
    type: fhirItem.type as QuestionType,
    text: fhirItem.text ?? '',
    order,
    prefix: fhirItem.prefix,
    readOnly: fhirItem.readOnly,
    repeats: fhirItem.repeats,
    validation: {
      required: fhirItem.required,
      maxLength: fhirItem.maxLength,
    },
  };

  // Answer options
  if (fhirItem.answerOption) {
    item.options = fhirItem.answerOption.map((opt, idx) => {
      const scoreExt = opt.extension?.find(
        e => e.url === 'http://hl7.org/fhir/StructureDefinition/ordinalValue'
      );
      return {
        id: generateOptionId(),
        text: opt.valueCoding?.display ?? opt.valueString ?? '',
        value: opt.valueCoding?.code ?? opt.valueString ?? String(idx),
        score: scoreExt?.valueDecimal,
        coding: opt.valueCoding,
      };
    });
  }

  // EnableWhen
  if (fhirItem.enableWhen) {
    item.enableWhen = fhirItem.enableWhen.map(rule => ({
      questionLinkId: rule.question,
      operator: rule.operator,
      answerValue: rule.answerBoolean ?? rule.answerString ?? rule.answerInteger ?? '',
    }));
    item.enableBehavior = fhirItem.enableBehavior;
  }

  // Nested items (filter out help text display items)
  if (fhirItem.item) {
    const helpItem = fhirItem.item.find(i => i.linkId === `${fhirItem.linkId}-help`);
    if (helpItem) {
      item.helpText = helpItem.text;
    }
    
    const nestedItems = fhirItem.item.filter(i => !i.linkId.endsWith('-help'));
    if (nestedItems.length > 0) {
      item.items = nestedItems.map((i, idx) => fhirToItem(i, idx));
    }
  }

  return item;
};

// =============================================================================
// HOOK
// =============================================================================

export function useQuestionnaireBuilder(
  options: UseQuestionnaireBuilderOptions = {}
): UseQuestionnaireBuilderReturn {
  const {
    initialQuestionnaire,
    onChange,
    autoGenerateIds = true,
  } = options;

  const [questionnaire, setQuestionnaireState] = useState<QuestionnaireBuilder>(
    initialQuestionnaire ?? createDefaultQuestionnaire()
  );
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const updateQuestionnaire = useCallback((
    updater: (q: QuestionnaireBuilder) => QuestionnaireBuilder
  ) => {
    setQuestionnaireState(prev => {
      const next = updater(prev);
      setIsDirty(true);
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  // ============================================
  // Metadata setters
  // ============================================

  const setName = useCallback((name: string) => {
    updateQuestionnaire(q => ({ ...q, name }));
  }, [updateQuestionnaire]);

  const setTitle = useCallback((title: string) => {
    updateQuestionnaire(q => ({ ...q, title }));
  }, [updateQuestionnaire]);

  const setDescription = useCallback((description: string | undefined) => {
    updateQuestionnaire(q => ({ ...q, description }));
  }, [updateQuestionnaire]);

  const setStatus = useCallback((status: QuestionnaireBuilder['status']) => {
    updateQuestionnaire(q => ({ ...q, status }));
  }, [updateQuestionnaire]);

  const setTags = useCallback((tags: string[]) => {
    updateQuestionnaire(q => ({ ...q, tags }));
  }, [updateQuestionnaire]);

  const setLanguages = useCallback((languages: string[]) => {
    updateQuestionnaire(q => ({ ...q, languages }));
  }, [updateQuestionnaire]);

  const setPrimaryLanguage = useCallback((language: string) => {
    updateQuestionnaire(q => ({ ...q, primaryLanguage: language }));
  }, [updateQuestionnaire]);

  const setLoincCode = useCallback((code: string | undefined) => {
    updateQuestionnaire(q => ({ ...q, loincCode: code }));
  }, [updateQuestionnaire]);

  // ============================================
  // Item CRUD
  // ============================================

  const addItem = useCallback((
    partial: Partial<QuestionnaireItemBuilder>,
    parentId?: string
  ): string => {
    const id = partial.id || (autoGenerateIds ? generateId() : '');
    
    updateQuestionnaire(q => {
      const newItem: QuestionnaireItemBuilder = {
        ...createDefaultItem(partial.type ?? 'string', 0, false),
        ...partial,
        id,
      };

      if (parentId) {
        // Add to parent's items
        const updateParent = (items: QuestionnaireItemBuilder[]): QuestionnaireItemBuilder[] => {
          return items.map(item => {
            if (item.id === parentId) {
              const existingItems = item.items ?? [];
              newItem.order = existingItems.length;
              return { ...item, items: [...existingItems, newItem] };
            }
            if (item.items) {
              return { ...item, items: updateParent(item.items) };
            }
            return item;
          });
        };
        return { ...q, items: updateParent(q.items) };
      } else {
        // Add to root
        newItem.order = q.items.length;
        return { ...q, items: [...q.items, newItem] };
      }
    });

    return id;
  }, [autoGenerateIds, updateQuestionnaire]);

  const updateItem = useCallback((id: string, updates: Partial<QuestionnaireItemBuilder>) => {
    updateQuestionnaire(q => ({
      ...q,
      items: updateItemInTree(q.items, id, updates),
    }));
  }, [updateQuestionnaire]);

  const removeItem = useCallback((id: string) => {
    updateQuestionnaire(q => ({
      ...q,
      items: reorderItems(removeItemFromTree(q.items, id)),
    }));
  }, [updateQuestionnaire]);

  const duplicateItem = useCallback((id: string): string => {
    const newId = generateId();
    
    updateQuestionnaire(q => {
      const original = findItemById(q.items, id);
      if (!original) return q;

      const duplicate: QuestionnaireItemBuilder = {
        ...JSON.parse(JSON.stringify(original)),
        id: newId,
        text: `${original.text} (kopie)`,
      };

      // Find parent and add after original
      const parent = findItemParent(q.items, id);
      if (parent) {
        const parentItems = parent.items ?? [];
        const originalIndex = parentItems.findIndex(i => i.id === id);
        const newItems = [...parentItems];
        newItems.splice(originalIndex + 1, 0, duplicate);
        return {
          ...q,
          items: updateItemInTree(q.items, parent.id, { items: reorderItems(newItems) }),
        };
      } else {
        const originalIndex = q.items.findIndex(i => i.id === id);
        const newItems = [...q.items];
        newItems.splice(originalIndex + 1, 0, duplicate);
        return { ...q, items: reorderItems(newItems) };
      }
    });

    return newId;
  }, [updateQuestionnaire]);

  // ============================================
  // Item ordering
  // ============================================

  const moveItem = useCallback((id: string, direction: 'up' | 'down') => {
    updateQuestionnaire(q => {
      const moveInArray = (items: QuestionnaireItemBuilder[]): QuestionnaireItemBuilder[] => {
        const index = items.findIndex(i => i.id === id);
        if (index === -1) {
          // Check nested items
          return items.map(item => {
            if (item.items) {
              return { ...item, items: moveInArray(item.items) };
            }
            return item;
          });
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= items.length) return items;

        const newItems = [...items];
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        return reorderItems(newItems);
      };

      return { ...q, items: moveInArray(q.items) };
    });
  }, [updateQuestionnaire]);

  const moveItemTo = useCallback((id: string, newIndex: number, newParentId?: string) => {
    updateQuestionnaire(q => {
      // Remove from current location
      const item = findItemById(q.items, id);
      if (!item) return q;

      let newItems = removeItemFromTree(q.items, id);

      // Add to new location
      if (newParentId) {
        newItems = updateItemInTree(newItems, newParentId, {
          items: (() => {
            const parent = findItemById(newItems, newParentId);
            const parentItems = [...(parent?.items ?? [])];
            parentItems.splice(newIndex, 0, item);
            return reorderItems(parentItems);
          })(),
        });
      } else {
        newItems.splice(newIndex, 0, item);
        newItems = reorderItems(newItems);
      }

      return { ...q, items: newItems };
    });
  }, [updateQuestionnaire]);

  // ============================================
  // Bulk operations
  // ============================================

  const addItems = useCallback((items: Partial<QuestionnaireItemBuilder>[]): string[] => {
    return items.map(item => addItem(item));
  }, [addItem]);

  const removeItems = useCallback((ids: string[]) => {
    updateQuestionnaire(q => {
      let items = q.items;
      for (const id of ids) {
        items = removeItemFromTree(items, id);
      }
      return { ...q, items: reorderItems(items) };
    });
  }, [updateQuestionnaire]);

  // ============================================
  // Answer options
  // ============================================

  const addOption = useCallback((itemId: string, option: Partial<AnswerOption>): string => {
    const optionId = option.id || generateOptionId();
    
    updateQuestionnaire(q => ({
      ...q,
      items: updateItemInTree(q.items, itemId, {
        options: [
          ...(findItemById(q.items, itemId)?.options ?? []),
          {
            id: optionId,
            text: option.text ?? '',
            value: option.value ?? '',
            score: option.score,
            coding: option.coding,
          },
        ],
      }),
    }));

    return optionId;
  }, [updateQuestionnaire]);

  const updateOption = useCallback((
    itemId: string,
    optionId: string,
    updates: Partial<AnswerOption>
  ) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      if (!item?.options) return q;

      return {
        ...q,
        items: updateItemInTree(q.items, itemId, {
          options: item.options.map(opt =>
            opt.id === optionId ? { ...opt, ...updates } : opt
          ),
        }),
      };
    });
  }, [updateQuestionnaire]);

  const removeOption = useCallback((itemId: string, optionId: string) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      if (!item?.options) return q;

      return {
        ...q,
        items: updateItemInTree(q.items, itemId, {
          options: item.options.filter(opt => opt.id !== optionId),
        }),
      };
    });
  }, [updateQuestionnaire]);

  const reorderOptions = useCallback((itemId: string, optionIds: string[]) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      if (!item?.options) return q;

      const optionMap = new Map(item.options.map(opt => [opt.id, opt]));
      const reordered = optionIds
        .map(id => optionMap.get(id))
        .filter((opt): opt is AnswerOption => opt !== undefined);

      return {
        ...q,
        items: updateItemInTree(q.items, itemId, { options: reordered }),
      };
    });
  }, [updateQuestionnaire]);

  // ============================================
  // Conditional logic
  // ============================================

  const addEnableWhen = useCallback((itemId: string, rule: ConditionalRule) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      return {
        ...q,
        items: updateItemInTree(q.items, itemId, {
          enableWhen: [...(item?.enableWhen ?? []), rule],
        }),
      };
    });
  }, [updateQuestionnaire]);

  const updateEnableWhen = useCallback((itemId: string, index: number, rule: ConditionalRule) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      if (!item?.enableWhen) return q;

      const newRules = [...item.enableWhen];
      newRules[index] = rule;

      return {
        ...q,
        items: updateItemInTree(q.items, itemId, { enableWhen: newRules }),
      };
    });
  }, [updateQuestionnaire]);

  const removeEnableWhen = useCallback((itemId: string, index: number) => {
    updateQuestionnaire(q => {
      const item = findItemById(q.items, itemId);
      if (!item?.enableWhen) return q;

      return {
        ...q,
        items: updateItemInTree(q.items, itemId, {
          enableWhen: item.enableWhen.filter((_, i) => i !== index),
        }),
      };
    });
  }, [updateQuestionnaire]);

  // ============================================
  // Validation
  // ============================================

  const validate = useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (!questionnaire.name.trim()) {
      errors.push({ path: 'name', message: 'Name is required' });
    }
    if (!questionnaire.title.trim()) {
      errors.push({ path: 'title', message: 'Title is required' });
    }
    if (questionnaire.items.length === 0) {
      errors.push({ path: 'items', message: 'At least one question is required' });
    }

    const validateItem = (item: QuestionnaireItemBuilder, path: string) => {
      if (!item.id.trim()) {
        errors.push({ path: `${path}.id`, message: 'Item ID is required', itemId: item.id });
      }
      if (!item.text.trim() && item.type !== 'display') {
        errors.push({ path: `${path}.text`, message: 'Question text is required', itemId: item.id });
      }
      if ((item.type === 'choice' || item.type === 'multi-choice') && (!item.options || item.options.length < 2)) {
        errors.push({ path: `${path}.options`, message: 'At least 2 options are required', itemId: item.id });
      }
      
      // Validate nested items
      item.items?.forEach((child, i) => validateItem(child, `${path}.items[${i}]`));
    };

    questionnaire.items.forEach((item, i) => validateItem(item, `items[${i}]`));

    // Validate score config if enabled
    if (questionnaire.scoreConfig?.enabled) {
      if (questionnaire.scoreConfig.ranges.length === 0) {
        errors.push({ path: 'scoreConfig.ranges', message: 'At least one score range is required' });
      }
    }

    setValidationErrors(errors);
    return errors;
  }, [questionnaire]);

  const isValid = useMemo(() => validationErrors.length === 0, [validationErrors]);

  // ============================================
  // Score configuration
  // ============================================

  const setScoreConfig = useCallback((config: ScoreConfiguration | undefined) => {
    updateQuestionnaire(q => ({ ...q, scoreConfig: config }));
  }, [updateQuestionnaire]);

  // ============================================
  // FHIR conversion
  // ============================================

  const toFHIR = useCallback((): FHIRQuestionnaire => {
    const fhir: FHIRQuestionnaire = {
      resourceType: 'Questionnaire',
      id: questionnaire.id,
      name: questionnaire.name,
      title: questionnaire.title,
      description: questionnaire.description,
      status: questionnaire.status,
      version: questionnaire.version,
      date: questionnaire.date ?? new Date().toISOString(),
      publisher: questionnaire.publisher,
      subjectType: (questionnaire.subjectType ?? ['Patient']) as import('@medplum/fhirtypes').Questionnaire['subjectType'],
      item: questionnaire.items.map(itemToFHIR),
    };

    // Add score configuration as extension
    if (questionnaire.scoreConfig?.enabled) {
      fhir.extension = fhir.extension ?? [];
      fhir.extension.push({
        url: 'https://healthtalk.ai/fhir/StructureDefinition/questionnaire-scoring',
        valueString: JSON.stringify(questionnaire.scoreConfig),
      });
    }

    // Add LOINC code
    if (questionnaire.loincCode) {
      fhir.code = [{
        system: 'http://loinc.org',
        code: questionnaire.loincCode,
      }];
    }

    return fhir;
  }, [questionnaire]);

  const fromFHIR = useCallback((fhir: FHIRQuestionnaire) => {
    const builder: QuestionnaireBuilder = {
      id: fhir.id,
      name: fhir.name ?? '',
      title: fhir.title ?? '',
      description: fhir.description,
      status: fhir.status as QuestionnaireBuilder['status'],
      version: fhir.version,
      date: fhir.date,
      publisher: fhir.publisher,
      items: fhir.item?.map((item, i) => fhirToItem(item, i)) ?? [],
      languages: ['nl'], // Default, could be extracted from meta
      primaryLanguage: 'nl',
      subjectType: fhir.subjectType,
      loincCode: fhir.code?.[0]?.code,
    };

    // Extract score config from extension
    const scoreExt = fhir.extension?.find(
      e => e.url === 'https://healthtalk.ai/fhir/StructureDefinition/questionnaire-scoring'
    );
    if (scoreExt?.valueString) {
      try {
        builder.scoreConfig = JSON.parse(scoreExt.valueString);
      } catch {
        // Invalid JSON, ignore
      }
    }

    setQuestionnaireState(builder);
    setIsDirty(false);
  }, []);

  // ============================================
  // Reset
  // ============================================

  const reset = useCallback(() => {
    setQuestionnaireState(initialQuestionnaire ?? createDefaultQuestionnaire());
    setIsDirty(false);
    setValidationErrors([]);
  }, [initialQuestionnaire]);

  const setQuestionnaire = useCallback((q: QuestionnaireBuilder) => {
    setQuestionnaireState(q);
    setIsDirty(false);
  }, []);

  return {
    questionnaire,
    items: questionnaire.items,
    isDirty,
    validationErrors,
    
    setName,
    setTitle,
    setDescription,
    setStatus,
    setTags,
    setLanguages,
    setPrimaryLanguage,
    setLoincCode,
    
    addItem,
    updateItem,
    removeItem,
    duplicateItem,
    
    moveItem,
    moveItemTo,
    
    addItems,
    removeItems,
    
    addOption,
    updateOption,
    removeOption,
    reorderOptions,
    
    addEnableWhen,
    updateEnableWhen,
    removeEnableWhen,
    
    validate,
    isValid,
    
    scoreConfig: questionnaire.scoreConfig,
    setScoreConfig,
    
    toFHIR,
    fromFHIR,
    
    reset,
    setQuestionnaire,
  };
}
