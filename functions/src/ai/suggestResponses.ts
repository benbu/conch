/**
 * Response Suggestions AI Function
 * Generates short reply suggestions based on recent conversation context
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { Message } from '../types';

const SuggestionsSchema = z.object({
  suggestions: z
    .array(
      z
        .string()
        .min(1)
        .max(160)
        .describe('A concise reply a user could send next')
    )
    .min(1)
    .max(8),
});

export async function suggestResponses(
  conversationId: string,
  userId: string,
  options?: { lastMessagesN?: number; model?: string }
): Promise<string[]> {
  const lastMessagesN = Math.max(3, Math.min(50, options?.lastMessagesN ?? 10));

  // Fetch the latest N messages
  const messages = await fetchRecentMessages(conversationId, lastMessagesN);
  if (messages.length === 0) return [];

  const messagesText = messages
    .map((m) => {
      const ts = m.createdAt instanceof Date ? m.createdAt.toISOString() : new Date(m.createdAt).toISOString();
      return `[${ts}] ${m.senderId === userId ? 'Me' : `User ${m.senderId}`}: ${m.text}`;
    })
    .join('\n');

  const systemPrompt = `You suggest helpful, friendly, and concise replies for a team chat.
Constraints:
- Keep each suggestion under 150 characters
- Be contextually relevant to the most recent messages
- Avoid committing to decisions; prefer clarifying questions when needed
- Keep tone professional and warm
- No emojis unless clearly appropriate
- Provide 3–5 distinct suggestions
`;

  const { object } = (await generateObject({
    model: openai(options?.model || process.env.SUGGESTION_MODEL || 'gpt-4o-mini') as any,
    schema: SuggestionsSchema as any,
    prompt: `${systemPrompt}\n\nConversation (most recent last):\n${messagesText}\n\nReturn JSON with { suggestions: string[] }`,
  } as any)) as any;

  const list: string[] = Array.isArray(object?.suggestions)
    ? (object.suggestions as string[]).slice(0, 8)
    : [];

  return list;
}

async function fetchRecentMessages(
  conversationId: string,
  limit: number
): Promise<Message[]> {
  const snapshot = await admin
    .firestore()
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return (
    snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() ?? new Date(),
    })) as Message[]
  ).reverse();
}


