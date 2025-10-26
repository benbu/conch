/**
 * Thread Summary AI Function
 * Generates concise summaries of conversation threads
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as admin from 'firebase-admin';
import { AISummary, Message } from '../types';

export async function summarizeThread(
  conversationId: string,
  userId: string,
  options?: {
    messageLimit?: number;
    dateRange?: { start: Date; end: Date };
    model?: string;
  }
): Promise<AISummary> {
  console.log(`Summarizing thread ${conversationId} for user ${userId}`);

  // Fetch messages from Firestore
  const messages = await fetchMessages(conversationId, options);

  if (messages.length === 0) {
    throw new Error('No messages found in conversation');
  }

  // Resolve sender display names (prefer users.displayName, fallback to users.username, else 'someone')
  const uniqueSenderIds = Array.from(new Set(messages.map((m) => m.senderId)));
  const userRefs = uniqueSenderIds.map((id) => admin.firestore().collection('users').doc(id));

  let userDocs: any[] = [];
  try {
    // Use batched get if available
    userDocs = await (admin.firestore() as any).getAll(...userRefs);
  } catch {
    // Fallback to individual gets
    userDocs = await Promise.all(userRefs.map((ref) => ref.get()));
  }

  const nameById = new Map<string, string>();
  for (const doc of userDocs) {
    const data = doc?.data?.() ?? doc?.data; // support both shapes
    const displayName = (data && (data.displayName || data.username)) || 'someone';
    nameById.set(doc.id, displayName);
  }

  // Format messages for AI with resolved names; use 'you' for current user's messages
  const messagesText = messages
    .map((msg) => {
      const timestamp = msg.createdAt instanceof Date
        ? msg.createdAt.toISOString()
        : new Date(msg.createdAt).toISOString();
      const senderName = msg.senderId === userId ? 'you' : (nameById.get(msg.senderId) || 'someone');
      return `[${timestamp}] ${senderName}: ${msg.text}`;
    })
    .join('\n');

  // Generate summary using Vercel AI SDK
  const { text: summary } = await generateText({
    model: openai(options?.model || 'gpt-4o-mini') as any,
    prompt: `You are a helpful assistant that summarizes team conversations. 
    
Given the following conversation thread, provide a concise summary that:
1. Highlights the main topics discussed
2. Lists key decisions made
3. Identifies action items or next steps
4. Notes any unresolved questions

Keep the summary clear, actionable, and under 200 words.

Conversation:
${messagesText}

Summary:`,
  });

  // Store summary in Firestore
  const summaryData: Omit<AISummary, 'id'> = {
    conversationId,
    text: summary,
    createdAt: new Date(),
    sourceMessageIds: messages.map((m) => m.id),
  };

  const summaryRef = await admin
    .firestore()
    .collection('aiArtifacts')
    .doc(conversationId)
    .collection('summaries')
    .add(summaryData);

  return {
    id: summaryRef.id,
    ...summaryData,
  };
}

async function fetchMessages(
  conversationId: string,
  options?: {
    messageLimit?: number;
    dateRange?: { start: Date; end: Date };
  }
): Promise<Message[]> {
  let query = admin
    .firestore()
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .orderBy('createdAt', 'desc');

  // Apply date range filter if provided
  if (options?.dateRange) {
    query = query
      .where('createdAt', '>=', options.dateRange.start)
      .where('createdAt', '<=', options.dateRange.end);
  }

  // Apply message limit (default 100)
  const limit = options?.messageLimit ?? 100;
  query = query.limit(limit);

  const snapshot = await query.get();

  return (
    snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
      })) as Message[]
  ).reverse(); // Return in chronological order
}

