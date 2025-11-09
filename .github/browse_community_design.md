# Browse Community Design Documentation

## Overview

The **Browse Community** feature allows users to view the hygiene status of all other registered users in the ShowerNFT ecosystem. This creates a social accountability layer where users can see who's "FRESH ✨" and who's "STINKY 🤢" in real-time.

## User Interface

### Navigation

- **Entry Point**: Purple "👥 Browse Community" button on the Dashboard
- **Exit Point**: "← Back to Dashboard" button at the top of the page

### Layout

The page displays a **responsive grid** of user cards:
- **Mobile**: 1 column layout
- **Desktop**: 2 column layout
- **Max Width**: 6xl (1280px) container centered on page

### Progress Indicator

At the top of the page:
```
👥 Community Hygiene Status
Check if your fellow CS students are fresh or stinky!
```

## User Card Components

Each user card displays the following information:

### 1. Profile Section
- **Profile Picture**: User's Google profile photo (or first initial in a circle)
- **Display Name**: Full name from Google account
- **Wallet Address**: Truncated format (0x1234...5678) in monospace font

### 2. Status Badge
Positioned in the top-right corner with rotation effect:
- **FRESH! ✨**: Green badge on white background (for valid NFTs)
- **STINKY! 🤢**: Red pulsing badge (for expired/missing NFTs)

### 3. NFT Image Display

**Valid NFT (Fresh):**
- Actual shower selfie from Firebase Storage
- 48px height, object-cover, rounded corners
- NFT token ID badge in top-right corner ("NFT #42")

**Invalid/Expired NFT (Stinky):**
- Gray placeholder with large emoji (😷)
- Maintains same dimensions as image cards

### 4. Shower Thought

**Valid NFT:**
```
💭 "Water is just boneless ice"
```
- Blue border-left accent
- Light blue background
- Italic text styling

**Invalid/Expired NFT:**
```
💭 No profound thoughts recorded...
```
- Gray border-left accent
- Gray background
- Muted text color

### 5. Countdown Timer

**Valid NFT (Fresh):**
- Real-time countdown in HH:MM:SS format
- Three blue boxes with white text
- Updates every second
- Label: "Time Until Stinky:"

**Invalid/Expired NFT (Stinky):**
```
❌ No Valid NFT
This user needs to shower!
```
- Red error box with centered text

### 6. BaseScan Link

**Valid NFT:**
- Button: "📜 View on BaseScan →"
- Opens transaction in new tab: `https://sepolia.basescan.org/tx/{txHash}`
- Dark gray background, white text

**Invalid/Expired NFT:**
- Disabled button: "📜 No Transaction Available"
- Gray background, cursor not-allowed

## Technical Implementation

### Component Architecture

**File**: `src/lib/components/BrowseUsers.svelte`

### State Management

```typescript
let users: UserCard[] = [];
let isLoading: boolean = true;
let errorMessage: string = "";
let currentTime: number = Math.floor(Date.now() / 1000); // Unix timestamp
```

### Data Structure

```typescript
type UserCard = {
  uid: string;
  displayName: string;
  photoURL?: string;
  walletAddress?: string;
  latestNFT?: {
    tokenId: number;
    expiresAt: number;      // Unix timestamp (seconds)
    mintTime: number;       // Unix timestamp (seconds)
    showerThought: string;
    imageUrl: string;
    txHash: string;
    isActive: boolean;
  };
};
```

### Live Countdown System

**Challenge**: Svelte doesn't automatically re-render when time passes.

**Solution**: 
1. `currentTime` state updated every second via `setInterval`
2. Pass `currentTime` as parameter to `getUserStatus(user, now)`
3. Each block keyed by `user.uid` for efficient tracking
4. Reactive statement: `{@const status = getUserStatus(user, currentTime)}`

```typescript
onMount(() => {
  loadUsers();
  
  // Update time every second
  interval = setInterval(() => {
    currentTime = Math.floor(Date.now() / 1000);
  }, 1000);

  return () => {
    if (interval) clearInterval(interval);
  };
});
```

### Status Calculation

```typescript
function getUserStatus(user: UserCard, now: number) {
  if (!user.latestNFT || !user.latestNFT.isActive) {
    return {
      isValid: false,
      timeRemaining: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      statusText: "STINKY! 🤢",
      statusColor: "text-red-600",
    };
  }

  const remaining = user.latestNFT.expiresAt - now;

  if (remaining <= 0) {
    return {
      isValid: false,
      // ... stinky status
    };
  }

  return {
    isValid: true,
    timeRemaining: remaining,
    hours: Math.floor(remaining / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
    statusText: "FRESH! ✨",
    statusColor: "text-green-600",
  };
}
```

## Backend Integration

### Firebase Function

**File**: `src/lib/authService.ts`

**Function**: `getAllUsers()`

```typescript
export async function getAllUsers() {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    console.log(`✅ Loaded ${users.length} total users`);
    return { success: true, users };
  } catch (error: any) {
    console.error('Error fetching all users:', error);
    return { success: false, error: error.message };
  }
}
```

### Data Source

- **Primary**: Firestore `users` collection
- **Fields Used**:
  - `uid` - User ID (document ID)
  - `displayName` - User's name from Google
  - `photoURL` - Google profile picture URL
  - `walletAddress` - Connected MetaMask address
  - `latestNFT` - Object with NFT data (or undefined)

### Filtering

