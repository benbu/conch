/**
 * Action Item Extraction AI Function
 * Identifies tasks and action items from conversations
 */

import * as admin from 'firebase-admin';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { Message, AIActions, ActionItem } from '../types';

const ActionItemSchema = z.object({
  title: z.string().describe('The action item or task description'),
  ownerId: z.string().optional().describe('User ID of the person assigned'),
  dueAt: z.string().optional().describe('Due date in ISO format'),
  completed: z.boolean().default(false),
});

const ActionsResponseSchema = z.object({
  actions: z.array(ActionItemSchema),
});

export async function extractActions(
  conversationId: string,
  userId: string,
  options?: {
    messageLimit?: number;
    dateRange?: { start: Date; end: Date };
  }
): Promise<AIActions> {
  console.log(`Extracting actions from ${conversationId} for user ${userId}`);

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

  // Extract action items using structured output
  const { object: actionsData } = await generateObject({
    model: openai('gpt-4-turbo'),
    schema: ActionsResponseSchema,
    prompt: `You are a helpful assistant that extracts action items from team conversations.

Analyze the following conversation and identify all action items, tasks, or commitments made by team members.

For each action item, extract:
- A clear, actionable title
- The user ID if someone was explicitly assigned (look for "@userId" mentions)
- A due date if one was mentioned
- Default completed status to false

Only include explicit action items, not general discussion topics.

Conversation:
${messagesText}

Extract all action items:`,
  });

  // Parse action items and convert dates
  const actionItems: ActionItem[] = actionsData.actions.map((action) => ({
    title: action.title,
    ownerId: action.ownerId,
    dueAt: action.dueAt ? new Date(action.dueAt) : undefined,
    completed: action.completed,
  }));

  // Store actions in Firestore
  const actionsRecord: Omit<AIActions, 'id'> = {
    conversationId,
    items: actionItems,
    createdAt: new Date(),
    sourceMessageIds: messages.map((m) => m.id),
  };

  const actionsRef = await admin
    .firestore()
    .collection('aiArtifacts')
    .doc(conversationId)
    .collection('actions')
    .add(actionsRecord);

  return {
    id: actionsRef.id,
    ...actionsRecord,
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

  const limit = options?.messageLimit ?? 100;
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

