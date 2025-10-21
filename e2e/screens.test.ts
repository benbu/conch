import { by, device, element, waitFor } from 'detox';
import { signUp } from './helpers/actions';
import { clearEmulatorData, sleep } from './helpers/setup';
import { TEST_USERS } from './helpers/testUsers';

describe('Screen Navigation', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await clearEmulatorData();
    await device.reloadReactNative();

    // Sign up and login a user
    const user = TEST_USERS.user1;
    await signUp(user);

    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should navigate to home/conversations screen', async () => {
    await element(by.label('tab-home')).tap();
    
    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate to explore screen', async () => {
    await element(by.label('tab-explore')).tap();
    
    // Wait for explore screen content
    await sleep(1000);
    // Add more specific assertions once explore screen has testIDs
  });

  it('should navigate to profile screen', async () => {
    await element(by.label('tab-profile')).tap();
    
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should navigate between all tabs', async () => {
    // Navigate to each tab in sequence
    await element(by.label('tab-explore')).tap();
    await sleep(500);
    
    await element(by.label('tab-profile')).tap();
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);
    
    await element(by.label('tab-home')).tap();
    await waitFor(element(by.id('conversations-list')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should display user profile information', async () => {
    const user = TEST_USERS.user1;
    
    await element(by.label('tab-profile')).tap();
    
    await waitFor(element(by.id('profile-screen')))
      .toBeVisible()
      .withTimeout(3000);

    // Check if user name is displayed
    await expect(element(by.text(user.displayName))).toBeVisible();
    await expect(element(by.text(user.email))).toBeVisible();
  });

  it('should show empty state on conversations screen', async () => {
    // User just signed up, should have no conversations
    await waitFor(element(by.text('No conversations yet')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should open new conversation modal', async () => {
    await element(by.id('new-conversation-button')).tap();
    
    await waitFor(element(by.id('new-conversation-modal')))
      .toBeVisible()
      .withTimeout(3000);

    await expect(element(by.id('user-search-input'))).toBeVisible();
  });

  it('should close new conversation modal', async () => {
    await element(by.id('new-conversation-button')).tap();
    
    await waitFor(element(by.id('new-conversation-modal')))
      .toBeVisible()
      .withTimeout(3000);

    // Tap cancel button
    await element(by.text('Cancel')).tap();
    
    await sleep(500);
    
    // Modal should be closed, conversations list should be visible
    await expect(element(by.id('conversations-list'))).toBeVisible();
  });
});

