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
- ✅ **NFT Minting** - ERC-721 smart contract with 24-hour expiry logic
- ✅ **Gamified Verification** - Memory games and mini-challenges
- ✅ **User Dashboard** - 24-hour countdown timer showing NFT validity
- ✅ **Firebase Backend** - User profiles, NFT history, friend phone numbers
- ✅ **Vercel Deployment** - CI/CD with auto-deploy from GitHub

### Planned Features

- 🔜 **SMS Notifications** - Twilio integration to notify friends when NFT expires
- 🔜 **User Discovery** - Browse other users' hygiene status
- 🔜 **Enhanced Smart Contract** - Custom timeouts for demo, auto-burn on expiry
- 🔜 **Streak Tracking** - Leaderboard of cleanest students
- 🔜 **Photo Verification** - Shower selfies with funny filters

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: SvelteKit 2.x with TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **State Management**: Svelte Stores

### Backend & Services

- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore (user profiles, NFT history, friends)
- **Blockchain**: ethers.js v6, MetaMask, Base Sepolia testnet
- **Smart Contract**: ERC-721 NFT with 24-hour expiry
- **ML**: TensorFlow.js with MoveNet Lightning (pose detection)
- **Deployment**: Vercel (serverless functions, cron jobs)
- **Notifications**: Twilio SMS (configured, not yet implemented)

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

# Twilio (server-side only)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Vercel Cron
CRON_SECRET=your_random_secret_string
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
│   ├── authService.ts               # Auth & Firestore operations
│   ├── web3.ts                      # Web3 utilities (wallet, minting)
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
            └── +server.ts           # Serverless cron for SMS notifications

.github/
├── copilot-instructions.md          # AI development guide
├── google_firebase_design.md        # Firebase architecture docs
├── shower_tutorial_design.md        # ML pose detection technical docs
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
- **Firestore** stores user profiles, NFT history, friend phone numbers
- **Auto-loading** of wallet address and tutorial completion status
- 📖 **Details**: See `.github/google_firebase_design.md`

### ML Pose Detection

- **TensorFlow.js** with MoveNet Lightning model
- **Real-time skeleton visualization** at 30 FPS
- **4 shower gestures**: Rub hands, scrub head, scrub arms, scrub armpits
- **Smart timer** that pauses when gesture detection fails (prevents cheating)
- 📖 **Details**: See `.github/shower_tutorial_design.md`

### Blockchain

- **Smart Contract**: `ShowerNFT.sol` deployed to Base Sepolia (`0x4068028D9161B31c3dde5C5C99C4F12205b6C7b7`)
- **ERC-721** with 24-hour expiry logic (`isValid()`, `timeRemaining()`, `expiryTime()`)
- **MetaMask** integration with auto-network switching
- **OpenSea Testnet** integration for viewing minted NFTs

### Deployment

- **Vercel** serverless hosting with auto-deploy from GitHub
- **Cron jobs** (hourly) to check expired NFTs and trigger SMS notifications
- **Environment variables** managed via Vercel dashboard
- 📖 **Details**: See `.github/vercel_design.md`

---

## � Documentation

Detailed technical documentation is available in `.github/`:

- **[`copilot-instructions.md`](.github/copilot-instructions.md)** - AI development guide, project context, roadmap
- **[`google_firebase_design.md`](.github/google_firebase_design.md)** - Firebase architecture, database schema, API functions
- **[`shower_tutorial_design.md`](.github/shower_tutorial_design.md)** - ML pose detection implementation, performance optimizations
- **[`vercel_design.md`](.github/vercel_design.md)** - Deployment setup, CI/CD pipeline, cron jobs, troubleshooting

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
- [x] Smart contract deployment to Base Sepolia
- [x] NFT minting with 24-hour expiry
- [x] User dashboard with countdown timer
- [x] Firestore backend (user profiles, NFT history, friends)
- [x] Vercel deployment setup with CI/CD
- [x] Memory game verification

### 🚧 In Progress

- [ ] SMS notifications via Twilio (configured, needs implementation)
- [ ] User discovery page (search by email, view NFT status)
- [ ] Enhanced smart contract with custom timeouts

### 🔜 Planned Features

- [ ] Real-time blockchain countdown (query contract instead of mock timer)
- [ ] Auto-burn NFT on expiry
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

# Test cron endpoint (requires .env setup)
curl -X GET http://localhost:5173/api/check-expired-nfts \
  -H "Authorization: Bearer ${CRON_SECRET}"
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
