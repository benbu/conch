# Firebase Realtime Database Setup Guide

## Quick Setup for Presence System

This guide walks you through enabling and configuring Firebase Realtime Database for the presence tracking feature.

## Step 1: Enable Realtime Database

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (Conch Social)
3. In the left sidebar, click **Realtime Database**
4. Click **Create Database**
5. Choose a database location (preferably same region as Firestore)
6. Start in **test mode** (we'll add security rules next)
7. Click **Enable**

## Step 2: Get Database URL

After creating the database:

1. You'll see your database URL at the top of the page
2. It looks like: `https://your-project-id-default-rtdb.firebaseio.com`
3. Copy this URL

## Step 3: Update Environment Variables

Add to your `.env` file (create if it doesn't exist):

```bash
# Firebase Realtime Database
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

Replace `your-project-id` with your actual project ID.

## Step 4: Configure Security Rules

### Development Rules (Testing)

For testing, you can use these permissive rules:

1. In Firebase Console, go to **Realtime Database** > **Rules** tab
2. Replace with:

```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

3. Click **Publish**

### Production Rules (Recommended)

For production, use these more restrictive rules:

```json
{
  "rules": {
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth.uid === $userId",
        ".validate": "newData.hasChildren(['status', 'lastSeen'])",
        "status": {
          ".validate": "newData.isString() && (newData.val() === 'online' || newData.val() === 'offline' || newData.val() === 'away')"
        },
        "lastSeen": {
          ".validate": "newData.isNumber()"
        },
        "customStatus": {
          ".validate": "!newData.exists() || (newData.isString() && newData.val().length <= 100)"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "$other": {
      ".read": false,
      ".write": false
    }
  }
}
```

This ensures:
- ✅ Only authenticated users can read presence
- ✅ Users can only write their own presence
- ✅ Presence data structure is validated
- ✅ Custom status limited to 100 characters
- ✅ No other data can be written to the database

## Step 5: Test Connection

### Method 1: Using Firebase Console

1. Go to **Realtime Database** > **Data** tab
2. You should see the root node
3. No data yet (will appear when users log in)

### Method 2: In Your App

1. Start your app: `npm start`
2. Log in with a test account
3. In Firebase Console, refresh the **Data** tab
4. You should see: `/presence/{userId}/status: "online"`

### Method 3: Check App Logs

Look for these log messages in your console:
```
✅ Firebase initialized successfully
✅ Presence tracking started for user: {userId}
```

## Step 6: Verify Presence Updates

Test the presence system:

1. **Online Status**:
   - Log in on one device
   - Check Firebase Console - should show "online"

2. **Offline Status**:
   - Close the app
   - Wait 2-3 seconds
   - Check Firebase Console - should show "offline"

3. **Away Status**:
   - Keep app open but don't interact
   - Wait 5 minutes
   - Check Firebase Console - should show "away"

4. **Appear Offline**:
   - Go to Profile > Presence Settings
   - Toggle "Appear Offline"
   - Check Firebase Console - should show "offline" even when active

## Firestore Emulator Support

If using Firebase Emulator Suite, the Realtime Database will be available at:
- Default: `http://127.0.0.1:9000`
- Connection is automatic when `USE_FIREBASE_EMULATOR=true`

## Troubleshooting

### Issue: "Permission denied" error

**Solution**: Check security rules, ensure user is authenticated

### Issue: Presence not updating

**Solutions**:
1. Check database URL in `.env`
2. Verify Firebase initialization logs
3. Check network connection
4. Ensure app has internet permission (Android)

### Issue: Data not appearing in console

**Solutions**:
1. Refresh the Data tab
2. Check that user is logged in
3. Look for errors in app console

### Issue: Presence stays "online" after closing app

**Solutions**:
1. Check that `onDisconnect()` is set up (it is in the code)
2. Verify network connection
3. Check Firebase Console's server monitoring

## Firebase Pricing

### Realtime Database Pricing (as of 2024)

**Spark Plan (Free)**:
- 1 GB stored
- 10 GB/month downloaded
- 100 simultaneous connections

**Blaze Plan (Pay as you go)**:
- $5/GB stored per month
- $1/GB downloaded
- No connection limits

### Estimated Usage for Presence

For 1,000 active users:
- Storage: ~50 KB (negligible)
- Downloads: ~5 MB/day (real-time updates)
- Connections: 1,000 simultaneous

**Conclusion**: Even with thousands of users, presence tracking will likely stay within the free tier.

## Data Structure Reference

```json
{
  "presence": {
    "user123": {
      "status": "online",
      "lastSeen": 1729526400000,
      "customStatus": "In a meeting"
    },
    "user456": {
      "status": "away",
      "lastSeen": 1729526350000
    },
    "user789": {
      "status": "offline",
      "lastSeen": 1729526000000,
      "customStatus": "On vacation 🏖️"
    }
  }
}
```

## Backup Strategy

Realtime Database data can be backed up:

1. **Manual Backup**:
   - Go to **Realtime Database** > **Data**
   - Click the menu (⋮) next to database root
   - Select **Export JSON**

2. **Automated Backup**:
   - Not required for presence data (ephemeral)
   - Consider for audit trails if needed

## Monitoring

In Firebase Console:

1. **Usage Tab**: Monitor read/write operations
2. **Rules Tab**: View security rules
3. **Data Tab**: Inspect current presence data
4. **Usage and Billing**: Track costs

## Next Steps

After setup:

1. ✅ Test all presence features
2. ✅ Monitor initial usage
3. ✅ Gather user feedback
4. ✅ Adjust security rules if needed
5. ✅ Set up monitoring/alerts

## Support

- [Firebase Realtime Database Documentation](https://firebase.google.com/docs/database)
- [Security Rules Guide](https://firebase.google.com/docs/database/security)
- [Pricing Calculator](https://firebase.google.com/pricing)

---

**Setup Time**: ~10 minutes  
**Difficulty**: Easy  
**Cost**: Free (for most use cases)

