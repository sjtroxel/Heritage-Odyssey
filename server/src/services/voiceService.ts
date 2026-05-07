import OpenAI from 'openai';
import { ElevenLabsClient } from 'elevenlabs';
import { env } from '../config/env.js';
import type stream from 'stream';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const elevenlabs = new ElevenLabsClient({
  apiKey: env.ELEVENLABS_API_KEY,
});

/**
 * Transcribes audio from a buffer using OpenAI Whisper.
 */
export async function transcribeAudio(fileBuffer: Buffer, mimeType: string): Promise<string> {
  // Convert buffer to a file-like object for the OpenAI SDK
  const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
  const file = await OpenAI.toFile(fileBuffer, `audio.${extension}`, {
    type: mimeType,
  });

  const response = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
  });

  return response.text;
}

/**
 * Streams narrative text to speech using ElevenLabs.
 */
export async function streamNarrative(text: string): Promise<stream.Readable> {
  const audioStream = await elevenlabs.textToSpeech.convertAsStream(env.ELEVENLABS_VOICE_ID, {
    text,
    model_id: 'eleven_multilingual_v2',
    output_format: 'mp3_44100_128',
  });

  // The ElevenLabs SDK returns a readable stream that can be piped to Express res
  return audioStream as unknown as stream.Readable;
}
