/**
 * Conch Social Cloud Functions
 * AI-powered features for team messaging
 */

import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { detectPriority } from './ai/detectPriority';
import { extractActions } from './ai/extractActions';
import { suggestResponses } from './ai/suggestResponses';
import { summarizeThread } from './ai/summarizeThread';
import { trackDecision } from './ai/trackDecision';
import { authenticateRequest, verifyConversationAccess } from './middleware/auth';

// Initialize Firebase Admin
admin.initializeApp();

// Export triggers
export { onMessageCreated } from './triggers/onMessageCreated';

/**
 * Thread Summary Function
 * POST /ai/summarizeThread
 * Body: { conversationId, options?: { messageLimit, dateRange } }
 */
export const aiSummarizeThread = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Authenticate request
    const authReq = await authenticateRequest(req, res);
    if (!authReq) return;

    const { conversationId, options } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    // Verify user has access to conversation
    const hasAccess = await verifyConversationAccess(
      authReq.user.uid,
      conversationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    try {
      const summary = await summarizeThread(
        conversationId,
        authReq.user.uid,
        options
      );
      res.status(200).json({ success: true, data: summary });
    } catch (error: any) {
      console.error('Error generating summary:', error);
      res.status(500).json({
        error: 'Failed to generate summary',
        message: error.message,
      });
    }
  }
);

/**
 * Response Suggestions Function
 * POST /ai/suggestResponses
 * Body: { conversationId, options?: { lastMessagesN } }
 */
export const aiSuggestResponses = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authReq = await authenticateRequest(req, res);
    if (!authReq) return;

    const { conversationId, options } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    const hasAccess = await verifyConversationAccess(
      authReq.user.uid,
      conversationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    try {
      const suggestions = await suggestResponses(
        conversationId,
        authReq.user.uid,
        options
      );
      res.status(200).json({ success: true, data: suggestions });
    } catch (error: any) {
      console.error('Error suggesting responses:', error);
      res.status(500).json({
        error: 'Failed to suggest responses',
        message: error.message,
      });
    }
  }
);

/**
 * Action Extraction Function
 * POST /ai/extractActions
 * Body: { conversationId, options?: { messageLimit, dateRange } }
 */
export const aiExtractActions = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authReq = await authenticateRequest(req, res);
    if (!authReq) return;

    const { conversationId, options } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    const hasAccess = await verifyConversationAccess(
      authReq.user.uid,
      conversationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    try {
      const actions = await extractActions(
        conversationId,
        authReq.user.uid,
        options
      );
      res.status(200).json({ success: true, data: actions });
    } catch (error: any) {
      console.error('Error extracting actions:', error);
      res.status(500).json({
        error: 'Failed to extract actions',
        message: error.message,
      });
    }
  }
);

/**
 * Decision Tracking Function
 * POST /ai/trackDecision
 * Body: { conversationId, options?: { messageLimit, dateRange } }
 */
export const aiTrackDecision = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authReq = await authenticateRequest(req, res);
    if (!authReq) return;

    const { conversationId, options } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    const hasAccess = await verifyConversationAccess(
      authReq.user.uid,
      conversationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    try {
      const decisions = await trackDecision(
        conversationId,
        authReq.user.uid,
        options
      );
      res.status(200).json({ success: true, data: decisions });
    } catch (error: any) {
      console.error('Error tracking decisions:', error);
      res.status(500).json({
        error: 'Failed to track decisions',
        message: error.message,
      });
    }
  }
);

/**
 * Priority Detection Function
 * POST /ai/detectPriority
 * Body: { conversationId, options?: { messageLimit, dateRange, minScore } }
 */
export const aiDetectPriority = onRequest(
  {
    cors: true,
    region: 'us-central1',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const authReq = await authenticateRequest(req, res);
    if (!authReq) return;

    const { conversationId, options } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    const hasAccess = await verifyConversationAccess(
      authReq.user.uid,
      conversationId
    );

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this conversation' });
      return;
    }

    try {
      const priority = await detectPriority(
        conversationId,
        authReq.user.uid,
        options
      );
      res.status(200).json({ success: true, data: priority });
    } catch (error: any) {
      console.error('Error detecting priority:', error);
      res.status(500).json({
        error: 'Failed to detect priority',
        message: error.message,
      });
    }
  }
);

