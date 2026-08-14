---
name: Amika Apricot Moss
description: A warm, calm memory ritual held by cream, apricot, moss, and the Memory Seedling.
colors:
  moss-deep: "#394238"
  moss: "#59674d"
  seedling-body: "#d48768"
  oat-cream: "#f7eedf"
  warm-white: "#fffaf2"
  expression-cream: "#fff1df"
  cream-deep: "#f1e4d2"
  flax: "#dccfb9"
  baked-apricot: "#e8b080"
  apricot-soft: "#f3cfad"
  terracotta: "#bf7057"
  terracotta-deep: "#874b39"
  butter: "#d6ad5c"
  cocoa: "#675044"
  muted-ink: "#625c52"
  danger: "#a7493d"
typography:
  display:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "clamp(3.2rem, 7vw, 7rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "clamp(1.5rem, 2.4vw, 2.4rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "1.22rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "0.86rem"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "0.72rem"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "0.015em"
rounded:
  control: "14px"
  journal: "16px"
  card: "18px"
  mobile-card: "20px"
  signature: "24px"
  pill: "999px"
spacing:
  xs: "5px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  2xl: "30px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.warm-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.moss-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  input:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.moss-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.moss-deep}"
    rounded: "{rounded.card}"
    padding: "18px"
  composer:
    backgroundColor: "{colors.baked-apricot}"
    textColor: "{colors.moss-deep}"
    rounded: "{rounded.signature}"
    padding: "24px"
  nav-active:
    backgroundColor: "{colors.cream-deep}"
    textColor: "{colors.moss}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "48px"
  save-celebration:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.moss-deep}"
    rounded: "{rounded.signature}"
    padding: "24px"
    width: "min(92vw, 390px)"
  journal-invitation:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.warm-white}"
    typography: "{typography.body}"
    rounded: "{rounded.journal}"
    padding: "18px 20px"
    height: "84px"
  journal-reflection:
    backgroundColor: "{colors.apricot-soft}"
    textColor: "{colors.moss-deep}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "18px"
---

# Design System: Amika Apricot Moss

## Overview

**Creative North Star: "A Memory Gently Held"**

Apricot Moss turns recording an everyday moment into a calm shared ritual. The system is warm and fresh without reading as a scrapbook: oat-cream space quiets the canvas, baked apricot gathers attention around capture, and moss gives actions a steady, trustworthy center. Photography and the people in each memory carry the emotional detail; the interface stays soft, clear, and unhurried around them.

The signature is the **Memory Seedling**, a single small keeper made from a terracotta seed body, moss leaf and stem, two quiet eyes, a tiny smile, and an optional butter memory orb. Its simple silhouette makes the brand friendly and recognizable across the wordmark, app icons, welcome screen, social previews, memory composer, journal, empty states, and earned save feedback.

The journal extends the same world into a private reflective room. It should feel like a calm conversation rather than a notes database: writing leads, organizational details recede, and Amika responds only when the writer explicitly asks for one gentle reflection.

**Key Characteristics:**

- Warm cream canvas with apricot, moss, terracotta, butter, and flax accents
- Quiet tonal layering, soft borders, and broad organic corners
- Clear hierarchy with short, tightly set headings and relaxed supporting copy
- One capture-first story: moment, people and privacy, then shared history
- Real photos and friend identity as the richest visual material
- Memory Seedling poses used as a restrained brand language, not decorative clutter
- A private journal that moves from one honest thought to searchable, durable history
- Responsive shell with a left rail on desktop and fixed app navigation on mobile

## Colors

The palette feels sun-warmed and grounded. Exact values in the frontmatter are normative.

### Primary

- **Deep Moss:** Primary text, strong headings, dark authentication surfaces, and the structural half of the brand.
- **Moss:** Primary actions, links, selected states, and the Memory Seedling leaf and stem.
- **Oat Cream:** Default application canvas and the visual pause between memories.

### Secondary

- **Baked Apricot:** The daily composer, high-warmth moments, and the main capture cue.
- **Terracotta:** Active mobile navigation, reactions, notification badges, focus emphasis, and the smaller warm accent.
- **Seedling Body:** The warm clay body of the Memory Seedling and its native asset family.
- **Deep Terracotta:** Small dates, eyebrows, and compact labels that need stronger contrast than Terracotta on cream.

