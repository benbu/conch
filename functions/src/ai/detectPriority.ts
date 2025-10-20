/**
 * Priority Detection AI Function
 * Identifies urgent or high-importance messages
 */

import * as admin from 'firebase-admin';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Message, AIPriority, PriorityMessage } from '../types';

const PriorityMessageSchema = z.object({
  messageId: z.string().describe('ID of the message'),
  score: z.number().min(0).max(10).describe('Priority score from 0-10'),
  reason: z.string().describe('Brief explanation of why this message is priority'),
});

const PriorityResponseSchema = z.object({
  priorityMessages: z.array(PriorityMessageSchema),
});

export async function detectPriority(
  conversationId: string,
  userId: string,
  options?: {
    messageLimit?: number;
    dateRange?: { start: Date; end: Date };
    minScore?: number;
  }
): Promise<AIPriority> {
  console.log(`Detecting priority messages in ${conversationId} for user ${userId}`);

  // Fetch messages from Firestore
  const messages = await fetchMessages(conversationId, options);

  if (messages.length === 0) {
    throw new Error('No messages found in conversation');
  }

  // Format messages for AI with IDs
  const messagesText = messages
    .map((msg) => {
      const timestamp = msg.createdAt instanceof Date 
        ? msg.createdAt.toISOString() 
        : new Date(msg.createdAt).toISOString();
      return `[ID: ${msg.id}] [${timestamp}] User ${msg.senderId}: ${msg.text}`;
    })
    .join('\n');

  // Detect priority messages using structured output
  const { object: priorityData } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: PriorityResponseSchema,
    prompt: `You are a helpful assistant that identifies urgent or high-priority messages in team conversations.

Analyze the following conversation and identify messages that are:
- Time-sensitive or urgent
- Critical for project success
- Blockers or issues requiring immediate attention
- Important decisions or announcements
- Direct questions requiring answers

For each priority message, provide:
- The message ID (from the [ID: ...] prefix)
- A priority score from 0-10 (10 being most urgent)
- A brief reason explaining the priority

Only flag messages with score >= 6.

Conversation:
${messagesText}

Identify priority messages:`,
  });

  // Filter by minimum score
  const minScore = options?.minScore ?? 6;
  const priorityMessages: PriorityMessage[] = priorityData.priorityMessages
    .filter((msg) => msg.score >= minScore)
    .map((msg) => ({
      messageId: msg.messageId,
      score: msg.score,
      reason: msg.reason,
    }));

  // Store priority analysis in Firestore
  const priorityRecord: Omit<AIPriority, 'id'> = {
    conversationId,
    priorityMessages,
    createdAt: new Date(),
  };

  const priorityRef = await admin
    .firestore()
    .collection('aiArtifacts')
    .doc(conversationId)
    .collection('priorities')
    .add(priorityRecord);

  return {
    id: priorityRef.id,
    ...priorityRecord,
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

  if (options?.dateRange) {
    query = query
      .where('createdAt', '>=', options.dateRange.start)
      .where('createdAt', '<=', options.dateRange.end);
  }

  const limit = options?.messageLimit ?? 50; // Use smaller limit for priority detection
  query = query.limit(limit);

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() ?? new Date(),
    })) as Message[]
    .reverse();
}

