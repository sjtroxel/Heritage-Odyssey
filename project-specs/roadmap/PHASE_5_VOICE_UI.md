# Phase 5 Plan: Voice & UI

## 1. Objective
Integrate voice-to-text (STT) and text-to-voice (TTS) capabilities to create an immersive, narrative-driven user experience. Develop a mobile-first React 19 frontend that allows users to interact with the Heritage Odyssey agent swarm via voice or text and receive high-quality, streamed audio narratives.

## 2. Dependencies & Setup
- **Backend (Server):**
  - \`openai\`: For Whisper-1 STT.
  - \`elevenlabs\`: For TTS streaming.
  - \`multer\`: For handling audio file uploads.
- **Frontend (Client):**
  - \`tailwindcss\`: v4 (CSS-first \`@theme {}\`).
  - \`lucide-react\`: For iconography.
- **Environment Variables:**
  - \`OPENAI_API_KEY\`: Required for Whisper (Note: already exists from Phase 3).
  - \`ELEVENLABS_API_KEY\`: Required for TTS.
  - \`ELEVENLABS_VOICE_ID\`: Required for selecting the specific narrator voice.

## 3. Express API Endpoints

### A. \`POST /api/voice/transcribe\`
- **Purpose:** Receives audio data from the client and returns transcribed text.
- **Implementation:**
  - Uses \`multer\` to handle multipart/form-data (audio file).
  - Calls \`openai.audio.transcriptions.create\` using the \`whisper-1\` model.
  - Returns \`{ text: string }\`.

### B. \`POST /api/narrative/stream\`
- **Purpose:** Orchestrates the full pipeline: User Input -> LangGraph Swarm -> ElevenLabs TTS Stream -> Browser.
- **Implementation:**
  - Accepts \`{ query: string }\`.
  - Calls \`narrativeService.generateNarrative(query)\` (from Phase 3) to get the \`finalScript\`.
  - Passes \`finalScript\` to \`elevenlabs.generate({ stream: true, ... })\`.
  - Pipes the ElevenLabs ReadableStream directly to the Express \`res\` object with \`Content-Type: audio/mpeg\`.

## 4. React Component Tree

\`\`\`text
App
└── Layout (Mobile-first container, Tailwind v4)
    ├── Header (Logo/Title)
    ├── NarrativeDisplay (Scrollable area for text history/subtitles)
    │   └── NarrativeCard (Displays the current or historical narrative text)
    ├── AudioVisualizer (Visual feedback during playback/recording)
    └── InteractionLayer (Sticky bottom container)
        ├── VoiceInputButton (MediaRecorder logic, press-to-talk or toggle)
        ├── TextInput (Fallback text field)
        └── PlaybackControls (Play/Pause for active stream; seek available only after full audio has buffered.)
\`\`\`

## 5. Data Flow: Input to Output

1.  **Capture:** User clicks \`VoiceInputButton\`. Browser \`MediaRecorder\` API captures audio as a Blob.
2.  **Transcribe:** Blob is sent to \`POST /api/voice/transcribe\`. Server returns text.
3.  **Process:** Client sends transcribed text (or manual text input) to \`POST /api/narrative/stream\`.
4.  **Generate:** Server invokes LangGraph swarm. Swarm returns the narrative script.
5.  **Synthesize:** Server sends script to ElevenLabs. ElevenLabs returns a streaming audio response.
6.  **Playback:** Server pipes the stream to the Client. The client points an audio element's src attribute at the /api/narrative/stream endpoint URL, which causes the browser to open a streaming HTTP connection.

## 6. TypeScript Interfaces

\`\`\`typescript
// shared/types.d.ts (Phase 4 Additions)

export interface TranscriptionResponse {
  text: string;
}

export interface StreamNarrativeRequest {
  query: string;
}

export type InteractionMode = 'idle' | 'recording' | 'processing' | 'playing';

export interface NarrativeState {
  id: string;
  query: string;
  text: string | null;
  // audioUrl points to the /api/narrative/stream endpoint; the browser audio element opens it as a streaming connection.
  audioUrl: string | null;
  status: InteractionMode;
}
\`\`\`

## 7. Key Files to Implement
- **\`server/src/services/voiceService.ts\`**: Handles STT (Whisper) and TTS (ElevenLabs) SDK calls.
- **\`server/src/routes/voiceRoutes.ts\`**: Defines the transcription and streaming endpoints.
- **\`client/src/hooks/useMediaRecorder.ts\`**: Custom hook for browser microphone management. It must detect the browser's supported MIME type (e.g., WebM vs. AAC in MP4 for iOS Safari) using \`MediaRecorder.isTypeSupported\` and pass this format to the transcription request.
- **\`client/src/hooks/useAudioStream.ts\`**: Custom hook for handling the ReadableStream from the backend.
- **\`client/src/components/InteractionLayer.tsx\`**: Main UI for voice/text input.
- **\`server/tests/routes/voiceRoutes.test.ts\`**: Supertest integration tests for \`POST /api/voice/transcribe\` with a mocked \`openai.audio.transcriptions.create\` and \`POST /api/narrative/stream\` with mocked \`narrativeService\` and \`elevenlabs\` calls.

## 8. Error Handling
- **STT Failures:** If Whisper fails (e.g., poor audio quality), notify the user and suggest using text input.
- **TTS Stream Interruptions:** If the ElevenLabs stream breaks, provide a "Retry Audio" button that re-requests the stream for the already-generated text.
- **Mic Permissions:** Detect \`NotAllowedError\` from \`getUserMedia\` and display a clear UI guide on how to enable permissions.
- **Network Latency:** Show "Researching historical patterns..." or "Preparing your narrative..." status messages to manage user expectations during agent/TTS generation.
- **iOS MediaRecorder Compatibility:** If the browser does not support WebM, fall back to AAC/MP4. If \`MediaRecorder\` is not supported at all, disable the \`VoiceInputButton\` and show a message directing the user to text input.

## 9. Verification (Done Criteria)
- [ ] User can successfully record audio and see accurate transcription in the UI.
- [ ] The full flow (Voice Input -> Agent -> Streamed Audio) completes in under 5 seconds (perceived latency for first chunk).
- [ ] UI is fully responsive and usable on a 375px wide mobile viewport.
- [ ] Audio playback continues smoothly without buffering pauses (streaming verified).
- [ ] "Text fallback" allows the entire system to work without a microphone.
- [ ] Unit tests for \`voiceService\` (mocking ElevenLabs/OpenAI) and frontend components pass.
- [ ] Linting and type-checking pass across the monorepo.
- [ ] \`POST /api/voice/transcribe\` returns status 200 with shape \`{ text: string }\` when given a valid audio upload.
- [ ] \`POST /api/narrative/stream\` returns status 200 with \`Content-Type: audio/mpeg\`.
