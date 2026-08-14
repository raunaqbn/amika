---
version: 3
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/components/dashboard.tsx","src/components/nav.tsx","src/components/memory-seedling.tsx","src/app/memories/page.tsx","src/app/explore/page.tsx","src/app/diary/page.tsx"]
---

# Apricot Moss memory-first application shell

- Scope: authenticated responsive web home feed and the shared shell used by memories, friends, discovery, messages, journal, notifications, and profile.
- Visitor mode: Operate.
- Audience and job: a friend recording one small moment, deciding who can see it, then revisiting or responding to the history they share with people they know.
- Primary task: add today's memory with media, a short caption, friend, date, and visibility without leaving the feed.
- Supporting content: close friends, recent memories, reactions and reply trails, notifications, dated flashbacks, and private reflection.
- Constraints: friends-only sharing is explicit; public discovery is opt-in; private journal content never enters the social feed; no trip, event, calendar, itinerary, or planning language.

## Direction contract

- **Thesis:** Amika makes an everyday memory feel gently held, replacing the high-school scrapbook impression with a calm shared ritual.
- **Own world:** Oat cream fields, baked apricot moments, deep moss actions, terracotta warmth, butter and flax support, broad organic cards, real photography, and the small Memory Seedling.
- **Story:** Scan friendship history, open the plus action to capture one small moment, choose its people and privacy, then watch the Memory Seedling keep it safe in the stream.
- **First viewport:** A warm cream shell opens directly on memory history with a compact daily prompt, close friends, and one unmistakable Moss plus action.
- **Form:** A responsive Apricot Moss memory stream with a progressively disclosed add-memory sheet and one restrained Seedling save ritual.

Approved palette and composition direction: `.impeccable/mocks/amika-warm-apricot-moss.png`

Canonical mascot sources: `src/components/memory-seedling.tsx`, `public/icon.svg`, `public/icon-maskable.svg`, `src/app/icon.svg`, and `src/app/apple-icon.svg`.

## Implementation inventory

| Visible ingredient | Medium | Implemented decision |
| --- | --- | --- |
| Cream application shell and navigation | Semantic HTML/CSS | Warm White desktop rail at 220px; Cream Deep active field; Warm White mobile top and bottom bars at 820px and below. |
| Moss plus action | Radix dialog trigger plus Lucide icon | One fixed 56–60px circular action opens the composer, remains above mobile navigation, returns focus after close, and has an explicit accessible name. |
| Apricot add-memory sheet | Radix dialog plus semantic form controls | A focused 24px organic Apricot surface with media, caption, friend, date, visibility, one Moss save action, and a holding Memory Seedling; centered on desktop and bottom-anchored on mobile. |
| Daily prompt and close friends | Existing data plus accessible links | A compact cream header preserves date, prompt, and people context without forcing the capture form into the feed. |
| Memory stream | Existing memory data | Warm White cards on Oat Cream; Apricot Soft for text-only memories; the first item may receive slightly stronger ambient elevation. |
| Memory photos and videos | Existing user assets | Render stored media when present. Never ship synthetic people or fabricated memories. |
| Friend avatars | Existing profile images plus initials fallback | Use quiet Flax rings and accessible link labels. |
| Audience and privacy | Semantic selects, labels, and fieldset | Keep “Only me,” selected-friend sharing, and “Public” understandable at the save point; public remains opt-in. |
| Reactions, replies, privacy, and navigation icons | Lucide icon library | Pair meaning-critical icons with text or accessible names; Deep Terracotta supports readable small warm labels. |
| Memory Seedling identity | Semantic spans/CSS plus SVG brand assets | Use the terracotta body, moss leaf/stem, quiet eyes and smile, and optional butter memory orb across wordmark, composer, app icons, social images, journal, empty/loading states, and earned feedback. |
| Save confirmation | React state and CSS motion | On successful POST, show “Memory tucked in” for 2.8 seconds while the body settles, leaf unfurls, and memory orb comes home; do not block input or pointer events. |
| Responsive motion safety | CSS media query | Remove page entrance, confirmation, halo, spinner, and Memory Seedling animation under `prefers-reduced-motion: reduce`. |

## Memory Seedling roles

- **Mark:** tiny wordmark and navigation identity.
- **Hold:** composer companion holding the butter memory orb.
- **Listen:** journal prompt and explicit reflection states.
- **Peek:** blank and no-results states.
- **Rest:** loading, saved reflection, and quiet support.
- **Celebrate:** completed-memory feedback only; never loop the animation.

## Surface behavior

1. The user encounters today's prompt and memory history with one persistent plus action.
2. Activating the plus opens the focused Apricot composer and moves keyboard focus into it.
3. Media and a short caption capture the moment; friend, date, and visibility complete its context.
4. A single Moss action saves the memory.
5. Successful save closes and clears the composer, refreshes the feed, and briefly animates the Memory Seedling in an `aria-live="polite"` status surface.
6. Closing without saving preserves the draft and returns focus to the plus action.

## Responsive rules

- Above 820px, keep the compact header above the established feed-plus-supporting-rail layout and center the composer over a subdued focus veil.
- At 1120px and below, allow supporting feed content to reflow without reintroducing the composer into the page header.
- At 820px and below, remove the desktop rail, show the 66px mobile top bar and fixed five-item bottom navigation, collapse the memory stream to one column, and open the composer as a full-width bottom sheet. Keep the plus action and save confirmation above the bottom navigation plus safe area.
- Keep interactive targets at least 44px, use Deep Moss or Muted Ink for body copy, use Deep Terracotta for small warm labels, and preserve visible Terracotta focus outlines.

## Guardrails

- Keep the page cream-led and photography-led. Apricot appears when capture is requested; Moss marks the persistent plus and decisive save actions.
- Keep Memory Seedling small, cute, and sparingly used. Preserve its seed body, one leaf, stem, quiet face, and optional memory orb; no limbs, dialogue, looping behavior, or character lore.
- Use broad organic corners, quiet Flax boundaries, and soft warm shadows. Do not restore hard outlines or offset print shadows.
- Avoid scrapbook collage, neon/periwinkle accents, gradients, glass, texture overlays, and arbitrary decorative marks.
- Preserve existing authentication, friendship, privacy, notifications, messages, journal, and memory behavior.
- Do not introduce planning language or fabricate social proof, people, memories, or product metrics.

## Unresolved decisions

- Direct-message persistence remains an integration boundary separate from the visual-system work; Apricot Moss does not change the underlying message data contract.
