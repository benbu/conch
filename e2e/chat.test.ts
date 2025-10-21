import { by, device, element, waitFor } from 'detox';
import { sendMessage, signUp } from './helpers/actions';
import { clearEmulatorData, sleep } from './helpers/setup';
import { TEST_USERS } from './helpers/testUsers';

describe('Chat Functionality', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await clearEmulatorData();
    await device.reloadReactNative();
  });

  describe('Conversation Creation', () => {
    it('should create a new conversation between two users', async () => {
      const user1 = TEST_USERS.user1;
      const user2 = TEST_USERS.user2;

      // Sign up user 1
      await signUp(user1);

      // Wait for home screen
      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Logout and sign up user 2
      await element(by.label('tab-profile')).tap();
      await waitFor(element(by.id('logout-button')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('logout-button')).tap();
      await sleep(500);
      
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      await sleep(1000);
      await device.reloadReactNative();

      // Navigate to signup
      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);
      
      // Find and tap "Sign Up" link (using text)
      await element(by.text('Sign Up')).tap();
      
      await signUp(user2);

      // User 2 is now logged in, logout and login as user 1
      await element(by.label('tab-profile')).tap();
      await waitFor(element(by.id('logout-button')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('logout-button')).tap();
      await sleep(500);
      
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      await sleep(1000);

      // Login as user 1
      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('login-email-input')).typeText(user1.email);
      await element(by.id('login-password-input')).typeText(user1.password);
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Create new conversation
      await element(by.id('new-conversation-button')).tap();
      
      await waitFor(element(by.id('new-conversation-modal')))
        .toBeVisible()
        .withTimeout(3000);

      // Search for user 2
      await element(by.id('user-search-input')).typeText(user2.displayName);
      await sleep(2000); // Wait for search results

      // Tap on user 2
      await element(by.id('user-search-result-0')).tap();

      // Should navigate to chat screen
      await waitFor(element(by.id('chat-message-input')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Message Sending', () => {
    beforeEach(async () => {
      // Set up two users and create a conversation
      const user1 = TEST_USERS.user1;
      const user2 = TEST_USERS.user2;

      await signUp(user1);
      await element(by.label('tab-profile')).tap();
      await sleep(500);
      await element(by.id('logout-button')).tap();
      await sleep(500);
      
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      await sleep(1000);
      await element(by.text('Sign Up')).tap();
      await signUp(user2);
      
      await element(by.label('tab-profile')).tap();
      await sleep(500);
      await element(by.id('logout-button')).tap();
      await sleep(500);
      
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      await sleep(1000);

      // Login as user 1 and create conversation
      await element(by.id('login-email-input')).typeText(user1.email);
      await element(by.id('login-password-input')).typeText(user1.password);
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);

      await element(by.id('new-conversation-button')).tap();
      await sleep(500);
      await element(by.id('user-search-input')).typeText(user2.displayName);
      await sleep(2000);
      await element(by.id('user-search-result-0')).tap();

      await waitFor(element(by.id('chat-message-input')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should send and display a text message', async () => {
      const message = 'Hello from User 1!';

      await sendMessage(message);

      // Message should be visible
      await waitFor(element(by.text(message)))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should send multiple messages', async () => {
      const messages = ['First message', 'Second message', 'Third message'];

      for (const msg of messages) {
        await sendMessage(msg);
        await sleep(500);
      }

      // All messages should be visible
      for (const msg of messages) {
        await expect(element(by.text(msg))).toBeVisible();
      }
    });
  });

  describe('Message Receiving', () => {
    it('should receive messages from another user', async () => {
      // This would require simulating two devices or using Firebase directly
      // For now, this is a placeholder for the concept
      // In a real implementation, you'd use the Firebase Admin SDK to send messages
    });
  });
});

