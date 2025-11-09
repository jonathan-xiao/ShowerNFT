# 🚿 ShowerNFT - The Groom Protocol

> **Proof-of-Lather**: Because unverified hygiene is so 2024.

A humorous hackathon project tackling the age-old stereotype that CS students don't shower. Get shower-certified by minting time-limited NFTs that prove your cleanliness to the world!

**Built at UWaterloo Hackathon** 🦝💙

---

## 🎯 The Concept

In a world where CS students' hygiene is constantly questioned, **ShowerNFT** brings transparency and accountability through blockchain technology. Users authenticate with Google, connect their MetaMask wallet, complete an ML-powered pose detection tutorial, and mint a "Proof-of-Lather" NFT valid for 24 hours.

When your NFT expires, your friends get notified that you've become "stinky" — creating social accountability for hygiene!

### Current Features

- ✅ **Google Authentication** - Firebase Auth with user profiles
- ✅ **Wallet Integration** - MetaMask connection with Base Sepolia testnet
- ✅ **Interactive Pose Tutorial** - TensorFlow.js MoveNet pose detection for shower gesture verification
- ✅ **NFT Minting** - ERC-721 smart contract with custom timeout & metadata storage
- ✅ **Gamified Verification** - Memory games and mini-challenges
- ✅ **User Dashboard** - Real-time countdown timer showing NFT validity
- ✅ **Firebase Backend** - User profiles, latest NFT status, friend phone numbers
- ✅ **Image Upload** - Client-side Firebase Storage with automatic deletion on expiry
- ✅ **SMS Notifications** - Twilio integration with 10-second client-side polling
- ✅ **Automatic Cleanup** - Expired NFTs deleted from Firebase (Firestore + Storage)
- ✅ **Vercel Deployment** - CI/CD with auto-deploy from GitHub

### Planned Features

- 🔜 **User Discovery** - Browse other users' hygiene status
- 🔜 **Enhanced Smart Contract Deployment** - Deploy ShowerNFTv2 to Base Sepolia
- 🔜 **Blockchain Auto-Burn** - Chainlink Automation for on-chain NFT burning
- 🔜 **Streak Tracking** - Leaderboard of cleanest students
- 🔜 **Photo Filters** - Fun shower selfie filters and stickers

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: SvelteKit 2.x with TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **State Management**: Svelte Stores

### Backend & Services

- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore (user profiles, latest NFT status, friends)
- **Storage**: Firebase Storage (shower selfie images with auto-deletion)
- **Blockchain**: ethers.js v6, MetaMask, Base Sepolia testnet
- **Smart Contract**: ShowerNFTv2 ERC-721 with metadata & custom expiry
- **ML**: TensorFlow.js with MoveNet Lightning (pose detection)
- **Notifications**: Twilio SMS (10-second client-side polling)
- **Deployment**: Vercel (auto-deploy from GitHub, no cron needed)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Firebase project with Auth + Firestore enabled
- (Optional) Twilio account for SMS notifications

### Installation

```bash
# Clone the repository
git clone https://github.com/LeEhteshaam/UI_ShowerNFT.git
cd UI_ShowerNFT

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase, Twilio credentials

# Start development server
npm run dev
```

Visit `http://localhost:5173` and test with a 1-minute timeout for quick expiry testing!

### Environment Variables

Create a `.env` file with:

```bash
# Firebase (all prefixed with VITE_ for client access)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Twilio (client-side access for SMS)
VITE_TWILIO_ACCOUNT_SID=
VITE_TWILIO_AUTH_TOKEN=
VITE_TWILIO_PHONE_NUMBER=
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── stores.ts                    # Global state management (Svelte stores)
│   ├── firebase.ts                  # Firebase config & initialization
│   ├── authService.ts               # Auth, Firestore, Storage, SMS notifications
│   ├── web3.ts                      # Web3 utilities (wallet, minting)
│   ├── alchemyService.ts            # Alchemy API (DEPRECATED - not used)
│   ├── components/
│   │   ├── Login.svelte             # Google Sign-In
│   │   ├── Onboarding.svelte        # Wallet + friends setup
│   │   ├── Dashboard.svelte         # Homepage with 24hr countdown
│   │   ├── Hero.svelte              # Landing page
│   │   ├── Tutorial.svelte          # Instructions
│   │   ├── ShowerTutorial.svelte    # ML pose detection tutorial
│   │   ├── WebcamFeed.svelte        # Webcam access component
│   │   ├── PoseOverlay.svelte       # TensorFlow.js pose detection
│   │   ├── ShowerStep.svelte        # Gesture validation
│   │   ├── Verification.svelte      # Audio/sensor verification
│   │   ├── MiniGame.svelte          # Memory game wrapper
│   │   ├── SequenceGame.svelte      # Lather-Rinse-Repeat game
│   │   ├── Minting.svelte           # NFT creation form
│   │   ├── Loading.svelte           # Transaction processing
│   │   └── Complete.svelte          # Success screen
│   └── ml/
│       └── poseDetector.ts          # TensorFlow.js MoveNet integration
└── routes/
    ├── +page.svelte                 # Main app with component routing
    ├── +layout.svelte
    └── api/
        └── check-expired-nfts/
            └── +server.ts           # Legacy API endpoint (NOT USED)

.github/
├── copilot-instructions.md          # AI development guide
├── google_firebase_design.md        # Firebase architecture docs
├── sms_design.md                    # SMS notification system ⭐ NEW
├── shower_tutorial_design.md        # ML pose detection technical docs
├── upgraded_smart_contract.md       # ShowerNFTv2 upgrade documentation
└── vercel_design.md                 # Deployment & CI/CD guide

ShowerNFT.sol                        # ERC-721 smart contract
vercel.json                          # Vercel config + cron jobs
```

