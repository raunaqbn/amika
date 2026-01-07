import Foundation

enum Constants {
    /// Base URL for the Amika API
    /// Change this to your production URL when deploying
    static var apiBaseURL: String {
        #if DEBUG
        // Use environment variable or default to localhost for development
        return ProcessInfo.processInfo.environment["AMIKA_API_URL"] ?? "https://amika.app"
        #else
        return "https://amika.app"
        #endif
    }

    /// Keychain keys
    enum Keychain {
        static let sessionToken = "amika_session_token"
        static let userId = "amika_user_id"
    }

    /// UserDefaults keys
    enum UserDefaults {
        static let hasCompletedOnboarding = "has_completed_onboarding"
        static let lastSyncDate = "last_sync_date"
        static let cachedUser = "cached_user"
    }

    /// Notification names
    enum Notifications {
        static let sessionExpired = Notification.Name("sessionExpired")
        static let dataUpdated = Notification.Name("dataUpdated")
    }

    /// Date formats
    enum DateFormat {
        static let iso8601 = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        static let dateOnly = "yyyy-MM-dd"
        static let display = "MMM d, yyyy"
        static let displayWithTime = "MMM d, yyyy 'at' h:mm a"
    }

    /// App info
    enum App {
        static let name = "Amika"
        static let bundleId = "app.amika.ios"
        static let appStoreId = "" // Add when available
    }
}
