---
name: Amika Apricot Moss
description: A warm, calm memory ritual held by cream, apricot, moss, and the Pebble Pair.
colors:
  moss-deep: "#394238"
  moss: "#59674d"
  pebble-moss: "#66705a"
  oat-cream: "#f7eedf"
  warm-white: "#fffaf2"
  cream-deep: "#f1e4d2"
  flax: "#dccfb9"
  baked-apricot: "#e8b080"
  apricot-soft: "#f3cfad"
  pebble-clay: "#d48768"
  terracotta: "#bf7057"
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
---

# Design System: Amika Apricot Moss

## Overview

**Creative North Star: "A Memory Gently Held"**

Apricot Moss turns recording an everyday moment into a calm shared ritual. The system is warm and fresh without reading as a scrapbook: oat-cream space quiets the canvas, baked apricot gathers attention around capture, and moss gives actions a steady, trustworthy center. Photography and the people in each memory carry the emotional detail; the interface stays soft, clear, and unhurried around them.

The signature is the **Pebble Pair**, two abstract organic shapes that suggest closeness without becoming literal characters. Their asymmetry makes the brand friendly and recognizable, while their simple construction lets them work as a tiny wordmark companion, an app icon, a composer detail, or a short moment of delight after a save.

**Key Characteristics:**

- Warm cream canvas with apricot, moss, terracotta, butter, and flax accents
- Quiet tonal layering, soft borders, and broad organic corners
- Clear hierarchy with short, tightly set headings and relaxed supporting copy
- One capture-first story: moment, people and privacy, then shared history
- Real photos and friend identity as the richest visual material
- Pebble Pair poses used as a restrained brand language, not decorative clutter
- Responsive shell with a left rail on desktop and fixed app navigation on mobile

## Colors

The palette feels sun-warmed and grounded. Exact values in the frontmatter are normative.

### Primary

- **Deep Moss:** Primary text, strong headings, dark authentication surfaces, and the structural half of the brand.
- **Moss:** Primary actions, links, selected states, and the larger Pebble Pair shape.
- **Oat Cream:** Default application canvas and the visual pause between memories.

### Secondary

- **Baked Apricot:** The daily composer, high-warmth moments, and the main capture cue.
- **Terracotta:** Active mobile navigation, reactions, notification badges, focus emphasis, and the smaller warm accent.
- **Pebble Clay:** The smaller Pebble Pair shape and a slightly earthier warm accent than the composer.

### Tertiary

- **Butter:** Flashbacks, small celebratory echoes, and friendly supporting callouts.
- **Apricot Soft:** Text-only memories, selected sharing rows, profile highlights, and low-intensity warm fields.

### Neutral

- **Warm White:** Foreground cards, fields, navigation, and the save-confirmation surface.
- **Cream Deep:** Hover and recessed states that need distinction without becoming gray.
- **Flax:** Card edges, dividers, and quiet control boundaries.
- **Muted Ink:** Metadata and secondary copy; it remains dark enough for body-sized text.
- **Cocoa:** Occasional warm-dark supporting accent.

**The Warm Center Rule.** Baked Apricot belongs to the memory-capture ritual and a few selected moments. It should not flood every card or action.

**The Moss Action Rule.** Use Moss for the clearest next action. A cluster should not contain several equally weighted moss buttons.

**The Earth, Not Autumn Rule.** Keep the field luminous with Oat Cream and Warm White. The palette should feel warm and fuzzy, never brown, rustic, or seasonal.

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

**The Quiet Feed, Clear Action Rule.** The first authenticated viewport prioritizes memory history while keeping one unmistakable plus action available at all times. The capture form never occupies the feed until the user asks for it.

**The Breathing Stream Rule.** Keep cards orderly and comfortably spaced. Avoid dense dashboard tile matrices or collage-like overlap.

## Elevation & Depth

Depth is soft and ambient. Warm White cards sit on Oat Cream with flax edges and low-opacity warm shadows; the Apricot composer receives a broader haze only while open above a restrained Moss-tinted focus veil. There are no hard black outlines, offset print shadows, glass decoration, or gradients in the Apricot Moss world.

### Shadow Vocabulary

