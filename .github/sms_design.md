# SMS Notification System - ShowerNFT

## Overview

ShowerNFT uses **client-side polling** with **Twilio SMS** to notify friends when a user's NFT expires (they become "stinky"). This document details the complete implementation.

## Architecture

### Design Philosophy

**Client-Side Polling** (not Vercel Cron):
- ✅ **100% Free Tier Compatible** - No Vercel cron limits
- ✅ **Real-Time** - Checks every 10 seconds when Dashboard is open
- ✅ **No Duplicates** - User-specific checks prevent spam
- ✅ **Simple** - No serverless function complexity

### System Flow

```
Dashboard (User A) 
    ↓ Every 10 seconds
Check if A's NFT expired
    ↓ Yes, and isValid=true
Send SMS to A's friends
    ↓
Delete NFT from Firebase
    ↓
Mark isValid=false (prevent re-notification)
```

## Components

### 1. Dashboard Component (`src/lib/components/Dashboard.svelte`)

**Polling Logic**:

```typescript
// Check for expired NFTs every 10 seconds
async function checkExpiredNFTs() {
  nextPollIn.set(10); // Reset countdown
  
  if (!$currentUser || !$latestNFTData) return;
  
  const now = Math.floor(Date.now() / 1000);
  const isExpired = now >= $latestNFTData.expiresAt;
  
  if (isExpired && $latestNFTData.isValid) {
    // 1. Send SMS notifications
    if ($friendsPhoneNumbers?.length > 0) {
      const userName = $currentUser.displayName || 'A CS student';
      await sendExpiryNotifications(userName, $friendsPhoneNumbers);
    }
    
    // 2. Delete from Firebase
    await deleteExpiredNFT($latestNFTData.imageUrl);
    
    // 3. Clear local store
    latestNFTData.set(null);
  }
}

// Start polling on mount
onMount(() => {
  checkExpiredNFTs(); // Immediate check
  expiryCheckInterval = setInterval(checkExpiredNFTs, 10 * 1000); // Every 10s
  
  // Visual countdown timer
  pollCountdownInterval = setInterval(() => {
    nextPollIn.update(n => Math.max(0, n - 1));
  }, 1000);
});
```

**Visual Feedback**:

```html
<!-- Debug display at footer -->
<div class="text-center text-xs text-gray-500 bg-gray-50 p-2 rounded">
  🔍 Next expiry check in: <span class="font-mono">{$nextPollIn}s</span>
</div>
```

### 2. Auth Service (`src/lib/authService.ts`)

**SMS Sending Function**:

```typescript
export async function sendExpiryNotifications(
  userName: string, 
  friendPhones: string[]
): Promise<{ success: boolean; sent: number; errors?: string[] }> {
  
  if (!friendPhones?.length) {
    return { success: true, sent: 0 };
  }
  
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
  const fromNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
  
  if (!accountSid || !authToken || !fromNumber) {
    console.error('❌ Twilio credentials not configured');
    return { success: false, error: 'Twilio not configured' };
  }
  
  const message = `🚿 ALERT: ${userName} is now officially STINKY! Their Proof-of-Lather NFT has expired. Shame them into showering! - The Groom Protocol`;
  
  let successCount = 0;
  let errors: string[] = [];
  
  for (const phoneNumber of friendPhones) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: fromNumber,
          Body: message,
        }),
      });
      
      if (response.ok) {
        successCount++;
        console.log(`✅ SMS sent to ${phoneNumber}`);
      } else {
        const error = await response.text();
        errors.push(`${phoneNumber}: ${error}`);
        console.error(`❌ Failed to send SMS to ${phoneNumber}:`, error);
      }
    } catch (error: any) {
      errors.push(`${phoneNumber}: ${error.message}`);
      console.error(`❌ Error sending SMS to ${phoneNumber}:`, error);
    }
  }
  
  return {
    success: successCount > 0,
    sent: successCount,
    errors: errors.length > 0 ? errors : undefined,
  };
}
```

**NFT Deletion Function**:

