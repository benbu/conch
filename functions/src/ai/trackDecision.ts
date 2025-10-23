/**
 * Decision Tracking AI Function
 * Identifies and records key decisions from conversations
 */

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import * as admin from 'firebase-admin';
import { z } from 'zod';
import { AIDecision, Message } from '../types';

const DecisionSchema = z.object({
  statement: z.string().describe('Clear statement of the decision made'),
  reasoning: z.string().optional().describe('Brief explanation of why this decision was made'),
});

const DecisionsResponseSchema = z.object({
  decisions: z.array(DecisionSchema),
});

export async function trackDecision(
  conversationId: string,
  userId: string,
  options?: {
    messageLimit?: number;
    dateRange?: { start: Date; end: Date };
  }
): Promise<AIDecision[]> {
  console.log(`Tracking decisions in ${conversationId} for user ${userId}`);

  // Fetch messages from Firestore
  const messages = await fetchMessages(conversationId, options);

  if (messages.length === 0) {
    throw new Error('No messages found in conversation');
  }

  // Format messages for AI
  const messagesText = messages
    .map((msg) => {
      const timestamp = msg.createdAt instanceof Date 
        ? msg.createdAt.toISOString() 
        : new Date(msg.createdAt).toISOString();
      return `[${timestamp}] User ${msg.senderId}: ${msg.text}`;
    })
    .join('\n');

  // Extract decisions using structured output
  const { object: decisionsData } = (await generateObject({
    model: openai('gpt-4o-mini') as any,
    schema: DecisionsResponseSchema as any,
    prompt: `You are a helpful assistant that identifies key decisions in team conversations.

Analyze the following conversation and identify all important decisions that were made.

A decision is:
- A conclusion reached after discussion
- A commitment to a specific course of action
- A resolution to a question or debate
- An agreement on how to proceed

For each decision, provide:
- A clear statement of what was decided
- Brief reasoning if evident from context

Only include explicit decisions, not general opinions or suggestions.

Conversation:
${messagesText}

Identify all decisions:`,
  } as any)) as any;

  // Store decisions in Firestore
  const decisions: AIDecision[] = [];

  for (const decision of decisionsData.decisions) {
    const decisionData: Omit<AIDecision, 'id'> = {
      conversationId,
      statement: decision.statement,
      createdAt: new Date(),
      sourceMessageIds: messages.map((m) => m.id),
    };

    const decisionRef = await admin
      .firestore()
      .collection('aiArtifacts')
      .doc(conversationId)
      .collection('decisions')
      .add(decisionData);

    decisions.push({
      id: decisionRef.id,
      ...decisionData,
    });
  }

  return decisions;
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
  ).reverse();
}

