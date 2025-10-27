/**
 * Firestore Trigger: On Message Created
 * Sends push notifications when new messages are created
 */

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import * as admin from 'firebase-admin';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { translateTool } from '../ai/translate';

export const onMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event: any) => {
    const message = event.data?.data();
    const conversationId = event.params.conversationId;
    const messageId = event.params.messageId;

    if (!message) {
      console.log('No message data');
      return;
    }

    try {
      // Get conversation to find participants
      const conversationDoc = await admin
        .firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();

      if (!conversationDoc.exists) {
        console.log('Conversation not found');
        return;
      }

      const conversation = conversationDoc.data();
      if (!conversation) {
        return;
      }

      // Find recipients (all participants except sender)
      const recipients = conversation.participantIds.filter(
        (id: string) => id !== message.senderId
      );

      if (recipients.length === 0) {
        console.log('No recipients to notify');
        return;
      }

      // Prepare notification payload
      // Notification payload intentionally unused while FCM config is fixed

    } catch (error) {
      console.error('Error sending notification:', error);
    }

    // Notifications should not block translations. Run translations irrespective of notification outcome.
    try {
      // Get conversation participants again (in case of earlier error scope)
      const conversationDoc = await admin
        .firestore()
        .collection('conversations')
        .doc(conversationId)
        .get();
      const conversation = conversationDoc.data();
      if (!conversation) {
        return;
      }

      const recipients = conversation.participantIds.filter(
        (id: string) => id !== message.senderId
      );

      // Fetch recipients' language settings
      const userDocs = await Promise.all(
        recipients.map((id: string) =>
          admin.firestore().collection('users').doc(id).get()
        )
      );

      const targetLangs = new Set<string>();
      for (const docSnap of userDocs) {
        const u = docSnap.data() as any;
        if (u?.autoTranslate && typeof u?.defaultLanguage === 'string' && u.defaultLanguage.trim()) {
          targetLangs.add((u.defaultLanguage as string).toLowerCase());
        }
      }

      if (targetLangs.size > 0 && typeof message.text === 'string' && message.text.trim().length > 0) {
        await Promise.allSettled(
          Array.from(targetLangs).map(async (targetLang) => {
            const ref = admin
              .firestore()
              .doc(
                `conversations/${conversationId}/messages/${messageId}/translations/${targetLang}`
              );

            await ref.set(
              {
                status: 'pending',
                createdAt: new Date(),
                model: process.env.TRANSLATION_MODEL || 'gpt-4o-mini',
                provider: 'openai',
              // Denormalized fields for efficient collectionGroup querying
              conversationId,
              messageId,
              lang: (targetLang || '').toLowerCase(),
              messageCreatedAt: message?.createdAt || new Date(),
              },
              { merge: true }
            );

            try {
              const { toolResults } = await generateText({
                model: openai(process.env.ORCHESTRATOR_MODEL || 'gpt-4o-mini') as any,
                tools: { translate: translateTool },
                toolChoice: { type: 'tool', toolName: 'translate' },
                prompt: JSON.stringify({
                  targetLang,
                  text: message.text,
                  audienceRegion: undefined,
                }),
              });

              const out = toolResults?.[0]?.output as any;
              const detected: string = String(out?.detectedSourceLang || '')
                .trim()
                .toLowerCase();
              const targetLower = String(targetLang || '').toLowerCase();
              const computedNoOp = detected.length > 0 && detected === targetLower;

              const update: any = {
                status: 'completed',
                translation: out?.translation || '',
                noTranslationNeeded: computedNoOp,
                culturalContextHints: Array.isArray(out?.culturalContextHints)
                  ? out.culturalContextHints
                  : [],
                slangExplanations: Array.isArray(out?.slangExplanations)
                  ? out.slangExplanations
                  : [],
                updatedAt: new Date(),
              };
              if (
                typeof out?.detectedSourceLang === 'string' &&
                out.detectedSourceLang.trim()
              ) {
                update.detectedSourceLang = out.detectedSourceLang;
              }
              if (typeof out?.confidence === 'number') {
                update.confidence = out.confidence;
              }
              await ref.set(update, { merge: true });
            } catch (e: any) {
              await ref.set(
                { status: 'error', error: String(e), updatedAt: new Date() },
                { merge: true }
              );
            }
          })
        );
      }
    } catch (e) {
      console.error('Translation orchestration error:', e);
    }
  }
);

