import { NOTIFICATIONS_V2 } from '../../constants/featureFlags';
import { scheduleLocalNotification } from '../notificationService';

interface NotifyPayload {
  title: string;
  body: string;
  data?: any;
}

/**
 * NotificationGateway is a thin facade that routes notification requests
 * to the appropriate delivery mechanism (local vs push). For now we only
 * schedule local notifications in the client; server push is handled elsewhere.
 */
export class NotificationGateway {
  static async notify(payload: NotifyPayload): Promise<void> {
    if (!NOTIFICATIONS_V2) {
      // Fallback to existing local notification helper
      await scheduleLocalNotification(payload.title, payload.body, payload.data);
      return;
    }

    // Future: branch to remote push when token/endpoint present.
    await scheduleLocalNotification(payload.title, payload.body, payload.data);
  }
}


