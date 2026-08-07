---
name: Amika Memory System
description: A bright, tactile social scrapbook for capturing daily memories with close friends.
colors:
  graphite-ink: "#15161e"
  graphite-soft: "#30313d"
  paper: "#f7f7f2"
  white: "#ffffff"
  periwinkle: "#7b74ff"
  periwinkle-deep: "#5b50ed"
  citrus: "#dfff4f"
  coral: "#ff7163"
  sky: "#79dcfa"
  pencil-line: "#c9c9c2"
  muted-ink: "#65666f"
  mobile-graphite: "#20201F"
  mobile-paper: "#F7F2E8"
  mobile-paper-deep: "#EEE7D9"
  mobile-white: "#FFFCF6"
  mobile-periwinkle: "#9EA8F8"
  mobile-periwinkle-deep: "#6470CF"
  mobile-citrus: "#FFD44D"
  mobile-rose: "#F6A8A0"
  mobile-sage: "#A8CDAE"
  mobile-sky: "#A9D7F2"
  mobile-muted: "#746F68"
  mobile-danger: "#B94343"
  mobile-line: "#292826"
typography:
  display:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "clamp(3rem, 7vw, 6.4rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "clamp(1.5rem, 2.4vw, 2.8rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Avenir Next", Avenir, "Segoe UI", system-ui, sans-serif'
    fontSize: "1.15rem"
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
    fontSize: "0.75rem"
    fontWeight: 850
    lineHeight: 1.2
    letterSpacing: "0.04em"
rounded:
  tag: "5px"
  control: "8px"
  field: "10px"
  card: "12px"
  surface: "14px"
  pill: "999px"
  mobile-control: "14px"
  mobile-card: "18px"
  mobile-packet: "20px"
  mobile-pill: "22px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "28px"
  2xl: "54px"
  mobile-row: "10px"
  mobile-screen: "16px"
  mobile-section: "15px"
components:
  button-primary:
    backgroundColor: "{colors.citrus}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "48px"
  chip:
    backgroundColor: "{colors.sky}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tag}"
    padding: "5px 7px"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.graphite-ink}"
    rounded: "{rounded.card}"
    padding: "14px"
  nav-active:
    backgroundColor: "{colors.periwinkle}"
    textColor: "{colors.graphite-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.field}"
    padding: "0 12px"
    height: "46px"
  mobile-memory-submit:
    backgroundColor: "{colors.mobile-graphite}"
    textColor: "{colors.mobile-white}"
    rounded: "{rounded.mobile-control}"
    padding: "0 18px"
    height: "48px"
  mobile-field:
    backgroundColor: "{colors.mobile-white}"
    textColor: "{colors.mobile-graphite}"
    rounded: "{rounded.mobile-control}"
    padding: "0 15px"
    height: "50px"
  mobile-memory-card:
    backgroundColor: "{colors.mobile-white}"
    textColor: "{colors.mobile-graphite}"
    rounded: "{rounded.mobile-card}"
    padding: "16px"
  mobile-add-tab:
    backgroundColor: "{colors.mobile-citrus}"
    textColor: "{colors.mobile-graphite}"
    rounded: "{rounded.mobile-control}"
    height: "47px"
    width: "47px"
---

# Design System: Amika Memory System

## Overview

**Creative North Star: "Daily Contact Sheet"**

Amika should feel like opening a contact sheet assembled by a close group chat: immediate, candid, colorful, and visibly handled. The interface uses strong ink outlines, paper-toned space, and offset print-like shadows so daily moments feel collected rather than optimized. The personality is energetic without becoming noisy; large editorial headings establish place, while compact social details keep the feed intimate and useful.

The broader direction is a **Group Chat Scrapbook**. Periwinkle creates a recognizable social world, citrus marks the next warm action, and coral or sky distinguish major collections without introducing a corporate dashboard palette. Images, names, dates, replies, and clear privacy cues stay closer to the eye than metrics.

The native iOS and Android expression is **Pocket Accordion**, the grounded structure selected as candidate 6 with seed `2e7d7b8a`. It keeps the Daily Contact Sheet identity while adapting the first viewport into a folded periwinkle packet above one chronological, tactile feed and a five-tab shell. The packet unfolds the whole capture story in place: capture today, choose a friend and privacy, then save the moment into the friendship stream. This is a daily-memory product for real friendships—not a generic social feed, logistics tool, or planning dashboard.

**Key Characteristics:**

- Tactile paper surfaces with dark structural outlines
- Saturated color fields used as chapter markers, not decoration dust
- Tight, heavy typography with oversized section statements
- Offset shadows that evoke stacked prints and pinned notes
- Dense social context balanced by generous page-level breathing room
- Responsive navigation that becomes an installed-app-style bottom bar
- A folded daily-memory packet that expands into the complete native capture ritual
- Safe-area-aware native screens with one clear vertical reading path

