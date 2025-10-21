import { by, device, element, waitFor } from 'detox';
import { sendMessage, signUp } from './helpers/actions';
import { clearEmulatorData, sleep } from './helpers/setup';
import { TEST_USERS } from './helpers/testUsers';

describe('AI Features', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await clearEmulatorData();
    await device.reloadReactNative();

    // Set up test environment with messages
    const user1 = TEST_USERS.user1;
    const user2 = TEST_USERS.user2;

    // Sign up both users
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

    // Send some test messages
    await sendMessage('We need to schedule a meeting for next week.');
    await sleep(500);
    await sendMessage('The project deadline is Friday.');
    await sleep(500);
    await sendMessage('Can you review the document by tomorrow?');
    await sleep(500);
  });

  it('should open AI feature menu', async () => {
    // Look for AI button in header
    await element(by.text('✨ AI')).tap();
    
    await sleep(1000);
    // AI menu should be visible
    // Note: Would need testIDs in AIFeatureMenu component for better assertions
  });

  it('should generate thread summary', async () => {
    // Open AI menu
    await element(by.text('✨ AI')).tap();
    await sleep(500);

    // Tap summary option (would need testID)
    // This is a placeholder - actual implementation depends on AIFeatureMenu structure
    await element(by.text('Summarize')).tap();
    await sleep(2000);

    // Summary should be loading or displayed
  });

  it('should extract action items', async () => {
    // Open AI menu
    await element(by.text('✨ AI')).tap();
    await sleep(500);

    // Tap actions option
    await element(by.text('Actions')).tap();
    await sleep(2000);

    // Actions should be loading or displayed
  });

  it('should track decisions', async () => {
    // Send a decision message first
    await sendMessage('We decided to use React Native for the mobile app.');
    await sleep(1000);

    // Open AI menu
    await element(by.text('✨ AI')).tap();
    await sleep(500);

    // Tap decisions option
    await element(by.text('Decisions')).tap();
    await sleep(2000);

    // Decisions should be loading or displayed
  });

  it('should detect message priority', async () => {
    // Send an urgent message
    await sendMessage('URGENT: Production server is down!');
    await sleep(1000);

    // Open AI menu
    await element(by.text('✨ AI')).tap();
    await sleep(500);

    // Tap priority option
    await element(by.text('Priority')).tap();
    await sleep(2000);

    // Priority detection should run
  });
});

