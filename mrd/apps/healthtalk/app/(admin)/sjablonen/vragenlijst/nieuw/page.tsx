'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionnaireBuilder } from '@mrd/ui';
import type { QuestionnaireBuilder as QuestionnaireBuilderState } from '@mrd/shared';

/**
 * Page for creating a new questionnaire.
 * Uses the QuestionnaireBuilder component from @mrd/ui.
 */
export default function NieuweVragenlijstPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Initial questionnaire state
  const [questionnaire, setQuestionnaire] = useState<QuestionnaireBuilderState>({
    name: '',
    title: '',
    description: '',
    status: 'draft',
    items: [],
    languages: ['nl'],
    primaryLanguage: 'nl',
    tags: [],
  });

  // Save as draft
  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);

    try {
      // Validate
      const validationErrors: string[] = [];
      if (!questionnaire.name) validationErrors.push('Naam is verplicht');
      if (!questionnaire.title) validationErrors.push('Titel is verplicht');
      if (questionnaire.items.length === 0) validationErrors.push('Voeg minimaal één vraag toe');

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // TODO: Call API to save questionnaire
      // const response = await gateway.questionnaires.create(questionnaire);
      
      // For now, simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to template list
      router.push('/sjablonen');
    } catch (error) {
      setErrors(['Opslaan mislukt. Probeer het opnieuw.']);
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Publish questionnaire
  const handlePublish = async () => {
    setIsPublishing(true);
    setErrors([]);

    try {
      // Validate more strictly for publish
      const validationErrors: string[] = [];
      if (!questionnaire.name) validationErrors.push('Naam is verplicht');
      if (!questionnaire.title) validationErrors.push('Titel is verplicht');
      if (questionnaire.items.length === 0) validationErrors.push('Voeg minimaal één vraag toe');
      
      // Check all questions have text
      questionnaire.items.forEach((item, index) => {
        if (!item.text) {
          validationErrors.push(`Vraag ${index + 1} heeft geen tekst`);
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // TODO: Call API to publish questionnaire
      // const response = await gateway.questionnaires.create(questionnaire);
      // await gateway.questionnaires.publish(response.id);
      
      // For now, simulate publish
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to template list
      router.push('/sjablonen');
    } catch (error) {
      setErrors(['Publiceren mislukt. Probeer het opnieuw.']);
      console.error('Publish failed:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  // Cancel and go back
  const handleCancel = () => {
    router.push('/sjablonen');
  };

  return (
    <div className="h-[calc(100vh-4rem)]">
      <QuestionnaireBuilder
        questionnaire={questionnaire}
        onChange={setQuestionnaire}
        onSave={handleSave}
        onPublish={handlePublish}
        onCancel={handleCancel}
        isSaving={isSaving}
        isPublishing={isPublishing}
        errors={errors}
      />
    </div>
  );
}