---

## 🎮 User Flow

1. **Hero** → Learn about the Groom Protocol
2. **Login** → Google Sign-In with Firebase Auth
3. **Onboarding** → Connect MetaMask wallet + add friend phone numbers
4. **Dashboard** → Homepage with 24hr countdown timer + "Freshen Up" button
5. **Tutorial** → Understand the verification process (skipped if completed before)
6. **ShowerTutorial** → Interactive ML pose detection (4 gestures, 10 seconds each)
7. **Verification** → Audio/sensor input + pose validation
8. **MiniGame** → Complete the Lather-Rinse-Repeat memory challenge
9. **Minting** → Create your Proof-of-Lather NFT (enter shower thought)
10. **Loading** → Transaction processing on Base Sepolia
11. **Complete** → View success, OpenSea link, return to Dashboard

---

## 🔗 Key Integrations

### Firebase Backend

- **Google OAuth** for user authentication
- **Firestore** stores user profiles, latest NFT status (single object), friend phone numbers
- **Firebase Storage** for shower selfie images with automatic deletion on expiry
- **Client-side operations** for seamless auth context
- 📖 **Details**: See `.github/google_firebase_design.md`

### SMS Notifications

- **Twilio API** for sending SMS to friends on NFT expiry
- **Client-side polling** every 10 seconds (no Vercel cron needed)
- **Automatic cleanup** deletes expired NFTs from Firestore + Storage
- **Visual debug timer** shows seconds until next check
- 📖 **Details**: See `.github/sms_design.md`

### ML Pose Detection

- **TensorFlow.js** with MoveNet Lightning model
- **Real-time skeleton visualization** at 30 FPS
- **4 shower gestures**: Rub hands, scrub head, scrub arms, scrub armpits
- **Smart timer** that pauses when gesture detection fails (prevents cheating)
- 📖 **Details**: See `.github/shower_tutorial_design.md`

### Blockchain

- **Smart Contract**: `ShowerNFTv2.sol` (awaiting deployment to Base Sepolia)
- **ERC-721** with custom timeout, metadata storage (shower thought + image URL)
- **MetaMask** integration with auto-network switching and 5-minute confirmation timeout
- **Firebase as source of truth** - Blockchain NFTs are permanent, Firebase tracks active status
- **OpenSea Testnet** integration for viewing minted NFTs
- 📖 **Details**: See `.github/upgraded_smart_contract.md`

### Deployment

- **Vercel** serverless hosting with auto-deploy from GitHub
- **No cron jobs needed** - client-side polling handles expiry checks
- **Environment variables** managed via Vercel dashboard
- 📖 **Details**: See `.github/vercel_design.md`

---

## 📚 Documentation

Detailed technical documentation is available in `.github/`:

- **[`copilot-instructions.md`](.github/copilot-instructions.md)** - AI development guide, project context, roadmap
- **[`google_firebase_design.md`](.github/google_firebase_design.md)** - Firebase architecture, database schema, API functions
- **[`sms_design.md`](.github/sms_design.md)** - ⭐ **NEW**: SMS notification system with client-side polling
- **[`shower_tutorial_design.md`](.github/shower_tutorial_design.md)** - ML pose detection implementation, performance optimizations
- **[`upgraded_smart_contract.md`](.github/upgraded_smart_contract.md)** - ShowerNFTv2 technical documentation
- **[`vercel_design.md`](.github/vercel_design.md)** - Deployment setup, CI/CD pipeline, troubleshooting

---

## 🧪 Development Commands

```bash
# Type checking
npm run check

# Watch mode for types
npm run check:watch

# Build
npm run build

# Preview production build
npm run preview

# Format code
npm run format
```

---

## 🎨 Design Philosophy

- **Humor First**: Satirical tone, blockchain buzzwords, meme-worthy features
- **Fast & Functional**: Hackathon speed > production polish
- **Visually Engaging**: TailwindCSS for rapid styling, smooth animations
- **Social Accountability**: Built for sharing and competitive cleanliness
- **ML-Powered**: Real pose detection prevents cheating

---

## 🔮 Roadmap

### ✅ Completed Features

