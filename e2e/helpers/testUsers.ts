export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

export const TEST_USERS = {
  user1: {
    email: 'testuser1@example.com',
    password: 'password123',
    displayName: 'Test User 1',
  } as TestUser,
  user2: {
    email: 'testuser2@example.com',
    password: 'password123',
    displayName: 'Test User 2',
  } as TestUser,
};

/**
 * Get a test user by key
 */
export function getTestUser(key: 'user1' | 'user2'): TestUser {
  return TEST_USERS[key];
}

/**
 * Generate a random test user (useful for parallel test runs)
 */
export function generateRandomTestUser(): TestUser {
  const random = Math.random().toString(36).substring(7);
  return {
    email: `testuser_${random}@example.com`,
    password: 'password123',
    displayName: `Test User ${random}`,
  };
}


