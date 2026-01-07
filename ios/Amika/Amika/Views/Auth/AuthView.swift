import SwiftUI
import AuthenticationServices

struct AuthView: View {
    @State private var showSignUp = false

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()

                    // Logo and branding
                    VStack(spacing: 16) {
                        Image(systemName: "heart.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(AmikaColors.sage)

                        Text("Amika")
                            .font(.system(size: 48, weight: .bold, design: .rounded))
                            .foregroundColor(AmikaColors.textPrimary)

                        Text("Nurture your friendships")
                            .font(.title3)
                            .foregroundColor(AmikaColors.textSecondary)
                    }

                    Spacer()

                    // Auth options
                    VStack(spacing: 16) {
                        NavigationLink {
                            SignInView()
                        } label: {
                            Text("Sign In")
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(AmikaColors.sage)
                                .cornerRadius(12)
                        }

                        NavigationLink {
                            SignUpView()
                        } label: {
                            Text("Create Account")
                                .font(.headline)
                                .foregroundColor(AmikaColors.sage)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(AmikaColors.sageLighter)
                                .cornerRadius(12)
                        }

                        // Divider
                        HStack {
                            Rectangle()
                                .fill(AmikaColors.border)
                                .frame(height: 1)

                            Text("or")
                                .font(.subheadline)
                                .foregroundColor(AmikaColors.textMuted)

                            Rectangle()
                                .fill(AmikaColors.border)
                                .frame(height: 1)
                        }
                        .padding(.vertical, 8)

                        // Google Sign In
                        GoogleSignInButton()
                    }
                    .padding(.horizontal, 32)

                    Spacer()
                        .frame(height: 50)
                }
            }
        }
    }
}

struct GoogleSignInButton: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var isLoading = false
    @State private var showWebAuth = false

    var body: some View {
        Button {
            showWebAuth = true
        } label: {
            HStack(spacing: 12) {
                Image(systemName: "g.circle.fill")
                    .font(.title2)

                Text("Continue with Google")
                    .font(.headline)
            }
            .foregroundColor(AmikaColors.textPrimary)
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.white)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(AmikaColors.border, lineWidth: 1)
            )
        }
        .sheet(isPresented: $showWebAuth) {
            if let url = authManager.initiateGoogleSignIn() {
                GoogleAuthWebView(url: url) { success in
                    showWebAuth = false
                    if success {
                        Task {
                            await authManager.checkSession()
                        }
                    }
                }
            }
        }
    }
}

struct GoogleAuthWebView: View {
    let url: URL
    let onComplete: (Bool) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            WebAuthView(url: url, callbackScheme: "amika", onCallback: { callbackURL in
                // Handle OAuth callback
                onComplete(true)
            })
            .navigationTitle("Sign in with Google")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        onComplete(false)
                    }
                }
            }
        }
    }
}

#Preview {
    AuthView()
        .environmentObject(AuthManager())
}