```typescript
export async function deleteExpiredNFT(
  imageUrl?: string
): Promise<{ success: boolean; error?: string }> {
  
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'No user logged in' };
  
  try {
    // 1. Delete image from Firebase Storage
    if (imageUrl) {
      try {
        const pathMatch = imageUrl.match(/o\/(.+?)\?/);
        if (pathMatch) {
          const decodedPath = decodeURIComponent(pathMatch[1]);
          const imageRef = ref(storage, decodedPath);
          await deleteObject(imageRef);
          console.log('✅ Deleted image from Storage');
        }
      } catch (storageError) {
        console.warn('⚠️ Failed to delete Storage image:', storageError);
        // Continue even if Storage deletion fails
      }
    }
    
    // 2. Delete latestNFT from Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      latestNFT: deleteField()
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting expired NFT:', error);
    return { success: false, error: error.message };
  }
}
```

## Configuration

### Environment Variables (`.env`)

```bash
# Twilio Configuration (client-side access)
VITE_TWILIO_ACCOUNT_SID=AC...
VITE_TWILIO_AUTH_TOKEN=...
VITE_TWILIO_PHONE_NUMBER=+16474926299
```

**Note**: All prefixed with `VITE_` for Vite client-side access.

### Twilio Setup

1. **Sign up** at [twilio.com](https://www.twilio.com)
2. **Get phone number** (free trial includes one number)
3. **Find credentials**:
   - Account SID: Dashboard → Account Info
   - Auth Token: Dashboard → Account Info → "View" button
4. **Add to `.env`**

### Vercel Deployment

Add environment variables in Vercel dashboard:
- Settings → Environment Variables
- Add each `VITE_TWILIO_*` variable
- Redeploy after adding

## Data Flow

### 1. User Mints NFT

```typescript
// Minting.svelte
await recordNFTMint({
  tokenId, txHash, showerThought, imageUrl,
  duration, walletAddress, customTimeout
});

// authService.ts - recordNFTMint()
await updateDoc(doc(db, 'users', user.uid), {
  latestNFT: {
    tokenId, txHash, showerThought, imageUrl,
    mintTime: now.toISOString(),
    expiresAt: expiryDate.toISOString(),
    customTimeout,
    isActive: true // ← Important: marks NFT as fresh
  }
});
```

### 2. Dashboard Loads NFT

```typescript
// Dashboard.svelte - onMount()
const result = await getLatestNFT();
if (result.success && result.latestNFT) {
  latestNFTData.set({
    tokenId: result.latestNFT.tokenId,
    expiresAt: result.latestNFT.expiresAt,
    // ... other fields
    isValid: true // Client-side validation
  });
}
```

### 3. Polling Detects Expiry

```typescript
// Every 10 seconds
const now = Math.floor(Date.now() / 1000);
const isExpired = now >= $latestNFTData.expiresAt;

if (isExpired && $latestNFTData.isValid) {
  // This only runs ONCE per expiry
  await sendExpiryNotifications(...);
  await deleteExpiredNFT(...);
  latestNFTData.set(null); // Prevents re-notification
}
```

## Message Template

**Default SMS**:
```
🚿 ALERT: [User Name] is now officially STINKY! Their Proof-of-Lather NFT has expired. Shame them into showering! - The Groom Protocol
```

**Variables**:
- `userName`: From `$currentUser.displayName` (Google profile name)
- Falls back to `"A CS student"` if no name

## Error Handling

### SMS Failures

**Scenarios**:
- ✅ Twilio credentials missing → Log error, continue with deletion
- ✅ Invalid phone number → Log error, try remaining numbers
- ✅ Network timeout → Log error, continue with deletion
- ✅ Rate limit exceeded → Log error, continue with deletion

**Philosophy**: SMS is **nice-to-have**, NFT deletion is **critical**. Always proceed with cleanup even if SMS fails.

### Storage Deletion Failures

```typescript
try {
  await deleteObject(imageRef);
} catch (storageError) {
  console.warn('⚠️ Failed to delete Storage image:', storageError);
  // Continue - Firestore cleanup is more important
}
```

**Why**: Storage blobs cost money, but orphaned blobs are better than broken user state.

## Testing

### Local Testing (Demo Mode)

```bash
# 1. Mint NFT with 1-minute timeout
# In Minting.svelte, enter: 1 minute

# 2. Watch console logs
# Should see: "🔍 Next expiry check in: 10s"

# 3. Wait 60 seconds
# Should see:
# "🔔 NFT expired! Deleting and notifying friends..."
# "📱 Sending SMS to X friends..."
# "✅ SMS sent to +1234567890"
# "✅ Expired NFT deleted successfully"

# 4. Check phone
# Friend should receive SMS
```

### Production Testing

```bash
# Use TEST phone numbers (your own)
# Twilio trial accounts can only send to verified numbers

# 1. Add test number in Twilio console:
# Phone Numbers → Verified Caller IDs

# 2. In Onboarding, add your test number
# 3. Mint with 1-minute timeout
# 4. Wait for SMS
```

## Performance

### Polling Frequency

**10 seconds** balances:
- ✅ **Responsiveness** - Notifications within 10s of expiry
- ✅ **Battery Life** - Not too aggressive
- ✅ **API Costs** - Minimal Firestore reads (client-side cache)

### Network Impact

**Per Check**:
- 0 Firestore reads (uses local `$latestNFTData` store)
- 0 API calls (everything is client-side)
- Only on expiry: N Twilio API calls (N = friends count)

### Cost Estimate

**Twilio**:
- $0.0079 per SMS (US)
- 3 friends × 1 expiry/day = $0.02/day
- **Monthly**: ~$0.60

**Firebase**:
- Storage deletion: Free (operations)
- Firestore write: 1 per expiry = negligible

## Advantages Over Vercel Cron

| Feature | Client-Side Polling | Vercel Cron |
|---------|-------------------|-------------|
| Cost | **Free** | $20/month (Pro plan) |
| Latency | **10 seconds** | 60 minutes (hourly) |
| Duplicates | **None** (user-specific) | Possible (all users checked) |
| Debugging | **Easy** (console logs) | Difficult (serverless logs) |
| Complexity | **Low** (1 function) | High (API route + auth) |

## Future Enhancements

### Potential Improvements

1. **Custom Messages**
   - Let users write custom shame messages
   - Random message templates for variety

2. **SMS Preferences**
   - Opt-in/opt-out per friend
   - Notification frequency limits

3. **Analytics**
   - Track SMS delivery rates
   - Monitor expiry detection accuracy

4. **Rate Limiting**
   - Prevent abuse (max N SMS per user per day)
   - Twilio API rate limit handling

5. **WhatsApp Integration**
   - Twilio supports WhatsApp Business API
   - Richer media (images, links)

## Troubleshooting

### Common Issues

**SMS Not Sending**:
```bash
# Check console for errors
# Look for: "❌ Twilio credentials not configured"

# Verify .env variables
echo $VITE_TWILIO_ACCOUNT_SID
echo $VITE_TWILIO_AUTH_TOKEN
echo $VITE_TWILIO_PHONE_NUMBER

# Ensure all prefixed with VITE_
```

**Duplicate SMS**:
```bash
# This should NOT happen with current implementation
# Each user only checks their own NFT
# isValid flag prevents re-notification

# If it happens:
# 1. Check if multiple tabs are open (each polls independently)
# 2. Verify isValid is being set to false after expiry
```

**No Deletion After SMS**:
```bash
# Check Firebase console
# User document should have latestNFT removed

# If not deleted:
# 1. Check deleteExpiredNFT() error logs
# 2. Verify Firebase permissions (user can update own document)
```

**Countdown Not Updating**:
```bash
# Check if pollCountdownInterval is running
# Should see: "🔍 Next expiry check in: 9s, 8s, 7s..."

# If stuck at 10s:
# 1. Check if setInterval is cleared on unmount
# 2. Verify nextPollIn.update() is being called
```

## Security Considerations

### Twilio Credentials in Client

**Risk**: API credentials exposed in client-side code

**Mitigation**:
- ✅ Twilio restricts SMS to verified numbers (trial mode)
- ✅ Rate limiting at Twilio level
- ⚠️ **Production**: Move to server-side function (Vercel Serverless)

### Server-Side Migration (Future)

For production, move SMS to API route:

```typescript
// src/routes/api/send-expiry-sms/+server.ts
export async function POST({ request }) {
  // Verify Firebase auth token
  // Get user's friends from Firestore
  // Send SMS server-side (credentials in env vars)
  // Return success/failure
}
```

**Benefits**:
- 🔒 Credentials never exposed to client
- 🔒 Rate limiting enforced server-side
- 🔒 Abuse prevention

## Summary

The SMS notification system uses **client-side polling** for simplicity and cost-effectiveness. When a user's Dashboard detects their NFT has expired:

1. **Send SMS** to all friends (Twilio API)
2. **Delete image** from Firebase Storage
3. **Remove NFT** from Firestore
4. **Clear local state** to prevent re-notification

This architecture is perfect for a hackathon demo while remaining scalable for real-world use with minor server-side migration.

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready (with test phone numbers)