### Tertiary

- **Butter:** Flashbacks, small celebratory echoes, and friendly supporting callouts.
- **Apricot Soft:** Text-only memories, selected sharing rows, profile highlights, and low-intensity warm fields.

### Neutral

- **Warm White:** Foreground cards, fields, navigation, and the save-confirmation surface.
- **Cream Deep:** Hover and recessed states that need distinction without becoming gray.
- **Flax:** Card edges, dividers, and quiet control boundaries.
- **Muted Ink:** Metadata and secondary copy; it remains dark enough for body-sized text.
- **Cocoa:** Occasional warm-dark supporting accent.
- **Expression Cream:** A warm light neutral available for tiny expression details and dark-surface relief without introducing stark white.

**The Warm Center Rule.** Baked Apricot belongs to the memory-capture ritual and a few selected moments. It should not flood every card or action.

**The Moss Action Rule.** Use Moss for the clearest next action. A cluster should not contain several equally weighted moss buttons.

**The Earth, Not Autumn Rule.** Keep the field luminous with Oat Cream and Warm White. The palette should feel warm and fuzzy, never brown, rustic, or seasonal.

**The Warm Contrast Rule.** Body copy uses Deep Moss or Muted Ink, and small warm labels use Deep Terracotta. Terracotta alone is an accent, not a substitute for readable small text.

## Typography

**Display Font:** Avenir Next (with Avenir, Segoe UI, system-ui, sans-serif fallbacks)

**Body Font:** Avenir Next (with Avenir, Segoe UI, system-ui, sans-serif fallbacks)

**Character:** One geometric-humanist family keeps Amika contemporary and conversational. Personality comes from short, tightly tracked headings beside readable body copy rather than from decorative display fonts.

### Hierarchy

- **Display** (800, responsive up to `7rem`, 0.9): Landing and major collection statements; keep phrases short.
- **Headline** (800, responsive up to `2.4rem`, 1): Feed, composer, and section headings.
- **Title** (800, `1.22rem`, 1.1): Confirmation cards, named groups, and compact feature headings.
- **Body** (600, `0.86rem`, 1.45): Memory captions, descriptions, messages, and helper copy; target roughly 55–72 characters per line.
- **Label** (750, `0.72rem`, `0.015em`): Dates, privacy, compact metadata, and actions. Sentence case is preferred; uppercase is reserved for true category eyebrows.

**The Gentle Contrast Rule.** Pair one strong heading with quieter supporting copy. Do not stack several oversized or all-caps levels in the same card.

## Layout

The authenticated desktop shell reserves a 220px fixed left rail. The home first viewport opens directly on friendship history. A compact cream header holds the date, daily prompt, and close-friend context, while one fixed Moss plus action provides the clear entry point for capture.

Memories flow immediately into the established feed and supporting activity rail. Capture complexity stays hidden until requested; opening the plus action reveals the complete composer, followed by audience and privacy, save confirmation, and the newly settled memory. The interface uses a compact 5–24px rhythm inside controls and cards, while major regions breathe at 30–64px.

At 1120px, supporting feed content reflows. At 820px, the desktop rail disappears, a 66px top bar and fixed bottom navigation take over, and multi-column memory content becomes one stream with 14px side padding. The composer becomes a bottom sheet and both it and the fixed plus action account for the bottom bar and safe-area inset.

The journal home is a quieter, linear counterpart to the social feed: an Apricot Soft prompt, one Moss writing invitation, explicit privacy status, then searchable recent writing. The web library becomes a list/detail split when entries exist; native uses one vertical list. The writer is a dedicated room with a large conversation area and a secondary details region on desktop. At smaller widths, details collapse behind one disclosure and the save action becomes a full-width footer control.

**The Quiet Feed, Clear Action Rule.** The first authenticated viewport prioritizes memory history while keeping one unmistakable plus action available at all times. The capture form never occupies the feed until the user asks for it.

**The Breathing Stream Rule.** Keep cards orderly and comfortably spaced. Avoid dense dashboard tile matrices or collage-like overlap.

**The Writing Before Filing Rule.** Journal title, people tags, and history support the thought; they never appear more prominent than the writing field.

## Elevation & Depth