## Colors

The palette pairs near-black graphite and warm paper with friendly, print-bright accents.

### Primary

- **Graphite Ink** (`#15161e`): The dominant text, outline, rail, and structural shadow color. It keeps the bright palette grounded and makes interaction boundaries unmistakable.
- **Periwinkle Thread** (`#7b74ff`): The main social identity color for active navigation, daily capture bands, text-only memories, and connected-friend contexts.
- **Deep Periwinkle** (`#5b50ed`): Link, icon, and small-label emphasis where the lighter periwinkle needs more contrast on paper.

### Secondary

- **Citrus Note** (`#dfff4f`): The decisive action color for posting, sending, accepting, and compact count badges. Use it for the next meaningful action, not every available action.
- **Coral Archive** (`#ff7163`): A warm chapter color for archive and historical-memory contexts.

### Tertiary

- **Sky Snapshot** (`#79dcfa`): Friend tags, avatars, featured-card shadows, and personal connection surfaces.

### Neutral

- **Paper** (`#f7f7f2`): The default page canvas and quiet field surface.
- **White Print** (`#ffffff`): Cards, inputs, and foreground panels that need separation from Paper.
- **Graphite Soft** (`#30313d`): Secondary dark copy when full Graphite Ink would feel too severe.
- **Muted Ink** (`#65666f`): Metadata, timestamps, supporting copy, and inactive actions.
- **Pencil Line** (`#c9c9c2`): Internal dividers; it does not replace the dark outer outlines that define interactive objects.

### Native Tonal Adaptation

- **Mobile Graphite** (`#20201F`) and **Mobile Line** (`#292826`): The native structural ink pair, tuned slightly warmer for full-screen mobile use.
- **Mobile Paper** (`#F7F2E8`), **Mobile Deep Paper** (`#EEE7D9`), and **Mobile White Print** (`#FFFCF6`): The warmer native canvas, recessed field, and foreground-card layers.
- **Mobile Periwinkle** (`#9EA8F8`) and **Mobile Deep Periwinkle** (`#6470CF`): The folded daily packet, text-only memories, and small social emphasis.
- **Mobile Citrus** (`#FFD44D`): The center Add destination, selected controls, avatars, and the locally decisive action.
- **Mobile Rose** (`#F6A8A0`), **Mobile Sage** (`#A8CDAE`), and **Mobile Sky** (`#A9D7F2`): Supporting friendship, journal, empty-state, and category accents.
- **Mobile Muted** (`#746F68`) and **Mobile Danger** (`#B94343`): Native metadata and destructive or reacted states.

**The Warm Action Rule.** Citrus identifies the most consequential friendly action in a local area; multiple citrus buttons competing in one cluster dilute its meaning.

**The Color Field Rule.** Periwinkle, coral, citrus, and sky appear as meaningful bands, cards, tags, or shadows. Do not scatter them as arbitrary decorative dots.

## Typography

**Display Font:** Avenir Next (with Avenir, Segoe UI, system-ui, sans-serif fallbacks)

**Body Font:** Avenir Next (with Avenir, Segoe UI, system-ui, sans-serif fallbacks)
**Label Font:** Avenir Next, using compact heavy uppercase styling

**Character:** One geometric-humanist family creates a conversational, native-app feel. Personality comes from dramatic scale changes, tight display tracking, and compact high-weight labels rather than a decorative font pairing.

**Native platform adaptation:** iOS ships the licensed platform-installed Avenir family (`Avenir`, `Avenir-Medium`, and `Avenir-Heavy`). Android intentionally uses its platform sans families (`sans-serif` and `sans-serif-medium`) so the app remains native, legible, and license-safe while preserving weight, scale, and spacing. This is an approved platform adaptation, not a brand change.

### Hierarchy

- **Display** (800, `clamp(3rem, 7vw, 6.4rem)`, 0.9): Page and collection statements. Keep it to short phrases and approximately 10–13 characters per line where composition allows.
- **Headline** (800, `clamp(1.5rem, 2.4vw, 2.8rem)`, 1): Feed, section, and composer headings.
- **Title** (800, `1.15rem`, 1.1): Friend tiles and named content groups.
- **Body** (600, `0.86rem`, 1.45): Captions, messages, helper copy, and card prose. Longer explanatory copy should remain near 55–60 characters per line.
- **Label** (850, `0.75rem`, `0.04em`, uppercase): Eyebrows, privacy states, filter roles, and short metadata categories.

**The Compression Rule.** Display type is large, heavy, tightly tracked, and brief; body text returns immediately to calm, readable spacing.

