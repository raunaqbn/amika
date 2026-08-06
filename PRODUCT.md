# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Amika is for people who want a lightweight daily ritual for remembering ordinary moments with close friends. They use it after spending time together, when a photo or short note is still fresh, and when they want to revisit the history of a friendship without turning it into a planning task.

## Product Purpose

Amika helps friends capture, share, and revisit one another's everyday memories. Success means people can add a meaningful memory in seconds, decide exactly who sees it, and return regularly to a living record of their friendships.

## Positioning

Amika is a memory-first social network: the primary object is a dated moment connected to real friends, not a trip, event, follower metric, or general-purpose post.

## Operating Context

- A daily memory can include text, photos, tagged friends, a date, and a visibility choice.
- Memories appear in a friends feed, on profiles, in personal collections, and—when explicitly public—in discovery.
- Friends can respond and continue the moment through social interactions and direct messages.
- Private journaling remains available for reflection that should not be social.

## Capabilities and Constraints

- Preserve authentication, profiles, friend connections, notifications, direct messaging, and private journaling.
- Support private, friends-only, and public memory visibility; sharing beyond friends is optional rather than the default.
- Preserve existing memory and friendship data where possible.
- Remove trip planning, event planning, and planning-oriented product language, navigation, routes, APIs, and data dependencies.
- The existing project is a responsive Next.js web application with a mobile-first installed-app mode.

## Brand Commitments

- Keep the product name Amika.
- The product should feel like a modern social app centered on close friendship and everyday remembering.
- The experience should prioritize people and moments over logistics, productivity, or performance metrics.

## Evidence on Hand

- Existing authentication, friendship, memory, notification, journal, and image-upload implementations in `src/`.
- Existing Amika application icons in `public/` and `src/app/`.
- No approved testimonials, usage metrics, customer claims, or photographic brand library are present; future work must not fabricate them.

## Product Principles

1. Make today's memory the easiest and most prominent action.
2. Give every memory a clear audience and make privacy understandable at a glance.
3. Treat friendship history as something to revisit, not something to optimize.
4. Keep conversation and reflection close to the memory that prompted them.
5. Remove planning mechanics that compete with the daily capture ritual.

## Accessibility & Inclusion

The responsive web experience should support keyboard navigation, visible focus, semantic controls, reduced motion, sufficient color contrast, and touch targets appropriate for mobile use.
