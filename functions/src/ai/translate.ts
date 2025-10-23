import { openai } from '@ai-sdk/openai';
import { generateObject, tool } from 'ai';
import { z } from 'zod';

const InputSchema: z.ZodTypeAny = z.object({
  targetLang: z.string(),
  text: z.string(),
  audienceRegion: z.string().optional(),
});

const OutputSchema: z.ZodTypeAny = z.object({
  translation: z.string().default(''),
  noTranslationNeeded: z.boolean().default(false),
  detectedSourceLang: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  culturalContextHints: z.array(z.string()).default([]),
  slangExplanations: z
    .array(z.object({ phrase: z.string(), explanation: z.string() }))
    .default([]),
});

export const translateTool = tool({
  description: 'Translate with cultural context and slang explanations; detect no-op',
  inputSchema: InputSchema as any,
  outputSchema: OutputSchema as any,
  execute: async (input: any) => {
    const { targetLang, text } = input as {
      targetLang: string;
      text: string;
    };

    const { object } = await generateObject({
      model: openai(process.env.TRANSLATION_MODEL || 'gpt-4o-mini') as any,
      schema: OutputSchema as any,
      system:
        'You are a professional translator for business chat. Be precise, culturally aware, concise. Preserve meaning, tone, code blocks, emojis, links.',
      prompt:
        `Detect the source language of the following text. If it already matches the target ` +
        `language (${targetLang}), set noTranslationNeeded=true and return an empty translation. ` +
        `Otherwise, translate to ${targetLang}. Include 1-3 cultural context hints and explain any slang/idioms.\n\n` +
        `Text:\n${text}`,
    });

    return object;
  },
});



