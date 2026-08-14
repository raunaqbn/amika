---
version: 1
slug: "src-app-diary-page-tsx"
primary_target: "src/app/diary/page.tsx"
related_targets: ["src/app/api/diary/route.ts","src/app/api/journal-guide/route.ts","src/components/memory-seedling.tsx","mobile/src/app/(tabs)/journal.tsx","mobile/src/app/journal/write.tsx","mobile/src/components/memory-seedling.tsx","mobile/src/lib/cache-storage.ts"]
---

# Private journal and guided reflection

- Scope: the responsive web journal home and writer, plus the equivalent native journal tab and full-screen writer.
- Visitor mode: Operate.
- Audience and job: a signed-in person privately capturing a thought, optionally asking Amika for one reflective question, then returning to searchable personal history.
- Primary task: begin or resume writing, preserve the draft automatically, and deliberately finish the entry.
- Supporting tasks: search entries, inspect and edit prior writing, add private people tags, read a saved gentle reflection, or delete an entry with confirmation.
- Privacy constraint: entries are private by default. People tags organize the writer's own journal and do not share an entry. AI reflection is opt-in and never runs in the background.

## Direction contract

- **Thesis:** A private journal should feel like a calm conversation, not a notes database or an AI chatbot.
- **Own world:** Oat Cream pages, Apricot Soft prompts, Moss actions, Flax rules, warm high-contrast copy, and the Memory Seedling as a quiet listener.
- **Story:** Begin with one honest thought, optionally ask for one gentle question, keep an account-scoped draft automatically, then return to searchable history.
- **First viewport:** “What’s on your mind?” and one full-width writing invitation lead; draft, privacy, and recent writing follow without competing cards.
- **Form:** A warm journal home and dedicated conversation writer that share one hierarchy across desktop and mobile while adapting details and navigation to each platform.

Visual evidence: `/tmp/amika-journal-home.png`, `/tmp/amika-journal-writer.png`, `/tmp/amika-journal-home-mobile.png`, and `/tmp/amika-journal-writer-mobile.png`.

## Journal home

| Ingredient | Web | Native |
| --- | --- | --- |
| Opening prompt | Wide Apricot Soft hero with date, large question, helper copy, and listening Seedling. | Compact Apricot Soft card with the same hierarchy and an 88px Seedling. |
| Draft recovery | Separate Warm White resume row with relative time, title, and latest words. | Separate Warm White resume row loaded from durable account-scoped storage. |
| New entry | Full-width Moss invitation with Apricot pen mark and explicit “Open journal” action. | Moss pressable with the same title/body hierarchy and native pressed translation. |
| Privacy | Activity row says “Private by default.” | Activity row says “Just yours.” Both remain visible before recent writing. |
| Search | 310px field aligned to the section heading on wide screens; full width on narrow screens. | Full-width field below the section heading. |
| Existing entries | Split list/detail library on wide web; stacked list then detail when the layout narrows. | One vertical card list; tapping opens the full-screen writer for editing. |
| Empty/loading/error | Memory Seedling plus honest status and recovery action. | Memory Seedling or shared native error/spinner component with retry. |

## Dedicated writer

- The app shell recedes so writing owns the viewport. Web uses a centered 1180px layout: conversation on the left and a 300px Cream Deep details rail on the right. Native uses a safe-area-aware full-screen scroll view and keyboard avoidance.
- The introduction pairs the listening Memory Seedling with “What’s on your mind?” and the promise “I’ll only respond when you ask.”
- The main textarea is the largest control, supports up to 4,000 characters, and exposes word count plus draft state. Writer-authored turns remain plain; Amika turns sit in Apricot Soft with a Seedling speaker mark.
- Title is optional. People tags are private organization only. Web keeps details visible at wide sizes and collapses them behind one accessible disclosure at 900px and below; native uses an “Entry details” disclosure.
- The final Moss action says “Finish & keep entry” for a new entry and “Save changes” for an edit. Delete is available only while editing and requires explicit confirmation.
- Errors explain that the draft is still present. Saving and responding disable conflicting actions without removing their labels.

## Explicit AI reflection

1. The writer must enter words before “Get a response” becomes available.
2. Pressing the control is the sole trigger for `/api/journal-guide`; no journal text is sent for reflection during typing, autosave, page load, or final entry save.
3. The guide receives the current writer-authored body and up to the last 12 validated conversation turns, with bounded input lengths.
4. Amika responds with one warm acknowledgment and exactly one concise open question, under 90 words.
5. The response must not diagnose, moralize, provide clinical advice, invent facts, force a positive reframe, change the entry, share it, or save it.
6. Failure leaves the writer's draft intact and presents a recoverable message.

**The Asked, Never Assumed Rule.** The writer owns the meaning and the timing; Amika only reflects after an explicit request.

## Durable draft contract

- **Web:** storage keys include the authenticated user ID. New entries use the account-scoped journal key; edits append the note ID. Drafts contain title, current input, conversation turns, private friend IDs, and update time.
- **Native:** drafts live in the app document directory, not the purgeable cache. The filename includes a fingerprint of the signed-in token, separating accounts on a shared device. New and edit drafts use distinct keys.
- **Write ordering:** native draft writes are serialized and revision-checked so an older write cannot replace a newer UI state.
- **Lifecycle:** remove a draft when no writer-authored words remain or after successful save/delete. Network and AI-response failures do not clear it.
- **Status:** communicate new, saving, saved-on-device, and error states in text; do not rely on the colored status dot alone.

## Memory Seedling roles

- **Listen:** home prompt, writer introduction, assistant turns, and response-in-progress state.
- **Peek:** the warm “blank page” empty state.
- **Rest:** loading, load error, and saved gentle-reflection card.
- The journal never uses the celebratory pose simply for opening, typing, or receiving an AI question; celebration remains earned by completing a memory.
- Decorative Seedlings are hidden from assistive technology unless a label adds real meaning. Status copy remains independently understandable.

## Responsive and accessibility rules

- At 900px and below, collapse the web library and writer settings rail; at 620px and below, stack hero/action content, make search full width, and use a vertically arranged save footer.
- Native writer content respects top/bottom safe areas, keyboard avoidance, platform back behavior, and at least 44px targets.
- Use Deep Moss or Muted Ink for body text and Deep Terracotta for small warm labels on Oat Cream/Apricot Soft. Flax edges remain visible; focus uses a three-pixel translucent Terracotta outline with offset on web.
- Announce loading/error state with text, keep controls semantic, expose `aria-expanded`/native accessibility state for details, and require confirmation before destructive deletion.
- Under reduced motion, remove hover translation, disclosure rotation, spinners, and mascot animation; do not remove status or progress copy.

## Guardrails

- Keep the journal private, quiet, and writer-led.
- Keep the first screen linear: prompt, resume if present, begin, privacy, search, history.
- Do not style the writer like chat bubbles, an analytics dashboard, or a productivity editor.
- Do not label private people tags in a way that implies recipients, mentions, or sharing.
- Do not make Amika proactively interpret writing or present its response as therapy, diagnosis, truth, or instruction.
- Do not sacrifice draft safety, account separation, readable contrast, or recovery states for a cleaner static mock.

## Unresolved decisions

- Saved `analysis` fields may appear as “A gentle reflection” on existing entries; the current guided conversation does not automatically persist assistant turns into that field.