Depth is soft and ambient. Warm White cards sit on Oat Cream with flax edges and low-opacity warm shadows; the Apricot composer receives a broader haze only while open above a restrained Moss-tinted focus veil. Journal writing fields and the home prompt use the same quiet lift, while entry metadata and settings rely primarily on tonal separation. There are no hard black outlines, offset print shadows, glass decoration, or gradients in the Apricot Moss world.

### Shadow Vocabulary

- **Card Rest** (`0 12px 30px rgb(89 75 57 / 8%)`): Default cards and bounded content panels.
- **Featured Rest** (`0 16px 38px rgb(89 75 57 / 10%)`): The first memory or deliberately emphasized card.
- **Composer Warmth** (`0 20px 50px rgb(95 71 49 / 12%)`): The daily capture surface.
- **Primary Action** (`0 8px 18px rgb(57 66 56 / 16%)`): Moss buttons; compress the shadow on press.
- **Save Lift** (`0 30px 80px rgb(65 57 45 / 20%)`): The temporary save-confirmation card only.

**The Soft-at-Rest Rule.** Tonal separation and flax edges do most of the work. Use a stronger shadow only for the fixed plus action, the open composer, or the transient save moment.

## Shapes

Amika uses broad, organic rounded rectangles. Controls are usually 14px, content cards 18px, compact mobile cards 20px, and signature surfaces such as the composer or save confirmation 24px. Pills remain useful for counts and privacy states, but they are not the default container shape.

The Memory Seedling supplies the only intentionally irregular silhouette. Its anatomy stays stable: one rounded terracotta body, one moss leaf, a short moss stem, two deep-moss eyes, one tiny smile, and—when the moment calls for it—a butter memory orb with small apricot or butter echoes. Web poses are **rest**, **peek**, **hold**, **listen**, **celebrate**, and **mark**. Native keeps the canonical upright silhouette and scales it to the available role; the native save celebration adds the memory dots separately.

Borders are quiet: generally one pixel of Flax or a low-opacity Moss boundary. Focus is more explicit, using Terracotta with a visible two-pixel outline and offset.

**The Organic, Not Blobby Rule.** Use clean rounded containers for interface structure. Reserve irregular forms for the Memory Seedling and rare brand accents.

## Components

### Buttons

- **Shape:** Calm rounded controls (14px) with a 44px minimum height.
- **Primary:** Moss background with Warm White text and a low ambient shadow.
- **Hover / Focus:** Hover darkens Moss slightly; press moves down 2px and tightens the shadow. Keyboard focus uses a visible Terracotta outline with offset.
- **Secondary:** Warm White with a Flax edge and Deep Moss copy; avoid adding shadow unless the control needs clear elevation.

### Chips

- **Style:** Friend tags use a pale sage field with a muted moss edge. Privacy indicators use translucent Warm White on Apricot or a simple rounded field on neutral surfaces.
- **State:** Selected audience rows use Apricot Soft. Labels stay plain-language and identify who can see a memory.

### Cards / Containers

- **Corner Style:** 18px by default; 16–20px on compact responsive variants.
- **Background:** Warm White on Oat Cream, Apricot Soft for text-only memories, and Butter for flashback callouts.
- **Shadow Strategy:** Card Rest at default and Featured Rest only when hierarchy warrants it.
- **Border:** One pixel of Flax or a semantic earth-toned edge.
- **Internal Padding:** Usually 14–24px, increasing for sparse or signature panels.

### Inputs / Fields

- **Style:** Warm White or translucent Warm White, a quiet Flax/Moss boundary, 14px corners, and a 44–48px minimum height.
- **Focus:** A clear Terracotta outline; never rely on color fill alone.
- **Error / Disabled:** Errors use muted red copy and a pale clay-red field. Disabled controls preserve layout and readable labels while removing action emphasis.

### Navigation

Desktop navigation is a fixed Warm White rail with Deep Moss identity, quiet icon-and-label rows, and a Cream Deep active field. The tiny **mark** Memory Seedling sits beside the wordmark. A circular Moss plus action floats above content at the lower-right. At 820px and below, navigation becomes a Warm White top bar plus fixed five-item bottom bar; the plus action sits safely above it and Terracotta identifies the active destination.

### Memory Composer