- [x] Google Authentication with Firebase
- [x] MetaMask wallet integration
- [x] ML-powered pose detection tutorial (TensorFlow.js)
- [x] Smart contract with custom timeout and metadata (ShowerNFTv2)
- [x] NFT minting with configurable expiry
- [x] User dashboard with real-time countdown timer
- [x] Firestore backend (user profiles, latest NFT status, friends)
- [x] Firebase Storage with automatic image deletion on expiry
- [x] Client-side image upload
- [x] SMS notifications via Twilio (10-second polling)
- [x] Automatic NFT cleanup (Firestore + Storage)
- [x] Visual debug countdown timer
- [x] Vercel deployment with CI/CD
- [x] Memory game verification
- [x] Tutorial skip for returning users
- [x] Firebase as single source of truth (not blockchain)

### 🚧 In Progress

- [ ] Deploy ShowerNFTv2 to Base Sepolia (contract ready, awaiting deployment)
- [ ] User discovery page (search by email, view NFT status)

### 🔜 Planned Features

- [ ] Blockchain auto-burn (Chainlink Automation)
- [ ] Real-time blockchain countdown (query contract for expiry)
- [ ] Streak tracking & achievements
- [ ] Public leaderboard of cleanest students
- [ ] Photo verification with filters
- [ ] OpenSea metadata with custom NFT images

---

## 🤖 AI-Assisted Development

This project is optimized for AI pair programming!

- 📖 **Context File**: `.github/copilot-instructions.md` (auto-loaded by GitHub Copilot)
- 🛠️ **Design Docs**: Comprehensive `.github/*.md` files for each integration
- 💡 **Quick Tips**: Reference `#file:.github/copilot-instructions.md` for project conventions

---

## 🧪 Testing

### Local Testing

```bash
# Run dev server
npm run dev

# Test wallet connection (requires MetaMask)
# Visit http://localhost:5173

# Test SMS notifications (1-minute timeout)
# 1. Mint NFT with custom timeout: 1 minute
# 2. Watch console: "🔍 Next expiry check in: 10s"
# 3. Wait 60 seconds
# 4. Should see: "📱 Sending SMS to X friends..."
# 5. Check phone for SMS
```

### Production Testing

- **Auto-deploy**: Push to `main` branch triggers Vercel deployment
- **Preview URLs**: All branches get preview deployments
- **Cron Jobs**: Monitor in Vercel dashboard → Functions tab

---

## 🛠️ Troubleshooting

### Common Issues

**Wallet won't connect:**

- Ensure MetaMask is installed and unlocked
- Check console for network mismatch errors
- Verify Base Sepolia is added to MetaMask

**Firebase auth fails:**

- Add Vercel domain to Firebase Authorized Domains
- Check environment variables are prefixed with `VITE_`

**Pose detection not working:**

- Allow camera permissions in browser
- Check WebGL 2.0 support (chrome://gpu)
- Wait for model to load (~5-10 seconds)

**SMS not sending:**

- Verify Twilio credentials in `.env` (all prefixed with `VITE_`)
- Check console for errors: "❌ Twilio credentials not configured"
- Ensure phone numbers are verified in Twilio (trial mode)
- Check polling is active: "🔍 Next expiry check in: Xs"

**NFT not deleted after expiry:**

- Check Firebase console for `latestNFT` field removal
- Verify polling interval is running (check debug timer)
- Ensure user is logged in when expiry occurs

**Build errors:**

- Run `npm run check` to see TypeScript errors
- Verify all imports use `$lib/` alias
- Check `svelte.config.js` adapter configuration

📖 **More troubleshooting**: See individual design docs in `.github/`

📖 **More troubleshooting**: See individual design docs in `.github/`

---

## 🤝 Contributing

This is a hackathon project, but contributions are welcome!

1. Check `.github/copilot-instructions.md` for project context and conventions
2. Create a feature branch from `main`
3. Make your changes, maintaining the humorous tone
4. Run `npm run check` to verify TypeScript
5. Submit a pull request with a funny description

---

## 📜 License

MIT - Because open source hygiene is important.

---

## 🎤 Pitch

_"In a post-trust world, how do you prove you showered? ShowerNFT leverages blockchain technology to create verifiable, time-stamped proof of hygiene. With ML-powered verification, gamified challenges, social accountability, and on-chain transparency, we're solving the cleanliness crisis one NFT at a time. No more awkward questions. No more doubt. Just pure, decentralized freshness."_

**Groom Protocol** - Decentralizing cleanliness for a better tomorrow. 🚿✨

---

**Made with 💙 (and hopefully soap) at UWaterloo**

---

## 🔗 Links

- **Smart Contract**: [BaseScan](https://sepolia.basescan.org/address/0x4068028D9161B31c3dde5C5C99C4F12205b6C7b7)
- **OpenSea**: [View NFTs on Testnet](https://testnets.opensea.io/collection/showernft)
- **Repository**: [GitHub](https://github.com/LeEhteshaam/UI_ShowerNFT)
