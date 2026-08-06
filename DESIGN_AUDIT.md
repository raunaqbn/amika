# Amika memory-first product and design audit

Date: 2026-08-05

Repository: `raunaqbn/amika`
Implementation branch: `codex/memory-first-redesign`

## Executive summary

Amika previously mixed friendship management, event discovery, calendar integration, wishlists, group event planning, and trip collaboration. That breadth obscured the strongest product idea: preserving ordinary moments with real friends.

The redesigned product has one primary object—a dated memory—and one primary ritual: add a photo or short note, connect it to a friend, and choose its audience. The result is a modern close-friends social product with a feed, reactions, comments, direct messages, friend profiles, notifications, an archive, a private journal, and an intentionally opt-in public discovery surface.

## Audit findings and resolutions

| Severity | Finding | Resolution |
| --- | --- | --- |
| Critical | No dominant product loop; planning tools competed with friendship memories. | Rebuilt Home around a full-width daily composer followed immediately by the friends feed. |
| Critical | Privacy intent was implicit and fragmented. | Added explicit `private`, `friends`, and `public` visibility; friends-only is the composer default and public is opt-in. |
| High | Navigation exposed trips, events, wishlists, calendar, and coaching as peers. | Replaced it with Home, Friends, Discover, Messages, Journal, Notifications, and Profile. |
| High | Social behavior stopped at static records. | Added feed reactions, threaded comments, direct messages, shared-memory notifications, friend requests, and public discovery. |
| High | The UI used a generic sage card system with weak hierarchy. | Established the Daily Contact Sheet system: graphite structure, paper surfaces, periwinkle fields, citrus actions, coral reactions, and sky people tags. |
| High | Preserved Profile and Journal surfaces visually drifted from the redesign. | Reskinned both with ink borders, tactile depth, new color roles, readable controls, and corrected mobile offsets. |
| High | Supporting text and mobile controls were too small; browser zoom was disabled. | Restored user scaling, raised the support-type floor, and enforced approximately 44px action targets on key compact controls. |
| Medium | Mobile returning users had to pass the marketing story before reaching sign-in. | Added a first-viewport Sign in anchor in the compact header. |
| Medium | Message threads followed friend creation order instead of conversation relevance. | Sort unread threads first and then by most recent message; refresh threads and the open conversation every 15 seconds. |
| Medium | Legacy route and data surface recreated removed planning tables. | Removed active trip/event/wishlist/calendar routes, hooks, components, operations, and schema models; retained old migrations only as deployment history. |

## Information architecture

- **Home** — daily drop composer, close-friends feed, reactions, replies, flashbacks, and friend activity
- **Friends** — the relationship circle and friend-centered memory histories
- **Discover** — only memories their authors explicitly marked public
- **Messages** — one-to-one conversations limited to accepted friends
- **Journal** — private reflection with deliberate note sharing
- **Memory archive** — search and audience filters across a user’s own history
- **Notifications** — connection requests, shared memories or notes, and unread messages
- **Profile** — identity, interests, personal details, and memory/friend/journal counts

## Core interaction model

1. Capture one small moment using an optional photo and a short caption.
2. Attach the friend who was present and set the date.
3. Keep the default friends-only audience, make it private, or deliberately publish it.
4. Let accepted friends react, reply, message, or revisit the moment later.
5. Use the archive, friend profile, and flashback surfaces to turn individual drops into relationship history.

## Visual system

The approved direction is **Group Chat Scrapbook**, expressed as a **Daily Contact Sheet**. It avoids polished influencer-feed conventions and generic wellness cards. Strong ink borders and offset structural shadows make actions tactile; photos, captions, dates, audience marks, and friend tags form the contact sheet. Large editorial headlines establish hierarchy while compact labels behave like timestamps and annotations.

The normative implementation details are maintained in `DESIGN.md` and `.impeccable/design.json`.

## Accessibility and responsive behavior

- Browser zoom is permitted; the viewport no longer restricts scaling.
- Forms use explicit or screen-reader labels, visible focus outlines, status roles, and disabled states.
- Primary compact controls use a roughly 44px minimum target.
- Support text is held to a readable floor across the memory-first surfaces.
- Desktop uses a fixed graphite rail and multi-column content; compact layouts use a top app bar, five-item bottom navigation, a single-column feed, and stacked side content.
- Message lists and conversations become separate mobile states with an explicit Back action.
- Public, friends-only, and private states pair icons with text rather than relying on color alone.

## Privacy and trust review

- Feed queries expose a memory only to its author, the public, or accepted friends according to visibility.
- Comment and reaction writes verify memory access; comment reads use the same access check.
- Direct messages require an accepted connection.
- Memory deletion is author-scoped and requires a deliberate browser confirmation.
- Uploads require authentication and validate MIME type and a 4 MB limit.
- Public discovery is opt-in; journal entries remain private unless intentionally shared.

## Removed scope

The redesign removes active trip planning, event planning, event search, polling, tickets, collaborative itineraries, calendar synchronization, wishlists, friendship points, and their supporting UI/API/data operations. More than 130 files were changed or removed and roughly 40,000 lines of legacy planning-oriented implementation were deleted. Existing historical migration files remain so deployed databases retain a truthful migration chain; the current schema and runtime initializer are memory-first.

## Verification

- `npx tsc --noEmit` — passes
- `npm run build` — passes with all 35 static/dynamic pages generated
- `npm run lint` — passes with warnings only; the remaining warnings are legacy cleanup items such as unused imports and raw image elements
- Impeccable detector — no findings
- Responsive landing inspection — desktop and compact captures reviewed with no horizontal overflow
- Route/content scan — no active trip, event-planning, wishlist, or calendar surfaces remain

## Remaining product follow-ups

These are deliberate next-stage improvements, not blockers for the redesign:

- Run signed-in visual regression captures against seeded non-production data for Home, Messages, Journal, and Profile.
- Replace base64 image persistence with object storage and generated responsive image variants before large-scale usage.
- Move message refresh from 15-second polling to push delivery when real-time infrastructure is available.
- Resolve the remaining lint warnings and replace legacy raw `<img>` usage with the shared image component.
