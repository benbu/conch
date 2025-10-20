/**
 * Authentication middleware for Cloud Functions
 */

import { Request, Response } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

export interface AuthenticatedRequest extends Request {
  user: {
    uid: string;
    email?: string;
  };
}

/**
 * Verifies Firebase ID token and attaches user info to request
 */
export async function authenticateRequest(
  req: Request,
  res: Response
): Promise<AuthenticatedRequest | null> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid authorization header',
    });
    return null;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    (req as AuthenticatedRequest).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
    };

    return req as AuthenticatedRequest;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
    return null;
  }
}

/**
 * Verifies user has access to a conversation
 */
export async function verifyConversationAccess(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    const conversationDoc = await admin
      .firestore()
      .collection('conversations')
      .doc(conversationId)
      .get();

    if (!conversationDoc.exists) {
      return false;
    }

    const conversation = conversationDoc.data();
    return conversation?.participantIds?.includes(userId) ?? false;
  } catch (error) {
    console.error('Error verifying conversation access:', error);
    return false;
  }
}

