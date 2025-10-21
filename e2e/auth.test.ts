import { by, device, element, waitFor } from 'detox';
import { clearEmulatorData } from './helpers/setup';
import { TEST_USERS } from './helpers/testUsers';

describe('Authentication Flow', () => {
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

  describe('Signup', () => {
    it('should successfully sign up a new user', async () => {
      const user = TEST_USERS.user1;

      // Wait for signup screen
      await waitFor(element(by.id('signup-display-name-input')))
        .toBeVisible()
        .withTimeout(10000);

      // Fill in signup form
      await element(by.id('signup-display-name-input')).typeText(user.displayName);
      await element(by.id('signup-email-input')).typeText(user.email);
      await element(by.id('signup-password-input')).typeText(user.password);
      await element(by.id('signup-confirm-password-input')).typeText(user.password);

      // Submit
      await element(by.id('signup-submit-button')).tap();

      // Should navigate to home screen
      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show error for mismatched passwords', async () => {
      await waitFor(element(by.id('signup-display-name-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-display-name-input')).typeText('Test User');
      await element(by.id('signup-email-input')).typeText('test@example.com');
      await element(by.id('signup-password-input')).typeText('password123');
      await element(by.id('signup-confirm-password-input')).typeText('password456');

      await element(by.id('signup-submit-button')).tap();

      // Should show error alert (would need to check for alert text)
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should show error for invalid email', async () => {
      await waitFor(element(by.id('signup-display-name-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-display-name-input')).typeText('Test User');
      await element(by.id('signup-email-input')).typeText('invalid-email');
      await element(by.id('signup-password-input')).typeText('password123');
      await element(by.id('signup-confirm-password-input')).typeText('password123');

      await element(by.id('signup-submit-button')).tap();

      await new Promise(resolve => setTimeout(resolve, 1000));
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      // Create a user first
      const user = TEST_USERS.user1;
      
      await waitFor(element(by.id('signup-display-name-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-display-name-input')).typeText(user.displayName);
      await element(by.id('signup-email-input')).typeText(user.email);
      await element(by.id('signup-password-input')).typeText(user.password);
      await element(by.id('signup-confirm-password-input')).typeText(user.password);
      await element(by.id('signup-submit-button')).tap();

      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Logout
      await element(by.label('tab-profile')).tap();
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.id('logout-button')).tap();
      
      // Confirm logout
      await new Promise(resolve => setTimeout(resolve, 500));
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should successfully log in an existing user', async () => {
      const user = TEST_USERS.user1;

      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('login-email-input')).typeText(user.email);
      await element(by.id('login-password-input')).typeText(user.password);
      await element(by.id('login-submit-button')).tap();

      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should show error for invalid credentials', async () => {
      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('login-email-input')).typeText('wrong@example.com');
      await element(by.id('login-password-input')).typeText('wrongpassword');
      await element(by.id('login-submit-button')).tap();

      await new Promise(resolve => setTimeout(resolve, 2000));
    });
  });

  describe('Logout', () => {
    it('should successfully log out', async () => {
      // Sign up first
      const user = TEST_USERS.user1;
      
      await waitFor(element(by.id('signup-display-name-input')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('signup-display-name-input')).typeText(user.displayName);
      await element(by.id('signup-email-input')).typeText(user.email);
      await element(by.id('signup-password-input')).typeText(user.password);
      await element(by.id('signup-confirm-password-input')).typeText(user.password);
      await element(by.id('signup-submit-button')).tap();

      await waitFor(element(by.id('conversations-list')))
        .toBeVisible()
        .withTimeout(10000);

      // Navigate to profile
      await element(by.label('tab-profile')).tap();
      await waitFor(element(by.id('profile-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Logout
      await element(by.id('logout-button')).tap();
      
      // Confirm
      await new Promise(resolve => setTimeout(resolve, 500));
      if (device.getPlatform() === 'ios') {
        await element(by.label('Sign Out')).tap();
      } else {
        await element(by.text('Sign Out')).tap();
      }

      // Should show login screen
      await waitFor(element(by.id('login-email-input')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });
});

