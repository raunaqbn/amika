# Amika - Nurture Your Friendships 🌿

A minimal friendship management app to help you stay connected with the people who matter most.

## Features

- **Friends List** - Add and manage friends with birthdays, notes, and contact history
- **Friend Profiles** - View detailed friend information and add memories
- **Home Dashboard** - See upcoming birthdays and friends you haven't contacted recently
- **Mirror AI** - Chat with an AI relationship coach for advice on being a better friend

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: SQLite with Prisma
- **AI**: Google Gemini via Vercel AI SDK
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Google AI API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd amika
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your Google AI API key:
```
GOOGLE_GENERATIVE_AI_API_KEY=your-key-here
```

4. Initialize the database:
```bash
npx prisma db push
npx prisma generate
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Home - birthdays + nudges
│   ├── friends/
│   │   ├── page.tsx          # Friends list
│   │   └── [id]/page.tsx     # Friend profile
│   ├── mirror/page.tsx       # AI chat
│   ├── api/
│   │   ├── friends/route.ts  # CRUD API
│   │   ├── memories/route.ts
│   │   └── chat/route.ts     # AI streaming
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── friend-card.tsx
│   ├── add-friend-dialog.tsx
│   ├── memory-list.tsx
│   ├── chat-interface.tsx
│   └── nav.tsx
└── lib/
    ├── db.ts                 # Prisma client
    └── ai.ts                 # Gemini setup
```

## Deployment to Vercel

1. Push your code to GitHub

2. Import your repository in Vercel

3. Add your environment variable:
   - `GOOGLE_GENERATIVE_AI_API_KEY`

4. Deploy!

Vercel will automatically detect Next.js and configure the build settings.

## Design

- **Colors**:
  - Background: `#FFFBF5` (warm white)
  - Primary: `#A8C5A8` (sage green)
  - Accent: `#D4A5A5` (rose)
- **Typography**: Geist Sans
- **Style**: Warm, friendly, rounded corners
- **Layout**: Mobile-first with bottom navigation

## License

MIT

---

Built with ❤️ for better friendships