## Layout

Desktop application pages reserve a fixed 216px left rail. Primary content uses broad editorial bands followed by centered content regions: the home feed is capped at 1420px, while collection pages typically use 1320px. The home contact sheet pairs a fluid two-column memory grid with a 300px activity rail; a featured memory can span both feed columns.

Spacing is intentionally bimodal. Controls and social metadata use a compact 6–18px rhythm, while page sections and hero bands breathe at 28–54px or responsive `clamp()` values. This contrast keeps information dense without making the overall page feel cramped.

At 1120px, the home side rail moves below the feed. At 820px, the desktop rail disappears, the top bar and five-item bottom navigation appear, multi-column feed layouts collapse, and content receives 14–18px side padding. Smaller collection grids collapse between 560px and 620px. Touch controls remain at least 44px high; bottom content accounts for the fixed mobile navigation and safe-area inset.

The native app is a single-column Pocket Accordion composition. Each screen owns the top safe area, content scrolls beneath a compact header, and the bottom tab bar reserves 82px plus the device inset so controls never collide with a home indicator or system chrome. The first viewport always establishes the daily folded packet before the chronological feed. Home, Friends, Add, Messages, and Journal are the only primary destinations; the center Add control rises slightly from the bar as a 47px citrus square with 14px corners.

**The Contact Sheet Rule.** Use deliberate grid rhythm and occasional spanning cards to express a collected history; avoid uniform dashboard tile matrices where every object has equal visual weight.

## Elevation & Depth

Depth is structural and print-like, not ambient. Surfaces use crisp, unblurred offset shadows paired with visible 1.5–2px graphite borders. Standard cards rest on a subtle neutral offset; featured memories and friend tiles may exchange that neutral offset for sky. Major composer and callout panels use a larger graphite offset. Shadows communicate stacked material and interaction, never floating glass.

### Shadow Vocabulary

- **Quiet Print** (`0 5px 0 #d5d5ce`): Default memory and friend cards.
- **Pressed Action** (`0 4px 0 #15161e`): Primary buttons and compact action controls; active state compresses to a 1px offset.
- **Featured Snapshot** (`7px 8px 0 #79dcfa`): Featured memory cards and selected scrapbook material.
- **Pinned Panel** (`6px 7px 0 #15161e` to `9px 10px 0 #15161e`): Composer, flashback, and major note panels.
- **Native Hard Print** (`4px 4px 0 #20201F`, with Android elevation 5): Folded packet and card depth in React Native; the offset remains fully opaque with zero blur.

**The Hard Shadow Rule.** Shadows have zero blur. If a surface needs softer separation, use Paper versus White and Pencil Line dividers instead of adding ambient blur.

**The Flat-at-Rest Rule.** Internal rows and utility areas remain flat; stronger offsets are reserved for cards, decisive controls, and signature panels.

## Shapes

Amika uses gently rounded rectangles with visible ink boundaries. Compact tags use 5px corners, actions use 8px, fields use 9–10px, cards use 12px, and signature surfaces use 14px. Pills are reserved for privacy, filters, and counts. Avatars and friend-count emblems are circular and often carry a dark outline.

The native adaptation increases control and surface radii for thumb-scale comfort without becoming soft or inflated: controls and fields use 14px, memory cards use 18px, the folded packet uses 20px, and selectable friend chips use a 22px pill. All retain a 1.5px Mobile Line boundary.

Corners should feel cut from paper rather than inflated. Borders are normally 1.5px for cards and fields and 2px for primary actions or major panels. Dashed 1.5–2px outlines indicate an empty state or photo drop target.

**The Honest Edge Rule.** Interactive boundaries are visible. Avoid borderless pale cards whose edges depend only on a shadow.

## Components

### Buttons

- **Shape:** Compact paper-cut corners (8–10px) with a 2px Graphite Ink border.
- **Primary:** Citrus Note with Graphite Ink text, a 44px minimum height, heavy compact labeling, and a hard 4px lower offset.
- **Hover / Focus:** Hover brightens the citrus or shifts a neutral surface. Keyboard focus uses a visible outline with offset; press states move down 3px while compressing the shadow.
- **Secondary:** White Print with Graphite Ink border and text. Periwinkle is appropriate for socially connective secondary actions such as adding a friend.
- **Icon:** Square or circular, at least 36–44px when used alone. Use transparent icon actions only inside an already bounded card or row.

### Chips

- **Style:** Friend tags use Sky Snapshot, a dark blue-green 1px border, and 5px corners. Privacy and filter controls use pill geometry with a Graphite Ink outline.
- **State:** Selected filters switch to Periwinkle Thread and gain a compact hard shadow. Unselected filters remain White Print.

