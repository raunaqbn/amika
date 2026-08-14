---
version: 2
slug: "mobile-app-tsx"
primary_target: "mobile/src/app/_layout.tsx"
related_targets: ["mobile/src/app","mobile/src/components","mobile/src/lib/theme.ts","mobile/src/lib/cache-storage.ts","mobile/assets"]
---

# Amika native memory app

- Scope: shared Expo/React Native app for iOS and Android, rooted at `mobile/src/app/_layout.tsx`.
- Visitor mode: Operate.
- Audience and job: close friends capturing one ordinary moment quickly, choosing its audience, returning to shared history, and keeping private reflection nearby.
- Primary task: move among Home, Friends, Add, Messages, and Journal; capture a memory with native media and clear privacy.
- Supporting content: stories, chronological memories, full-photo detail, reactions and replies, direct messages, notifications, private journal, and profile.
- Constraints: preserve the production web API and existing accounts/data; no trips, events, calendars, itineraries, follower metrics, or public-by-default behavior; use native safe areas, photo picker, secure token storage, durable private drafts, accessible touch targets, keyboard avoidance, and platform back behavior.

## Chosen direction

Apricot Moss expressed through native system navigation and soft organic memory surfaces. Oat Cream is the application field; Warm White and Cream Deep establish hierarchy; Moss owns primary actions; Apricot and Terracotta hold emotional warmth. The small Memory Seedling is the shared identity across welcome, capture confirmation, journal, icons, and notification assets.

The five primary destinations use Expo Router Native Tabs so iOS can receive native Liquid Glass behavior while Android receives platform-native tab treatment. Brand color lives in selected Moss tint, content surfaces, typography, and the Memory Seedling rather than replacing platform navigation with a custom floating dock.

## Implementation inventory

| Visible ingredient | Medium | Decision |
| --- | --- | --- |
| Native shell and protected routes | Expo Router Stack + Native Tabs | Use authenticated protected routes, dark-content status bar, cream content field, and platform-native transitions. |
| Five primary destinations | Expo Router unstable Native Tabs | Home, Friends, Add, Messages, and Journal; Moss selected tint, Deep Moss labels, native badges, and transparent-edge protection. |
| Memory surfaces and forms | React Native styles | Use Apricot Moss tokens, hairline Flax boundaries, 14–20px corners, warm ambient shadows, and clear pressed/disabled states. |
| Memory and avatar photos | Existing user/API data | Render real uploaded data; no synthetic people ship in the product. |
| Photo capture and selection | Expo Image Picker | Native camera/library permissions with recovery states. |
| Authentication session | Expo SecureStore + bearer token | Extend the web API without breaking cookie-based web sessions. |
| Memory Seedling | React Native SVG + raster/SVG deployment assets | Preserve one terracotta body, moss leaf/stem, two eyes, tiny smile, and optional butter/apricot memory dots. Use on welcome, journal, completion, app icon, splash, favicon, notification, and monochrome surfaces. |
| Private journal drafts | Document-directory JSON keyed by account fingerprint | Keep new/edit drafts durable, separate across signed-in accounts, serialize writes, and remove only when empty or after successful save/delete. |
| Icons | Native SF Symbols/Material icons in tabs; Lucide React Native in content | Keep labels or accessibility names on all meaning-critical icon actions. |

## Journal expression

- The Journal tab opens on an Apricot Soft “What’s on your mind?” prompt, followed by a saved-draft resume row when present, one Moss “Begin writing” action, visible privacy language, search, and recent writing.
- Existing entries are readable Warm White cards. Private people tags are organizational; saved gentle reflections use Apricot Soft and a small Memory Seedling.
- The writer is a full-screen modal with top/bottom safe areas, keyboard avoidance, a listening Seedling, one large writing field, opt-in “Get a response,” collapsible entry details, and a persistent finish action.
- AI reflection never occurs during typing, autosave, opening, or final save. The writer must press “Get a response”; the result acknowledges and asks exactly one bounded, open question without diagnosis or clinical advice.
- Native draft status distinguishes new, saving, saved-on-device, and failed states in text. Failure leaves the draft intact.

## Memory Seedling and motion

- The native component keeps the canonical upright silhouette and accepts role-appropriate sizes. The completion modal animates a short card arrival, Seedling unfurl, and butter/apricot memory dots.
- Memory completion copy remains independently meaningful: “Memory tucked in” and who it was saved with, when available.
- The Seedling is decorative by default and excluded from the accessibility tree; surrounding labels and status text carry meaning.
- Honor platform reduced-motion settings in any future motion expansion. Do not add looping mascot behavior, decorative parallax, or essential information conveyed only through animation.

## Accessibility and privacy rules

- Keep targets at least 44px, preserve safe areas, use keyboard avoidance in the writer, and keep platform back behavior intact.
- Use Deep Moss or Muted Ink for body copy, Deep Terracotta for small warm labels, and visible Flax boundaries. Do not use low-contrast Terracotta or pale Apricot for small text.
- Use native accessibility roles, labels, hints, expanded state, disabled state, and destructive confirmation where appropriate.
- Journal entries remain private unless explicitly shared elsewhere. People tags do not share. Account-scoped durable drafts must not cross signed-in users on one device.

## Guardrails

- Keep Apricot Moss consistent with web while respecting native navigation and input behavior.
- Keep the Memory Seedling simple and small; no limbs, speech bubbles, character lore, or constant motion.
- Do not restore periwinkle, hard ink outlines, zero-blur print shadows, or the retired Pocket Accordion direction.
- Do not replace Native Tabs with a generic custom dock merely for visual parity with web.
- Do not send private journal text for AI reflection without an explicit user action.
- Do not weaken draft durability, account separation, safe areas, or recovery states for a cleaner static composition.

## Unresolved publication inputs

- The app is linked to the authenticated EAS project `@raunaqnaidu/amika`; Android signing is managed by EAS.
- Apple Developer/App Store Connect distribution credentials are not configured in EAS.
- A Google Play Console app record and service-account key are not configured for automated submission.
- Privacy-policy and support URLs, final store screenshots, age rating, and verified review contact still require owner-provided information before public review.