The signature composer is progressively disclosed by the plus action rather than permanently occupying the home header. On desktop it opens as a focused, centered 24px Baked Apricot surface; on mobile it becomes a bottom sheet. It contains one uninterrupted capture flow: media, a few words, friend, date, visibility, and one Moss save action. A **hold** Memory Seedling keeps the butter memory orb at its edge. Translucent warm-white controls keep the form legible without breaking the color field into a grid of white cards. Closing preserves an unfinished draft; successful save closes the sheet and returns focus before the mascot confirmation appears.

### Memory Seedling and Save Confirmation

Memory Seedling is a quiet keeper, not a talking character. Use **mark** at wordmark scale, **hold** beside capture, **listen** beside reflective prompts, **peek** in empty states, **rest** for loading and saved reflection, and **celebrate** only after a completed memory. The identity is carried consistently through web and native components, application and maskable icons, native welcome assets, notification/monochrome marks, and Open Graph/Twitter previews.

After a successful memory save, the body settles, the leaf unfurls, and the butter memory orb comes home while two small echoes fade. The non-blocking live-status card reads “Memory tucked in,” lasts 2.8 seconds on web, and sits above the mobile bottom navigation. Native uses a short arrival and unfurl sequence in a modal presentation. Reduced-motion settings remove page entrance, halo, lifecycle, spinner, and mascot animation while preserving understandable static state and copy.

**The Earned Motion Rule.** Mascot motion rewards a completed memory or clarifies state. It does not loop, interrupt input, or compete with photography.

### Private Journal

The journal home leads with “What’s on your mind?”, one full-width Moss invitation, and an explicit “Private by default” status before searchable recent writing. A user-scoped saved draft, when present, appears as a separate Warm White resume row above the new-entry action. Empty, loading, error, selected-entry, edit, delete, people-tag, and gentle-reflection states all remain visible and recoverable.

The journal writer is a dedicated conversation surface. The main field accepts up to 4,000 characters and shows word count plus draft state. Title is optional; people tags are private organization and never imply sharing. Web drafts use an authenticated-user key in local storage, including entry-specific edit keys. Native drafts live in durable document storage under an account fingerprint, serialize writes to avoid stale revisions, and use separate new/edit keys. Drafts are removed only when there are no authored words or after successful save/delete.

“Get a response” is explicit opt-in AI reflection. Amika does not analyze in the background or answer until the writer presses the control. A response acknowledges the writing, asks exactly one concise open question, stays under 90 words, and must not diagnose, moralize, offer clinical advice, invent facts, or force a positive reframe. The writer’s words remain the source of meaning.

**The Asked, Never Assumed Rule.** AI reflection begins only after an explicit “Get a response” action and never changes, shares, or saves the writer’s entry by itself.

## Do's and Don'ts

### Do

- **Do** keep Oat Cream visible around Warm White cards so the app feels light and held.
- **Do** let memory history lead while keeping one Moss plus action unmistakable and persistent.
- **Do** show audience and privacy in plain language at the point of saving.
- **Do** use real memory photos, friend avatars, initials, and honest empty states.
- **Do** use Memory Seedling poses sparingly and preserve its simple seed, leaf, face, and memory-orb anatomy.
- **Do** keep journal entries private by default and describe people tags as private organization rather than sharing.
- **Do** persist journal drafts per signed-in account, expose draft status, and preserve the draft through network or AI-response errors.
- **Do** make AI reflection an explicit, reversible request for one gentle question.
- **Do** maintain 44px touch targets, visible focus, readable muted copy, semantic status announcements, and reduced-motion behavior.

### Don't

- **Don't** reintroduce periwinkle, neon accents, hard graphite outlines, offset print shadows, or scrapbook ephemera.
- **Don't** use gradients, glassmorphism, noisy texture, or decorative collage layers.
- **Don't** turn every container into a rounded card or every label into a pill.
- **Don't** add limbs, speech bubbles, detailed facial acting, character lore, or constant animation to the Memory Seedling.
- **Don't** send journal text for AI reflection before the writer explicitly requests a response.
- **Don't** present private people tags as recipients or imply that a journal entry was shared.
- **Don't** let archive, discovery, engagement, or planning mechanics outrank today's capture ritual.
- **Don't** fabricate people, memories, testimonials, or usage claims.
