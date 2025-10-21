import { by, element, waitFor } from 'detox';
import { TestUser } from './testUsers';

/**
 * Sign up a new user
 */
export async function signUp(user: TestUser) {
  // Wait for signup screen to be visible
  await waitFor(element(by.id('signup-display-name-input')))
    .toBeVisible()
    .withTimeout(5000);

  // Fill in the form
  await element(by.id('signup-display-name-input')).typeText(user.displayName);
  await element(by.id('signup-email-input')).typeText(user.email);
  await element(by.id('signup-password-input')).typeText(user.password);
  await element(by.id('signup-confirm-password-input')).typeText(user.password);

  // Submit
  await element(by.id('signup-submit-button')).tap();

  // Wait for navigation to home screen
  await waitFor(element(by.id('conversations-list')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Log in an existing user
 */
export async function login(user: TestUser) {
  // Wait for login screen to be visible
  await waitFor(element(by.id('login-email-input')))
    .toBeVisible()
    .withTimeout(5000);

  // Fill in the form
  await element(by.id('login-email-input')).typeText(user.email);
  await element(by.id('login-password-input')).typeText(user.password);

  // Submit
  await element(by.id('login-submit-button')).tap();

  // Wait for navigation to home screen
  await waitFor(element(by.id('conversations-list')))
    .toBeVisible()
    .withTimeout(10000);
}

/**
 * Log out current user
 */
export async function logout() {
  // Navigate to profile tab
  await element(by.label('tab-profile')).tap();
  
  // Wait for profile screen
  await waitFor(element(by.id('profile-screen')))
    .toBeVisible()
    .withTimeout(3000);

  // Tap logout button
  await element(by.id('logout-button')).tap();

  // Wait for login screen
  await waitFor(element(by.id('login-email-input')))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Create a new conversation
 */
export async function createConversation(recipientName: string) {
  // Tap new conversation button
  await element(by.id('new-conversation-button')).tap();

  // Wait for modal
  await waitFor(element(by.id('new-conversation-modal')))
    .toBeVisible()
    .withTimeout(3000);

  // Search for recipient
  await element(by.id('user-search-input')).typeText(recipientName);

  // Wait a bit for search results
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Tap on the first result
  await element(by.id(`user-search-result-0`)).tap();

  // Wait for chat screen
  await waitFor(element(by.id('chat-message-input')))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Send a message in the current conversation
 */
export async function sendMessage(message: string) {
  // Wait for message input
  await waitFor(element(by.id('chat-message-input')))
    .toBeVisible()
    .withTimeout(3000);

  // Type message
  await element(by.id('chat-message-input')).typeText(message);

  // Send
  await element(by.id('chat-send-button')).tap();

  // Wait for message to appear in the list
  await waitFor(element(by.text(message)))
    .toBeVisible()
    .withTimeout(5000);
}

/**
 * Navigate to a specific tab
 */
export async function navigateToTab(tab: 'home' | 'explore' | 'search' | 'profile') {
  const tabLabels = {
    home: 'tab-home',
    explore: 'tab-explore',
    search: 'tab-search',
    profile: 'tab-profile',
  };

  await element(by.label(tabLabels[tab])).tap();
}

/**
 * Wait for element to be visible with retry
 */
export async function waitForElement(testId: string, timeoutMs: number = 5000) {
  await waitFor(element(by.id(testId)))
    .toBeVisible()
    .withTimeout(timeoutMs);
}

/**
 * Scroll to find an element
 */
export async function scrollToElement(
  scrollViewTestId: string,
  elementTestId: string,
  direction: 'up' | 'down' = 'down'
) {
  await waitFor(element(by.id(elementTestId)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestId))
    .scroll(100, direction);
}

