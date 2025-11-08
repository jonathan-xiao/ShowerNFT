# 🚿 ShowerNFT - The Groom Protocol

> **Proof-of-Lather**: Because unverified hygiene is so 2024.

A humorous hackathon project tackling the age-old stereotype that CS students don't shower. Get shower-certified by minting time-limited NFTs that prove your cleanliness to the world!

**Built at UWaterloo Hackathon** 🦝💙

---

## 🎯 The Concept

In a world where CS students' hygiene is constantly questioned, **ShowerNFT** brings transparency and accountability through blockchain technology. Users complete a multi-step verification process to mint a "Proof-of-Lather" NFT valid for 24 hours.

### Key Features (Implemented & Planned)

- ✅ Multi-step verification flow (Tutorial → Audio Check → Memory Game)
- ✅ Gamified "Lather-Rinse-Repeat" cognitive challenge
- 🔜 NFT minting with 24-hour expiration
- 🔜 Wallet integration (MetaMask)
- 🔜 **Social accountability**: Friends get notified when you become "stinky"!
- 🔜 Shower streak tracking
- 🔜 Leaderboard of cleanest students
- 🔜 Photo verification with funny filters

---

## 🛠️ Tech Stack

- **Framework**: SvelteKit 2.x
- **Language**: TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **State**: Svelte Stores
- **Blockchain**: [Coming soon - Web3.js/Ethers.js]

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn

### Installation

```sh
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
npm run dev -- --open
```

### Build for Production

```sh
npm run build
npm run preview
```

---

## 📁 Project Structure

```
src/
├── lib/
│   ├── stores.ts              # Global state management
│   ├── components/
│   │   ├── Hero.svelte        # Landing page
│   │   ├── Tutorial.svelte    # Instructions
│   │   ├── Verification.svelte # Audio verification
│   │   ├── MiniGame.svelte    # Memory game
│   │   ├── Minting.svelte     # NFT creation
│   │   ├── Loading.svelte     # Processing state
│   │   └── Complete.svelte    # Success screen
│   └── assets/
└── routes/
    ├── +page.svelte           # Main app router
    └── +layout.svelte
```

---

## 🎮 User Flow

1. **Hero** → Learn about the Groom Protocol
2. **Tutorial** → Understand the verification process
3. **Verification** → Provide shower "proof" (audio simulation)
4. **MiniGame** → Complete the Lather-Rinse-Repeat challenge
5. **Minting** → Create your Proof-of-Lather NFT
6. **Complete** → View your certification

---

## 🤖 AI-Assisted Development

**This project is optimized for AI-assisted development!**

📖 **Read**: [`AI_DEVELOPMENT_GUIDE.md`](./AI_DEVELOPMENT_GUIDE.md) for comprehensive tips

🤖 **Context File**: `.github/copilot-instructions.md` (auto-loaded by GitHub Copilot)

### Quick AI Commands

```
# Ask Copilot for feature suggestions
@workspace Suggest a funny feature for ShowerNFT

# Create new component
#file:src/lib/components/ Create a Leaderboard.svelte component

# Debug issues
Why is my wallet connection not working? [paste error]
```

---

## 🎨 Design Philosophy

- **Humor First**: Satirical tone, blockchain buzzwords, meme-worthy features
- **Fast & Functional**: Hackathon speed > production polish
- **Visually Engaging**: TailwindCSS for rapid styling, emphasis on animations
- **Social**: Built for sharing and competitive cleanliness

---

## 🔮 Roadmap

### Phase 1: Core MVP ✅

- [x] Basic UI flow
- [x] Component architecture
- [x] Mini-game implementation

### Phase 2: Web3 Integration 🚧

- [ ] MetaMask wallet connection
- [ ] Smart contract deployment (Base/Polygon)
- [ ] NFT minting with metadata
- [ ] 24-hour expiry logic

### Phase 3: Social Features 🔜

- [ ] Friend list management
- [ ] Push notifications for "stinky" alerts
- [ ] Streak tracking & achievements
- [ ] Public leaderboard

### Phase 4: Polish 🎨

- [ ] Photo upload & filters
- [ ] Animated NFT badges
- [ ] Share to social media
- [ ] Sound effects & haptics

---

## 🧪 Development Commands

```sh
# Type checking
npm run check

# Watch mode for types
npm run check:watch

# Build
npm run build

# Preview production build
npm run preview
```

---

## 🤝 Contributing (Hackathon Team)

1. Check `.github/copilot-instructions.md` for project context
2. Use AI to scaffold new features rapidly
3. Maintain the humorous tone!
4. Test before pushing (or YOLO, it's a hackathon)

---

## 📜 License

MIT - Because open source hygiene is important.

---

## 🎤 Pitch

_"In a post-trust world, how do you prove you showered? ShowerNFT leverages blockchain technology to create verifiable, time-stamped proof of hygiene. With gamified verification, social accountability, and on-chain transparency, we're solving the cleanliness crisis one NFT at a time. No more awkward questions. No more doubt. Just pure, decentralized freshness."_

**Groom Protocol** - Decentralizing cleanliness for a better tomorrow. 🚿✨

---

**Made with 💙 (and hopefully soap) at UWaterloo**
