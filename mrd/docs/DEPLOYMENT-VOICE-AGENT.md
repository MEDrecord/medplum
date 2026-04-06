# Voice Agent API Deployment Guide

> **DevOps Task**: Deploy the ElevenLabs Voice Agent API endpoints to production.

## Context

De ElevenLabs Voice Agent heeft API endpoints nodig om vragenlijsten op te halen en antwoorden op te slaan. Deze endpoints staan klaar in `mrd/apps/medrecord/app/api/agent/`.

### Huidige Situatie

| Project | Root Directory | Framework | Kan API routes? |
|---------|---------------|-----------|-----------------|
| medplum-app | `packages/app` | Vite (React SPA) | **Nee** |
| medplum-server | ? | ? | ? |

De medplum-app is een Vite React SPA - geen Next.js. API routes zijn niet mogelijk in dit project.

---

## Deployment Opties

### Optie A: Nieuw Vercel Project (Aanbevolen)

Maak een apart Vercel project voor de Voice Agent API.

**Stappen:**

1. Ga naar `vercel.com/new`
2. Selecteer repo: `MEDrecord/medplum`
3. Configureer:

| Setting | Waarde |
|---------|--------|
| Root Directory | `mrd/apps/medrecord` |
| Framework | Next.js (auto-detect) |
| Build Command | `npm run build` |
| Output Directory | `.next` |

4. Deploy
5. Voeg domain toe: `agent.healthtalk.ai` of `api.healthtalk.ai`

**Environment Variables (kopieer van medplum-app of voeg toe):**

```
# ElevenLabs (optioneel voor mock mode)
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
ELEVENLABS_WEBHOOK_SECRET=... (zelf genereren)

# MedPlum (optioneel voor mock mode)
MEDPLUM_BASE_URL=https://medplumapivercal.healthtalk.ai
MEDPLUM_CLIENT_ID=... (aanmaken in MedPlum)
MEDPLUM_CLIENT_SECRET=...

# Redis (via Upstash integratie of handmatig)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...

# Security
MAGIC_LINK_SECRET=... (zelf genereren, min 32 chars)
WEBHOOK_SECRET=... (zelf genereren)
```

### Optie B: Voeg Serverless Functions toe aan Vite Project

Niet aanbevolen. Vite + Vercel Serverless is mogelijk maar complexer.

### Optie C: Gebruik medplum-server Project

Als medplum-server een Next.js project is, kunnen de endpoints daar toegevoegd worden. Check de Root Directory van dat project.

### Optie D: Cloudflare Workers / AWS Lambda

Voor meer controle, deploy de endpoints als standalone serverless functions buiten Vercel.

---

## API Endpoints

Na deployment zijn deze endpoints beschikbaar:

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/agent/questionnaire` | POST | Haal vragenlijst op voor task |
| `/api/agent/answer` | POST | Sla antwoord op |
| `/api/agent/complete` | POST | Markeer vragenlijst als voltooid |
| `/api/webhook/twilio/whatsapp` | POST | Ontvang WhatsApp berichten |
| `/api/webhook/twilio/status` | POST | Twilio delivery status |
| `/api/webhook/medplum` | POST | MedPlum subscription events |

---

## ElevenLabs Agent Configuratie

Na deployment, update de tool URLs in ElevenLabs:

1. Ga naar `elevenlabs.io` → Agents → "Vragenlijsten aan patient" → Tools
2. Update alle 3 tools met het nieuwe domain:

| Tool | URL |
|------|-----|
| get_questionnaire | `https://[NIEUW-DOMAIN]/api/agent/questionnaire` |
| save_answer | `https://[NIEUW-DOMAIN]/api/agent/answer` |
| complete_questionnaire | `https://[NIEUW-DOMAIN]/api/agent/complete` |

---

## Twilio Webhook URLs

Update in Twilio Console → Messaging → Try it out → Sandbox settings:

| Setting | URL |
|---------|-----|
| When a message comes in | `https://[NIEUW-DOMAIN]/api/webhook/twilio/whatsapp` |
| Status callback URL | `https://[NIEUW-DOMAIN]/api/webhook/twilio/status` |

---

## Mock Mode

De endpoints werken in **mock mode** zonder MedPlum/Redis credentials:
- Returnt mock vragenlijst met 5 vragen
- Slaat antwoorden op in geheugen (niet persistent)
- Handig voor testen

Om mock mode uit te schakelen, configureer alle env vars.

---

## Test na Deployment

```bash
# Test questionnaire endpoint
curl -X POST https://[DOMAIN]/api/agent/questionnaire \
  -H "Content-Type: application/json" \
  -d '{"task_id": "test-123"}'

# Verwachte response (mock mode):
{
  "success": true,
  "mock_mode": true,
  "task_id": "test-123",
  "patient_name": "Test Patient",
  "questionnaire": { ... }
}
```

---

## Gerelateerde Documentatie

- Code locatie: `mrd/apps/medrecord/app/api/agent/`
- Lib files: `mrd/apps/medrecord/lib/`
- ElevenLabs Agent: "Vragenlijsten aan patient" in ElevenLabs console
