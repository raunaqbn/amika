# Amika mobile release

The app is configured for TestFlight and Google Play internal testing first.

## Current release state

- EAS project: https://expo.dev/accounts/raunaqnaidu/projects/amika
- iOS bundle identifier: `app.amika.ios`
- Android package: `app.amika.android`
- Android signing key: managed by EAS
- Production API: `https://amika.vercel.app`

## Remaining store setup

1. Create the App Store Connect record and finish Apple Developer credential setup in EAS.
2. Create the Play Console app and configure a Google Play service account for EAS Submit.
3. Replace the placeholder support and privacy URLs in `store/metadata.md` with live pages.
4. Complete age-rating, review-contact, data-safety, and privacy disclosures in each store.
5. Capture final store screenshots from the signed release candidate.

Run `npx eas-cli@latest build --platform all --profile production` to create signed binaries. Run `npx eas-cli@latest submit --platform ios --profile production` for TestFlight and `npx eas-cli@latest submit --platform android --profile production` for the Play internal track. Google requires the first Android upload to be made manually before API-based submissions are accepted.
