import * as admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { authenticateRequest } from './middleware/auth';

export const deleteConversation = onRequest(
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

    const { conversationId } = req.body || {};
    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    try {
      const convRef = admin.firestore().collection('conversations').doc(conversationId);
      const snap = await convRef.get();
      if (!snap.exists) {
        res.status(200).json({ success: true });
        return;
      }

      const conv = snap.data() as any;
      const uid = authReq.user.uid;
      const isCreator = conv.createdBy === uid;
      const isAdmin = (conv.members || []).some((m: any) => m.userId === uid && m.role === 'admin');
      if (!isCreator && !isAdmin) {
        res.status(403).json({ error: 'Not allowed to delete' });
        return;
      }

      // Delete messages in batches
      const messagesRef = convRef.collection('messages');
      while (true) {
        const batchSnap = await messagesRef.limit(400).get();
        if (batchSnap.empty) break;
        const batch = admin.firestore().batch();
        batchSnap.docs.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }

      await convRef.delete();
      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ error: 'Failed to delete conversation', message: error.message });
    }
  }
);


