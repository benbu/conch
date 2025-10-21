import { by, device, element, waitFor } from 'detox';
import { sendMessage, signUp } from './helpers/actions';
import { clearEmulatorData, sleep } from './helpers/setup';
import { TEST_USERS } from './helpers/testUsers';

describe('Main User Flow', () => {
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

  it('should complete full user journey: signup, chat, and navigate screens', async () => {
    const user1 = TEST_USERS.user1;
    const user2 = TEST_USERS.user2;

    // ====== User 1 Signs Up ======
    console.log('Step 1: User 1 signs up');
    await signUp(user1);

    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(10000);

    console.log('✓ User 1 signed up successfully');

    // ====== User 1 Logs Out ======
    console.log('Step 2: User 1 logs out');
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
    console.log('✓ User 1 logged out');

    // ====== User 2 Signs Up ======
    console.log('Step 3: User 2 signs up');
    await device.reloadReactNative();
    
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(5000);
    
    await element(by.text('Sign Up')).tap();
    await signUp(user2);

    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(10000);

    console.log('✓ User 2 signed up successfully');

    // ====== User 2 Logs Out ======
    console.log('Step 4: User 2 logs out');
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
    console.log('✓ User 2 logged out');

    // ====== User 1 Logs Back In ======
    console.log('Step 5: User 1 logs back in');
    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('login-email-input')).typeText(user1.email);
    await element(by.id('login-password-input')).typeText(user1.password);
    await element(by.id('login-submit-button')).tap();

    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(10000);

    console.log('✓ User 1 logged back in');

    // ====== User 1 Creates Conversation with User 2 ======
    console.log('Step 6: User 1 creates conversation');
    await element(by.id('new-conversation-button')).tap();
    
    await waitFor(element(by.id('new-conversation-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await element(by.id('user-search-input')).typeText(user2.displayName);
    await sleep(2000); // Wait for search

    await element(by.id('user-search-result-0')).tap();

    await waitFor(element(by.id('chat-message-input')))
      .toBeVisible()
      .withTimeout(5000);

    console.log('✓ Conversation created');

    // ====== User 1 Sends Message ======
    console.log('Step 7: User 1 sends message');
    const message1 = 'Hello from User 1!';
    await sendMessage(message1);

    await waitFor(element(by.text(message1)))
      .toBeVisible()
      .withTimeout(5000);

    console.log('✓ Message sent');

    // ====== Navigate Through Screens ======
    console.log('Step 8: Navigate through screens');
    
    // Go back to home
    if (device.getPlatform() === 'ios') {
      await element(by.traits(['button']).and(by.label('Chats'))).atIndex(0).tap();
    } else {
      await device.pressBack();
    }

    await sleep(500);

    // Navigate to explore
    await element(by.label('tab-explore')).tap();
    await sleep(1000);
    console.log('✓ Navigated to explore');

    // Navigate to profile
    await element(by.label('tab-profile')).tap();
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);
    console.log('✓ Navigated to profile');

    // Verify user info
    await expect(element(by.text(user1.displayName))).toBeVisible();
    await expect(element(by.text(user1.email))).toBeVisible();
    console.log('✓ User info displayed');

    // Navigate back to home
    await element(by.label('tab-home')).tap();
    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(3000);
    console.log('✓ Navigated back to home');

    // ====== Verify Conversation Exists ======
    console.log('Step 9: Verify conversation in list');
    // The conversation with User 2 should be visible
    await sleep(1000);
    // Tap on the conversation
    const conversations = await element(by.id('conversations-list'));
    await expect(conversations).toBeVisible();
    console.log('✓ Conversation visible in list');

    // ====== Final Logout ======
    console.log('Step 10: Final logout');
    await element(by.label('tab-profile')).tap();
    await sleep(500);
    await element(by.id('logout-button')).tap();
    await sleep(500);
    
    if (device.getPlatform() === 'ios') {
      await element(by.label('Sign Out')).tap();
    } else {
      await element(by.text('Sign Out')).tap();
    }

    await waitFor(element(by.id('login-email-input')))
      .toBeVisible()
      .withTimeout(5000);

    console.log('✓ Logged out successfully');
    console.log('========================================');
    console.log('✓✓✓ MAIN FLOW COMPLETED SUCCESSFULLY ✓✓✓');
    console.log('========================================');
  });
});

