---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/dashboard.tsx","src/components/nav.tsx","src/app/memories/page.tsx","src/app/explore/page.tsx"]
---

# Memory-first application shell

- Scope: authenticated home feed and the shared shell used by memories, friends, discovery, messages, journal, notifications, and profile.
- Visitor mode: Operate.
- Audience and job: a friend recording a small moment quickly, choosing its audience, and revisiting or responding to the history they share with people they know.
- Primary task: add today's memory with photo, caption, friends, date, and visibility without leaving the feed.
- Supporting content: recent friend memories, reactions and reply trails, active friends, notifications, and dated flashbacks.
- Constraints: friends-only is the default social audience; public discovery is opt-in; private journal content never enters the social feed; no trip, event, calendar, itinerary, or planning language.

## Chosen direction

Group Chat Scrapbook using the Daily Contact Sheet composition. A full-width periwinkle daily band makes the composer unmistakable, followed by a varied but orderly photo contact sheet with inline conversation and a flashback rail. The memorable moment is adding a photo, tagging friends, and choosing an audience in one uninterrupted surface.

Approved composition: `.impeccable/mocks/home-daily-contact-sheet-approved.png`

## Implementation inventory

| Visible ingredient | Medium | Decision |
| --- | --- | --- |
| Ink application shell and navigation | Semantic HTML/CSS | Produce in code with desktop rail and mobile bottom bar. |
| Periwinkle daily band | Semantic HTML/CSS | Produce in code; no gradient or raster texture. |
| Daily memory composer | Semantic form controls | Produce in code with photo, caption, tags, date, and visibility states. |
| Memory photos | Existing project/user assets | Render `imageUrl` when present; use a deliberate text-memory treatment otherwise. Do not ship synthetic people. |
| Friend avatars | Existing profile images plus initials fallback | Reuse the data layer and accessible labels. |
| Contact-sheet feed rhythm | Semantic HTML/CSS | Use one dominant memory followed by compact memories; collapse to one column on mobile. |
| Reactions, replies, privacy, and navigation icons | Lucide icon library | Keep labels or accessible names on every icon-only action. |
| Timestamp strips and friend tags | Semantic HTML/CSS | Compact square-edged labels, not generic floating pills. |
| Flashback rail | Existing memory data | Derive from older memories when available; use a useful empty state otherwise. |
| Motion | CSS | One short entry sequence and tactile pressed states; disable under reduced motion. |

## Unresolved decisions

- Direct-message persistence does not currently exist independently of planning chats; the redesign will establish the messaging surface and retain a clear integration boundary for the eventual message backend.
