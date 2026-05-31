export interface VoiceOption {
  id: string;
  /** Display name shown in the picker. */
  label: string;
  /** Short registry-flavored descriptor shown beneath the label. */
  description: string;
}
/**
 * The narrating voices offered to the user. The first entry is the default.
 * IDs are ElevenLabs library voice IDs (not secrets — public identifiers).
 * This list is the single source of truth: the client renders it as the
 * voice picker, and the server validates incoming voiceId values against it.
 */
export declare const VOICES: readonly [
  {
    readonly id: 's3TPKV1kjDlVtZbl4Ksh';
    readonly label: 'Adam';
    readonly description: 'Warm, steady narration';
  },
  {
    readonly id: 'lcMyyd2HUfFzxdCaC4Ta';
    readonly label: 'Lucy';
    readonly description: 'Bright, expressive tone';
  },
  {
    readonly id: 'giAoKpl5weRTCJK7uB9b';
    readonly label: 'Owen';
    readonly description: 'Resonant, measured cadence';
  },
  {
    readonly id: 'Tfv2PGiTliSQ4XSXrJmA';
    readonly label: 'Katherine';
    readonly description: 'Refined, articulate delivery';
  },
];
/** Default voice ID used when no valid selection is supplied. */
export declare const DEFAULT_VOICE_ID: 's3TPKV1kjDlVtZbl4Ksh';
/** True when the given id matches one of the offered voices. */
export declare const isValidVoiceId: (id: unknown) => id is string;
//# sourceMappingURL=voices.d.ts.map
