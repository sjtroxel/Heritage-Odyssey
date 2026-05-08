# Phase 5 Implementation Plan: Voice & UI

This document outlines the specific implementation steps for Phase 5: Voice & UI. This phase adds STT (Speech-to-Text), TTS (Text-to-Speech) streaming, and the mobile-first React frontend.

## ElevenLabs SDK Findings (May 2026)
As of the current version (`1.59.0`), the following call signatures are verified:
- **Client Initialization:** `const client = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY })`
- **Streaming Method:** `client.textToSpeech.convertAsStream(voiceId, { text: string, model_id: string, ... })`
- **Response Type:** Returns `Promise<stream.Readable>`, which can be piped directly to Express `res`.
- **Note:** The top-level `client.generate()` is deprecated and should be avoided in favor of `client.textToSpeech.convertAsStream()`.

---

## Step 1 — Voice Service (Backend) [x]
- **Files to Create:**
  - `server/src/services/voiceService.ts`
- **Logic:**
  - Implement `transcribeAudio(fileBuffer: Buffer, mimeType: string): Promise<string>` using `openai.audio.transcriptions.create`.
  - Implement `streamNarrative(text: string): Promise<stream.Readable>` using `elevenlabs.textToSpeech.convertAsStream`.
  - Use `ELEVENLABS_VOICE_ID` and `eleven_multilingual_v2` (or latest) from env/config.

**STOP HERE — await review**

## Step 2 — Routes & Multer Setup (Backend) [x]
- **Files to Create:**
  - `server/src/routes/voiceRoutes.ts`
- **Files to Modify:**
  - `server/src/app.ts` (Register `voiceRoutes`)
- **Logic:**
  - Configure `multer` with memory storage for temporary audio uploads.
  - Define `POST /api/voice/transcribe` endpoint.
  - Define `POST /api/narrative/stream` endpoint.

**STOP HERE — await review**

## Step 3 — Narrative Streaming Integration (Backend) [x]
- **Files to Modify:**
  - `server/src/routes/voiceRoutes.ts`
- **Logic:**
  - In `POST /api/narrative/stream`:
    1. Call `narrativeService.generateNarrative(query)`.
    2. Pass the resulting `finalScript` to `voiceService.streamNarrative()`.
    3. Set `Content-Type: audio/mpeg` and pipe the stream to `res`.
  - Handle errors (e.g., agent swarm failures) by returning JSON errors before the stream starts.

**STOP HERE — await review**

## Step 4 — MediaRecorder Hook (Frontend)
- **Files to Create:**
  - `client/src/hooks/useMediaRecorder.ts`
- **Logic:**
  - Manage microphone permissions.
  - Capture audio blobs using `MediaRecorder`.
  - Implement MIME type detection (`isTypeSupported`) for iOS (AAC/MP4) vs Chrome/Android (WebM).
  - Provide `startRecording`, `stopRecording`, and `isRecording` state.

**STOP HERE — await review**

## Step 5 — Audio Stream Hook (Frontend) [x]
- **Files to Create:**
  - `client/src/hooks/useAudioStream.ts`
- **Logic:**
  - Handle playback of the streaming audio from `/api/narrative/stream`.
  - Use the `HTMLAudioElement` or `Web Audio API` for low-latency playback.
  - Provide `playStream(query: string)` which triggers the full backend pipeline.

**STOP HERE — await review**

## Step 6 — UI Components (Interaction Layer)
- **Files to Create:**
  - `client/src/components/InteractionLayer.tsx`
  - `client/src/components/AudioVisualizer.tsx`
- **Files to Modify:**
  - `client/src/App.tsx`
- **Logic:**
  - Build the "Press-to-Talk" button and text input fallback.
  - Implement the mobile-first (375px) layout using Tailwind v4.
  - Add simple visual feedback (e.g., CSS pulse) during recording/playing.

**STOP HERE — await review**

## Step 7 — Integration Testing & Final Polish
- **Files to Create:**
  - `server/tests/routes/voiceRoutes.test.ts`
- **Actions:**
  - Test transcription with a mock audio file.
  - Test streaming endpoint with mocked service calls.
  - Final validation: `lint + typecheck + tests`.

**STOP HERE — await review**
