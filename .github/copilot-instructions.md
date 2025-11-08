# GitHub Copilot Instructions for ShowerNFT Project

## Project Overview

**ShowerNFT - The Groom Protocol** is a humorous hackathon project at UWaterloo that addresses the stereotype of CS students not showering. Users verify their hygiene by minting time-limited "Proof-of-Lather" NFTs valid for 24 hours.

## Core Concept

- **Purpose**: Gamified shower verification app with blockchain NFTs
- **Humor**: CS student hygiene stereotype + crypto culture satire
- **Features**: Audio verification, mini-games, 24-hour NFT expiry, social accountability (push notifications to friends when someone becomes "stinky")

## Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: TailwindCSS v4
- **Build Tool**: Vite
- **State Management**: Svelte stores (writable)
- **Blockchain**: [TO BE IMPLEMENTED - suggest web3 libraries]

## Project Structure

```
src/
├── lib/
│   ├── stores.ts          # Global state management
│   ├── components/         # UI components for each flow step
│   │   ├── Hero.svelte
│   │   ├── Tutorial.svelte
│   │   ├── Verification.svelte
│   │   ├── MiniGame.svelte
│   │   ├── Minting.svelte
│   │   ├── Loading.svelte
│   │   └── Complete.svelte
│   └── assets/
└── routes/
    ├── +page.svelte       # Main app with component routing
    └── +layout.svelte
```

## Current Flow

1. **Hero** - Landing page with "Groom Protocol" branding
2. **Tutorial** - Instructions for shower verification
3. **Verification** - Audio/sensor input (simulated)
4. **MiniGame** - Lather-Rinse-Repeat sequence memory game
5. **Minting** - NFT creation process
6. **Loading** - Transaction processing
7. **Complete** - Success confirmation

## State Management Pattern

All views are managed through `stores.ts`:

```typescript
export const view = writable("hero");
export function showView(viewName: string) {
  view.set(viewName);
}
```

Components use: `import { showView } from '$lib/stores';`

## Code Style & Conventions

- **TypeScript**: Use TypeScript for all logic
- **Components**: Use `<script lang="ts">` in Svelte files
- **Styling**: TailwindCSS utility classes (no custom CSS unless necessary)
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Imports**: Use `$lib/` alias for library imports

## Tone & Content

- **Humor**: Maintain satirical/ironic tone about hygiene verification
- **Branding**: "Groom Protocol", "Proof-of-Lather", blockchain buzzwords
- **UX**: Simple, fast, gamified - this is a hackathon project!

## Development Priorities

1. **Speed > Perfection**: This is a hackathon - ship fast!
2. **Meme Value**: Funny features > technical sophistication
3. **Demo-Ready**: Focus on visual polish and storytelling

## Planned Features (Not Yet Implemented)

- [ ] Blockchain integration (wallet connection, NFT minting)
- [ ] Timer/countdown for 24-hour NFT validity
- [ ] Push notification system for "stinky" alerts
- [ ] Friend list / social features
- [ ] Photo upload for shower selfies
- [ ] Streak tracking
- [ ] Leaderboard of "cleanest" students
- [ ] NFT gallery/badge display
- [ ] Mock sensor data (accelerometer, microphone)

## When Suggesting New Features

- Prioritize features that are **funny and demo-worthy**
- Keep implementation **simple** (hackathon timeline!)
- Suggest **visual** features that make good screenshots
- Consider **social/multiplayer** elements for virality

## Common Tasks

- **New view**: Create component in `src/lib/components/`, add to routing in `+page.svelte`
- **New state**: Add to `stores.ts` with writable store
- **Styling**: Use TailwindCSS classes, maintain consistent spacing/shadows
- **Navigation**: Use `showView('viewName')` function

## Blockchain Integration Notes

When implementing:

- Use **MetaMask** for wallet connection
- Consider **Base** for low fees
- NFT metadata should include: timestamp, expiry time, user identifier
- Smart contract should auto-expire NFTs after 24 hours

## Testing/Running

- Dev server: `npm run dev`
- Build: `npm run build`
- Type checking: `npm run check`

---

**Remember**: This is a meme project! Embrace the absurdity. Make it funny, make it fast, make it demo-able! 🚿✨
