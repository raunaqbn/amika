---
version: 1
slug: "mobile-app-tsx"
primary_target: "mobile/src/app/_layout.tsx"
related_targets: ["mobile/src/app","mobile/src/components","mobile/src/lib/theme.ts"]
---

# Amika native memory app

- Scope: shared Expo/React Native app for iOS and Android, rooted at `mobile/src/app/_layout.tsx`.
- Visitor mode: Operate.
- Audience and job: close friends capturing one ordinary moment quickly, choosing its audience, and returning to a shared history without planning mechanics.
- Primary task: add today's memory with a photo, caption, friend, date, and visibility in one compact native flow.
- Supporting content: chronological friend memories, full-photo detail, reactions and replies, friends, direct messages, private journal, and profile.
- Constraints: preserve the production web API and existing accounts/data; no trips, events, calendars, itineraries, follower metrics, or public-by-default behavior; use native safe areas, photo picker, secure token storage, accessible touch targets, and platform back behavior.

## Chosen direction

Pocket Accordion in the established Daily Contact Sheet identity. The home screen begins with a compact periwinkle daily packet; tapping its photo aperture or central Add control deploys the full capture sheet in place, then returns the saved moment to a tactile chronological stream. Bottom navigation keeps Home, Friends, Add, Messages, and Journal within one thumb reach.

Approved composition: `.impeccable/mocks/mobile-pocket-accordion.png`

## Implementation inventory

| Visible ingredient | Medium | Decision |
| --- | --- | --- |
| Native shell, safe areas, tabs, sheets, forms | React Native + Expo Router | Produce in code with semantic labels and platform-safe motion. |
| Periwinkle daily packet and paper memory cards | React Native styles | Produce from shared Amika tokens; use crisp borders and zero-blur offset shadows. |
| Memory and avatar photos | Existing user/API data | Render real uploaded data; no synthetic people ship in the product. |
| Photo capture and selection | Expo Image Picker | Native camera/library permissions with recovery states. |
| Authentication session | Expo SecureStore + bearer token | Extend the web API without breaking cookie-based web sessions. |
| Icons | Lucide React Native | One coherent line-icon family with accessible labels. |
| Deployment assets | Existing Amika SVG marks | Reuse and render store-safe raster sizes during the native build pipeline. |

## Unresolved publication inputs

- The app is linked to the authenticated EAS project `@raunaqnaidu/amika`; Android signing is managed by EAS.
- Apple Developer/App Store Connect distribution credentials are not configured in EAS.
- A Google Play Console app record and service-account key are not configured for automated submission.
- Privacy-policy and support URLs, final store screenshots, age rating, and verified review contact still require owner-provided information before public review.
