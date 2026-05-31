/**
 * The narrating voices offered to the user. The first entry is the default.
 * IDs are ElevenLabs library voice IDs (not secrets — public identifiers).
 * This list is the single source of truth: the client renders it as the
 * voice picker, and the server validates incoming voiceId values against it.
 */
export const VOICES = [
    { id: 's3TPKV1kjDlVtZbl4Ksh', label: 'Adam', description: 'Warm, steady narration' },
    { id: 'lcMyyd2HUfFzxdCaC4Ta', label: 'Lucy', description: 'Bright, expressive tone' },
    { id: 'giAoKpl5weRTCJK7uB9b', label: 'Owen', description: 'Resonant, measured cadence' },
    { id: 'Tfv2PGiTliSQ4XSXrJmA', label: 'Katherine', description: 'Refined, articulate delivery' },
];
/** Default voice ID used when no valid selection is supplied. */
export const DEFAULT_VOICE_ID = VOICES[0].id;
/** True when the given id matches one of the offered voices. */
export const isValidVoiceId = (id) => typeof id === 'string' && VOICES.some((v) => v.id === id);
//# sourceMappingURL=voices.js.map