### Cards / Containers

- **Corner Style:** 12px for memory cards; 14px for composer, flashback, and empty-state surfaces.
- **Background:** White Print on Paper, with Periwinkle Thread for text-only memories and signature social panels.
- **Shadow Strategy:** Quiet Print by default; Featured Snapshot only for content granted intentional emphasis.
- **Border:** 1.5px Graphite Ink, increasing to 2px for featured or signature surfaces.
- **Internal Padding:** 13–18px for standard card zones; 18–30px for signature panels.

### Inputs / Fields

- **Style:** White Print or Paper fill, 1.5px Graphite Ink border, 9–10px corners, and a 44–48px minimum height. Multiline memory fields use generous 14px inset spacing.
- **Focus:** Border or focus outline shifts to Citrus Note against dark surfaces while retaining a clear shape boundary.
- **Error / Disabled:** Errors use a pale coral field with a dark red outline and text. Disabled controls reduce opacity and remove the action shadow without changing layout.

### Navigation

Desktop navigation is a dark fixed rail with a bold lowercase wordmark, simple line icons, and compact labels. The active destination becomes a Periwinkle Thread block with Graphite Ink text and a 5px dark-violet offset. Hover moves a row 2px to the right. On mobile, navigation becomes a dark top app bar plus a five-item bottom bar; the active item uses a compact Periwinkle Thread field without introducing a separate floating dock.

The native shell uses exactly five persistent destinations—Home, Friends, Add, Messages, and Journal—inside a White Print bar with a 1.5px Mobile Line top edge. Labels use compact heavy platform type at 10px. The center Add destination is a 47px Mobile Citrus control, lifted 20px into the content edge; screens and overlays must account for both the bar and device safe-area inset.

### Memory Composer

The signature composer is a Paper panel sitting directly on the Periwinkle daily band. It combines a dashed photo target, a large plain-language caption field, explicit friend/date/privacy controls, and one Citrus action. Its strong graphite offset makes the daily ritual the clearest object in the first viewport.

On native, this becomes the folded **Pocket Accordion** packet. Its 92px periwinkle header remains visible whether collapsed or expanded, a citrus spark tile and plain-language prompt identify the ritual, and a 42px folded edge summarizes the available actions. Expanding reveals camera/library controls, a multiline moment field, friend chips, Friends versus Only Me privacy choices, and one 48px graphite save action. The packet uses 20px corners, a 1.5px Mobile Line boundary, and the Native Hard Print shadow.

### Memory Contact Sheet

Memory cards preserve a consistent author header, dated image or periwinkle text field, caption and friend tag, then lightweight social actions. Featured cards span the grid and use a sky offset, but the information model remains identical so emphasis never changes behavior.

Native memory cards retain the same information order in a single stream. They use an 18px Mobile White Print surface, 1.5px line, and hard 4px offset; media keeps a 4:3 contact-sheet ratio while text-only memories become a minimum 160px periwinkle field. Tapping anywhere on the memory opens a full-screen safe-area-aware viewer: the complete image is shown with `contain`, followed by date, audience, caption, reactions, replies, and a keyboard-safe reply field. The full picture is never trapped in the feed crop.

## Do's and Don'ts

### Do:

- **Do** let Graphite Ink outlines and Paper/White layering carry most of the interface structure.
- **Do** reserve Citrus Note for the next meaningful action in a component group.
- **Do** use large, short headings to name a place, then return to compact social typography.
- **Do** keep privacy, friend, and date context visible at the moment a memory is captured or read.
- **Do** pair hard shadows with visible borders and clear press states.
- **Do** collapse complex grids into a single readable column on mobile and preserve 44px touch targets.
- **Do** keep the folded daily packet above the native feed and make its friend and privacy choices explicit before saving.
- **Do** protect headers, full-screen memory media, reply controls, and the five-tab bar with device safe-area insets.

### Don't:

- **Don't** turn the palette into confetti; every accent field should communicate chapter, state, person, or action.
- **Don't** use blurred glass, translucent dashboard cards, gradient washes, or soft ambient shadows.
- **Don't** fill a screen with equally weighted tiles; the daily ritual and meaningful memories need hierarchy.
- **Don't** use pills for ordinary buttons, cards, or inputs; reserve them for filters, privacy, and counts.
- **Don't** let follower metrics, performance language, or planning-oriented controls outrank people and moments.
- **Don't** hide focus, press, disabled, empty, or privacy states to preserve a static composition.
- **Don't** introduce trips, itineraries, events, calendars, destinations, or other planning surfaces into web or native navigation.
- **Don't** substitute a generic floating social dock for the shipped Home, Friends, Add, Messages, and Journal shell.