- **Card Rest** (`0 12px 30px rgb(89 75 57 / 8%)`): Default cards and bounded content panels.
- **Featured Rest** (`0 16px 38px rgb(89 75 57 / 10%)`): The first memory or deliberately emphasized card.
- **Composer Warmth** (`0 20px 50px rgb(95 71 49 / 12%)`): The daily capture surface.
- **Primary Action** (`0 8px 18px rgb(57 66 56 / 16%)`): Moss buttons; compress the shadow on press.
- **Save Lift** (`0 30px 80px rgb(65 57 45 / 20%)`): The temporary save-confirmation card only.

**The Soft-at-Rest Rule.** Tonal separation and flax edges do most of the work. Use a stronger shadow only for the fixed plus action, the open composer, or the transient save moment.

## Shapes

Amika uses broad, organic rounded rectangles. Controls are usually 14px, content cards 18px, compact mobile cards 20px, and signature surfaces such as the composer or save confirmation 24px. Pills remain useful for counts and privacy states, but they are not the default container shape.

The Pebble Pair supplies the only intentionally irregular silhouette. Its two rounded shapes use asymmetrical radii and pose changes—lean, cradle, stack, peek, apart, rest, celebrate, and mark—to suggest relationship and mood without faces or limbs.

Borders are quiet: generally one pixel of Flax or a low-opacity Moss boundary. Focus is more explicit, using Terracotta with a visible two-pixel outline and offset.

**The Organic, Not Blobby Rule.** Use clean rounded containers for interface structure. Reserve irregular forms for the Pebble Pair and rare brand accents.

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

Desktop navigation is a fixed Warm White rail with Deep Moss identity, quiet icon-and-label rows, and a Cream Deep active field. The tiny leaning Pebble Pair sits beside the wordmark. A circular Moss plus action floats above content at the lower-right. At 820px and below, navigation becomes a Warm White top bar plus fixed five-item bottom bar; the plus action sits safely above it and Terracotta identifies the active destination.

### Memory Composer

The signature composer is progressively disclosed by the plus action rather than permanently occupying the home header. On desktop it opens as a focused, centered 24px Baked Apricot surface; on mobile it becomes a bottom sheet. It contains one uninterrupted capture flow: media, a few words, friend, date, visibility, and one Moss save action. A cradling Pebble Pair rests at its edge. Translucent warm-white controls keep the form legible without breaking the color field into a grid of white cards. Closing preserves an unfinished draft; successful save closes the sheet and returns focus before the mascot confirmation appears.

### Pebble Pair and Save Confirmation

Pebble Pair is an abstract relationship mark, not a talking mascot. Tiny poses may accompany the wordmark; medium poses may support empty states or the composer. After a successful save, the pair performs one restrained reunion: the moss pebble settles in, the clay pebble arcs home, and butter/terracotta/apricot echoes briefly appear. A non-blocking live-status card reads “Memory tucked in,” lasts 2.8 seconds, and sits above the mobile bottom navigation. Under `prefers-reduced-motion: reduce`, all entrance, reunion, halo, and lifecycle animations are removed while the confirmation remains understandable.

**The Earned Motion Rule.** Mascot motion rewards a completed memory or clarifies state. It does not loop, interrupt input, or compete with photography.

## Do's and Don'ts

### Do

- **Do** keep Oat Cream visible around Warm White cards so the app feels light and held.
- **Do** let memory history lead while keeping one Moss plus action unmistakable and persistent.
- **Do** show audience and privacy in plain language at the point of saving.
- **Do** use real memory photos, friend avatars, initials, and honest empty states.
- **Do** use Pebble Pair poses sparingly and preserve their abstract, faceless character.
- **Do** maintain 44px touch targets, visible focus, readable muted copy, semantic status announcements, and reduced-motion behavior.

### Don't

- **Don't** reintroduce periwinkle, neon accents, hard graphite outlines, offset print shadows, or scrapbook ephemera.
- **Don't** use gradients, glassmorphism, noisy texture, or decorative collage layers.
- **Don't** turn every container into a rounded card or every label into a pill.
- **Don't** make the Pebble Pair literal with eyes, mouths, limbs, speech bubbles, or constant animation.
- **Don't** let archive, discovery, engagement, or planning mechanics outrank today's capture ritual.
- **Don't** fabricate people, memories, testimonials, or usage claims.
