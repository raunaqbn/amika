# Amika mobile

The native iOS and Android companion to Amika: one private, everyday memory at a time with close friends.

## Local development

Install dependencies and start Expo:

```bash
npm install
npx expo start
```

Useful checks:

```bash
npm run typecheck
npm run doctor
npx expo export --platform all
```

The production EAS profiles in `eas.json` use `https://amika.vercel.app`. Override `EXPO_PUBLIC_API_URL` for a local API when needed.

## Product shape

The Pocket Accordion home flow opens directly into daily memory capture. Home, Friends, Add, Messages, and Journal are the only primary destinations; trip-planning concepts are intentionally absent.

Release metadata and remaining store-account requirements live in `store/`.
