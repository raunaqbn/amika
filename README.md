# Amika — daily memories with friends

Amika is a private-by-default social memory app. Capture one photo or note from the day, connect it to the friends who were there, and build a living archive of the relationship over time.

## Product model

- **Daily memory ritual** — photo, caption, date, friend, and audience in one fast composer
- **Friends feed** — a chronological, conversational feed from accepted friends
- **Memory archive** — search and filter private, friends-only, and public moments
- **Public discovery** — an opt-in surface containing only memories explicitly marked public
- **Friend circles** — profiles organize shared memories and private notes around a person
- **Direct messages** — lightweight one-to-one conversation between accepted friends
- **Private journal** — reflective notes can remain private or be intentionally shared
- **Notifications** — friend requests, shared memories or notes, and unread messages

Trip planning, event planning, calendar synchronization, wishlists, and gamified friendship points are intentionally outside the product.

## Privacy

Every memory has an explicit audience:

- `private` — visible only to its author
- `friends` — the default; visible to accepted friends
- `public` — opt-in and eligible for Discover

Journal notes remain private unless the author deliberately shares one with a connected friend.

## Stack

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS and Radix/shadcn primitives
- Turso/libSQL persistence with a memory-first schema
- Vercel AI SDK for journal reflection assistance

## Local development

1. Install Node.js 20 or newer.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env` and configure Turso plus one supported AI provider.
4. Run `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npx tsc --noEmit
npm run build
npm run lint
```

## Design direction

The interface uses a “daily contact sheet” model: graphite framing, paper surfaces, periwinkle memory fields, citrus actions, coral reactions, and sky-blue people tags. It prioritizes content and conversation over follower metrics or performance signals. See `DESIGN.md` and `DESIGN_AUDIT.md` for the maintained system and audit notes.

## Deployment

Deploy to Vercel with the environment variables in `.env.example`. The app requires a Turso database, OAuth credentials for optional Google sign-in, and at least one configured AI provider for journal assistance.

## License

MIT