```typescript
users = (result.users as any[]).filter((u: any) => 
  u.uid !== $currentUser?.uid
);
```
- **Current user excluded** - Users don't see themselves
- **All other users shown** - Regardless of NFT status

## User Experience

### Empty State

When no other users have joined:
```
🚿 You're the First One!
No other users have joined the Groom Protocol yet. Tell your friends!
```

### Loading State

While fetching users:
```
🔍 Loading users...
```

### Error State

If Firestore query fails:
```
❌ Error
Failed to load users
```

### Refresh Functionality

- **Button**: "🔄 Refresh Users" at bottom of page
- **Action**: Re-fetches all user data from Firestore
- **Loading**: Button shows "🔄 Loading..." and is disabled during fetch

## Visual Design

### Color Scheme

**Fresh Users:**
- Border: `border-green-500`
- Badge: `bg-green-500`
- Timer boxes: `bg-blue-600`

**Stinky Users:**
- Border: `border-red-500`
- Badge: `bg-red-500` with `animate-pulse`
- Error box: `bg-red-100` with `border-red-400`

### Hover Effects

- **Card**: `hover:scale-105` (slight zoom on hover)
- **BaseScan Button**: `hover:bg-gray-800`
- **Refresh Button**: `hover:bg-blue-700`

### Accessibility

- **Profile Pictures**: Alt text with user's display name
- **Buttons**: Clear text labels and hover states
- **Status**: High contrast text colors for readability

## Performance Considerations

### Optimizations

1. **Reactive Countdown**: Only recalculates status when `currentTime` changes
2. **Keyed Each Block**: `{#each users as user (user.uid)}` for efficient DOM updates
3. **Image Lazy Loading**: Browser handles image loading natively
4. **Single Interval**: One `setInterval` for all countdowns (not per-user)

### Scalability

- **Current**: Fetches all users on mount (fine for hackathon scale)
- **Future**: Implement pagination for 100+ users
- **Future**: Add search/filter functionality for large communities

## Integration Points

### Component Registration

**File**: `src/routes/+page.svelte`

```typescript
import BrowseUsers from "$lib/components/BrowseUsers.svelte";

const components = {
  // ...
  browseusers: BrowseUsers,
  // ...
};
```

### Navigation

**From Dashboard**:
```typescript
showView("browseusers")
```

**To Dashboard**:
```typescript
showView("dashboard")
```

## Future Enhancements

### Planned Features

1. **Search by Email** - Filter users by email address
2. **Sort Options** - By NFT expiry time, name, wallet address
3. **Filter Options** - Show only fresh, only stinky, or all
4. **User Profiles** - Click card to view detailed user profile
5. **Streak Display** - Show user's longest shower streak
6. **Ranking System** - Leaderboard integration
7. **Friend Highlighting** - Emphasize users in your friends list

### Technical Improvements

1. **Pagination** - Load users in batches of 20
2. **Real-time Updates** - Firestore listeners for live data
3. **Image Optimization** - Compress/resize profile pictures
4. **Caching** - Store user data locally with TTL
5. **Infinite Scroll** - Progressive loading as user scrolls

## Testing Scenarios

### Test Cases

1. **Empty Community**
   - New user signs in
   - No other users exist
   - Shows "You're the First One!" message

2. **Fresh User**
   - User has valid NFT (not expired)
   - Green border, FRESH badge
   - Countdown ticking down
   - NFT image visible
   - Shower thought displayed

3. **Stinky User**
   - User's NFT expired or never created
   - Red border, STINKY badge (pulsing)
   - Gray placeholder image
   - "No Valid NFT" message

4. **Mixed Community**
   - Some users fresh, some stinky
   - Cards update independently
   - Countdown timers all tick simultaneously

5. **Real-time Expiry**
   - User's NFT expires while viewing page
   - Card automatically updates from fresh → stinky
   - Status badge changes
   - Countdown replaced with error message

6. **Refresh Functionality**
   - Click refresh button
   - Button disabled during loading
   - New user data loaded
   - Cards update with latest info

## Security & Privacy

### Public Information

- User can see all registered users
- No authentication required to view (once logged in)
- Email addresses **not displayed** (privacy protection)

### Data Exposed

**Public**:
- Display name (from Google)
- Profile picture (from Google)
- Wallet address (public blockchain info)
- NFT status (fresh or stinky)
- NFT image (if active)
- Shower thought (if active)
- Transaction hash (public blockchain info)

**Private**:
- Email address
- Phone numbers
- Full NFT history
- Mint timestamps beyond current NFT

### Firebase Rules

Ensure Firestore rules allow read access to all users:

```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Anyone authenticated can read user profiles
      allow read: if request.auth != null;
      
      // Only the user can write to their own profile
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Troubleshooting

### Common Issues

**Cards not updating:**
- Check `currentTime` interval is running
- Verify `getUserStatus` receives `currentTime` parameter
- Ensure `{#each}` block uses `(user.uid)` key

**No users showing:**
- Check Firestore rules allow read access
- Verify `getAllUsers()` function returns data
- Check console for error messages

**Images not loading:**
- Verify Firebase Storage CORS configuration
- Check image URLs are valid in Firestore
- Ensure Storage bucket is publicly readable

**Countdown not ticking:**
- Verify `setInterval` is running (check `onMount`)
- Ensure `currentTime` is passed to `getUserStatus`
- Check Svelte reactivity with `{@const status = ...}`

---

**Last Updated**: January 2025  
**Status**: ✅ Fully Implemented  
**Version**: 1.0.0
