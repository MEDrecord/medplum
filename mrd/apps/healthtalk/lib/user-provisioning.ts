/**
 * User Provisioning for HealthTalk
 * 
 * Automatically creates Practitioner profiles in Medplum when users
 * authenticate via HealthTalk Gateway.
 * 
 * Flow:
 * 1. User authenticates via Gateway (Azure B2C)
 * 2. Gateway returns user info (id, email, name, role, tenantId)
 * 3. This module checks if Practitioner exists in Medplum
 * 4. If not, creates a new Practitioner linked to the Gateway user
 */

import { MedplumClient } from '@medplum/core';
import type { Practitioner, Reference } from '@medplum/fhirtypes';

// Gateway user data structure
export interface GatewayUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  tenantName?: string;
}

// Provisioning result
export interface ProvisioningResult {
  success: boolean;
  practitioner?: Practitioner;
  created: boolean;
  error?: string;
}

/**
 * Get or create Practitioner for a Gateway user
 * 
 * This is idempotent - if Practitioner already exists, returns it.
 * Uses the Gateway user ID as the external identifier to link accounts.
 * 
 * @param client - Medplum client (already scoped to tenant)
 * @param user - Gateway user data
 * @returns ProvisioningResult with Practitioner and creation status
 */
export async function getOrCreatePractitioner(
  client: MedplumClient,
  user: GatewayUser
): Promise<ProvisioningResult> {
  try {
    // Search for existing Practitioner by Gateway user ID
    const existingPractitioners = await client.searchResources('Practitioner', {
      identifier: `https://gateway.healthtalk.ai/users|${user.id}`,
    });

    if (existingPractitioners.length > 0) {
      // Practitioner already exists
      return {
        success: true,
        practitioner: existingPractitioners[0],
        created: false,
      };
    }

    // Parse name into given/family parts
    const nameParts = user.name.trim().split(/\s+/);
    const familyName = nameParts.length > 1 ? nameParts.pop()! : nameParts[0];
    const givenNames = nameParts.length > 0 ? nameParts : [user.name];

    // Create new Practitioner
    const newPractitioner: Practitioner = {
      resourceType: 'Practitioner',
      identifier: [
        {
          system: 'https://gateway.healthtalk.ai/users',
          value: user.id,
        },
        {
          system: 'email',
          value: user.email,
        },
      ],
      active: true,
      name: [
        {
          use: 'official',
          family: familyName,
          given: givenNames,
          text: user.name,
        },
      ],
      telecom: [
        {
          system: 'email',
          value: user.email,
          use: 'work',
        },
      ],
      // Extension to store Gateway metadata
      extension: [
        {
          url: 'https://gateway.healthtalk.ai/extensions/gateway-user',
          extension: [
            {
              url: 'userId',
              valueString: user.id,
            },
            {
              url: 'tenantId',
              valueString: user.tenantId,
            },
            {
              url: 'role',
              valueString: user.role,
            },
            {
              url: 'provisionedAt',
              valueDateTime: new Date().toISOString(),
            },
          ],
        },
      ],
    };

    const createdPractitioner = await client.createResource(newPractitioner);

    console.log(`[HealthTalk] Created Practitioner for Gateway user ${user.id}: ${createdPractitioner.id}`);

    return {
      success: true,
      practitioner: createdPractitioner,
      created: true,
    };
  } catch (error) {
    console.error('[HealthTalk] Failed to provision Practitioner:', error);
    return {
      success: false,
      created: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update existing Practitioner with latest Gateway user data
 * 
 * Call this periodically or on login to keep Practitioner data in sync.
 * 
 * @param client - Medplum client
 * @param practitioner - Existing Practitioner resource
 * @param user - Current Gateway user data
 * @returns Updated Practitioner
 */
export async function syncPractitionerWithGateway(
  client: MedplumClient,
  practitioner: Practitioner,
  user: GatewayUser
): Promise<Practitioner> {
  // Parse name
  const nameParts = user.name.trim().split(/\s+/);
  const familyName = nameParts.length > 1 ? nameParts.pop()! : nameParts[0];
  const givenNames = nameParts.length > 0 ? nameParts : [user.name];

  // Update name if changed
  const updatedPractitioner: Practitioner = {
    ...practitioner,
    name: [
      {
        use: 'official',
        family: familyName,
        given: givenNames,
        text: user.name,
      },
    ],
    // Update email if changed
    telecom: [
      {
        system: 'email',
        value: user.email,
        use: 'work',
      },
      // Keep other telecoms
      ...(practitioner.telecom?.filter(t => t.system !== 'email') ?? []),
    ],
  };

  return client.updateResource(updatedPractitioner);
}

/**
 * Get Practitioner reference for use in other resources
 * 
 * @param practitioner - Practitioner resource
 * @returns FHIR Reference to Practitioner
 */
export function getPractitionerReference(practitioner: Practitioner): Reference<Practitioner> {
  return {
    reference: `Practitioner/${practitioner.id}`,
    display: practitioner.name?.[0]?.text ?? practitioner.name?.[0]?.family,
  };
}

/**
 * Find Practitioner by Gateway user ID
 * 
 * @param client - Medplum client
 * @param gatewayUserId - Gateway user ID
 * @returns Practitioner or null if not found
 */
export async function findPractitionerByGatewayId(
  client: MedplumClient,
  gatewayUserId: string
): Promise<Practitioner | null> {
  const practitioners = await client.searchResources('Practitioner', {
    identifier: `https://gateway.healthtalk.ai/users|${gatewayUserId}`,
  });

  return practitioners.length > 0 ? practitioners[0] : null;
}
