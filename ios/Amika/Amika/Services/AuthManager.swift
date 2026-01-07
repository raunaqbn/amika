import Foundation
import AuthenticationServices

/// Manages authentication state and operations
@MainActor
class AuthManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    @Published var currentUser: User?
    @Published var userStats: UserStats?
    @Published var error: String?

    private let apiClient = APIClient.shared

    init() {
        // Check for existing session on init
        Task {
            await checkSession()
        }

        // Listen for session expiry notifications
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleSessionExpired),
            name: Constants.Notifications.sessionExpired,
            object: nil
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func handleSessionExpired() {
        Task { @MainActor in
            self.isAuthenticated = false
            self.currentUser = nil
            self.userStats = nil
        }
    }

    // MARK: - Session Management

    func checkSession() async {
        isLoading = true

        do {
            let session: AuthSession = try await apiClient.request(endpoint: "/api/auth/session")
            self.currentUser = session.user
            self.userStats = session.stats
            self.isAuthenticated = true

            // Cache user ID
            try? KeychainService.shared.save(session.userId, forKey: Constants.Keychain.userId)
        } catch {
            // Session invalid or expired
            self.isAuthenticated = false
            self.currentUser = nil
            self.userStats = nil
        }

        isLoading = false
    }

    // MARK: - Sign In

    func signIn(email: String, password: String) async throws {
        error = nil

        let request = SignInRequest(email: email, password: password)
        let response: AuthResponse = try await apiClient.request(
            endpoint: "/api/auth/signin",
            method: .post,
            body: request
        )

        if let errorMessage = response.error {
            error = errorMessage
            throw AuthError.signInFailed(errorMessage)
        }

        // Fetch session after successful sign in
        await checkSession()
    }

    // MARK: - Sign Up

    func signUp(email: String, password: String, name: String?) async throws {
        error = nil

        let request = SignUpRequest(email: email, password: password, name: name)
        let response: AuthResponse = try await apiClient.request(
            endpoint: "/api/auth/signup",
            method: .post,
            body: request
        )

        if let errorMessage = response.error {
            error = errorMessage
            throw AuthError.signUpFailed(errorMessage)
        }

        // Fetch session after successful sign up
        await checkSession()
    }

    // MARK: - Sign Out

    func signOut() async {
        do {
            try await apiClient.requestVoid(endpoint: "/api/auth/signout", method: .post)
        } catch {
            // Continue with local sign out even if server request fails
            print("Sign out request failed: \(error)")
        }

        // Clear local state
        KeychainService.shared.clearAll()
        isAuthenticated = false
        currentUser = nil
        userStats = nil
    }

    // MARK: - Profile Update

    func updateProfile(name: String?, birthday: String?, interests: String?, profileImage: String?) async throws {
        let request = ProfileUpdateRequest(
            name: name,
            birthday: birthday,
            interests: interests,
            profileImage: profileImage
        )

        let updatedUser: User = try await apiClient.request(
            endpoint: "/api/auth/profile",
            method: .put,
            body: request
        )

        self.currentUser = updatedUser
    }

    // MARK: - Google Sign In

    func initiateGoogleSignIn() -> URL? {
        // Returns the URL to open in ASWebAuthenticationSession
        let urlString = Constants.apiBaseURL + "/api/auth/google"
        return URL(string: urlString)
    }

    func handleGoogleCallback(url: URL) async throws {
        // After OAuth callback, check session to get user
        await checkSession()
    }

    // MARK: - Google Calendar Connection

    func initiateGoogleCalendarConnection() -> URL? {
        let urlString = Constants.apiBaseURL + "/api/auth/google-calendar"
        return URL(string: urlString)
    }

    func isGoogleCalendarConnected() async -> Bool {
        // Check if user has Google Calendar connected
        do {
            struct GoogleAccountCheck: Codable {
                let connected: Bool
            }
            let response: GoogleAccountCheck = try await apiClient.request(endpoint: "/api/auth/google-calendar/status")
            return response.connected
        } catch {
            return false
        }
    }
}

enum AuthError: LocalizedError {
    case signInFailed(String)
    case signUpFailed(String)
    case googleSignInFailed
    case sessionExpired

    var errorDescription: String? {
        switch self {
        case .signInFailed(let message):
            return message
        case .signUpFailed(let message):
            return message
        case .googleSignInFailed:
            return "Failed to sign in with Google"
        case .sessionExpired:
            return "Your session has expired. Please sign in again."
        }
    }
}
