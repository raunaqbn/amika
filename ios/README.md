# Amika iOS App

Native iOS frontend for Amika - your AI-powered friendship companion.

## Requirements

- Xcode 15.0+
- iOS 17.0+
- Ruby 3.2+ (for Fastlane)
- Apple Developer Account (for TestFlight/App Store deployment)

## Getting Started

### 1. Clone and Open Project

```bash
cd ios/Amika
open Amika.xcodeproj
```

### 2. Configure the API URL

Edit `Amika/Utils/Constants.swift` and update the `apiBaseURL` to point to your Amika backend:

```swift
static var apiBaseURL: String {
    #if DEBUG
    return "https://your-dev-server.vercel.app"
    #else
    return "https://amika.app"
    #endif
}
```

### 3. Run the App

Select a simulator or device and press `Cmd + R` to build and run.

## Architecture

The app follows MVVM architecture:

```
Amika/
├── App/                 # App entry point and main views
├── Models/              # Data models matching backend schema
├── Services/            # API client and service layers
├── ViewModels/          # View models with business logic
├── Views/               # SwiftUI views organized by feature
│   ├── Auth/           # Authentication screens
│   ├── Friends/        # Friends management
│   ├── Events/         # Event planning
│   ├── Diary/          # Journal entries
│   ├── Mirror/         # AI chat interface
│   ├── Profile/        # User profile
│   └── Wishlist/       # Wishlist management
├── Utils/              # Colors, constants, utilities
└── Resources/          # Assets and Info.plist
```

## Features

- **Friends Management**: Add, edit, and track friendships
- **Events**: Plan activities with friends, sync with Google Calendar
- **Diary**: Journal with AI-powered insights
- **Mirror AI**: Chat with an AI companion for relationship advice
- **Wishlist**: Manage and share wishlists
- **Secure Auth**: Session-based authentication with Google OAuth support

## Deployment

### Setup Fastlane

```bash
cd ios
bundle install
```

### Configure Code Signing

1. Create a private Git repo for certificates
2. Update `fastlane/Matchfile` with your repo URL
3. Run `bundle exec fastlane sync_certificates`

### Deploy to TestFlight

```bash
bundle exec fastlane beta
```

### GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/ios-deploy.yml`) that:

1. Builds and tests the app on every PR
2. Automatically deploys to TestFlight on push to `main`

#### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `APPLE_ID` | Your Apple ID email |
| `TEAM_ID` | Apple Developer Team ID |
| `ITC_TEAM_ID` | App Store Connect Team ID |
| `MATCH_GIT_URL` | Private repo URL for certificates |
| `MATCH_PASSWORD` | Password for encrypted certificates |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Base64 encoded `username:token` |
| `KEYCHAIN_PASSWORD` | Password for CI keychain |
| `APP_STORE_CONNECT_API_KEY_ID` | App Store Connect API Key ID |
| `APP_STORE_CONNECT_API_ISSUER_ID` | API Key Issuer ID |
| `APP_STORE_CONNECT_API_KEY_CONTENT` | Base64 encoded .p8 key content |

### Fastlane Commands

| Command | Description |
|---------|-------------|
| `bundle exec fastlane build` | Build for testing |
| `bundle exec fastlane test` | Run unit tests |
| `bundle exec fastlane beta` | Build and upload to TestFlight |
| `bundle exec fastlane release` | Build and upload to App Store |
| `bundle exec fastlane bump_version type:patch` | Bump version number |

## Cost Comparison: Deployment Options

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **GitHub Actions + Fastlane** | ~$0.08/min (macOS) | Full control, integrates with existing workflow | More setup required |
| **Xcode Cloud** | 25 hrs/mo free | Native Apple integration | Limited customization |
| **Codemagic** | 500 min/mo free | Great iOS support | Less control |
| **Bitrise** | 90 min/mo free | Popular, good docs | Gets expensive |

We use **GitHub Actions + Fastlane** for the best balance of cost, control, and integration.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests locally
4. Submit a PR

## License

Proprietary - All rights reserved.
