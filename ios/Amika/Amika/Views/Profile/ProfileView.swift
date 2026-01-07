import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @State private var showEditProfile = false
    @State private var showSignOutAlert = false
    @State private var isGoogleCalendarConnected = false

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Profile header
                        profileHeader

                        // Stats
                        if let stats = authManager.userStats {
                            statsSection(stats)
                        }

                        // Settings sections
                        settingsSection

                        // Sign out
                        Button {
                            showSignOutAlert = true
                        } label: {
                            Text("Sign Out")
                                .font(.headline)
                                .foregroundColor(AmikaColors.error)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                        }
                        .padding(.horizontal)
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Profile")
            .sheet(isPresented: $showEditProfile) {
                EditProfileView()
            }
            .alert("Sign Out", isPresented: $showSignOutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Sign Out", role: .destructive) {
                    Task {
                        await authManager.signOut()
                    }
                }
            } message: {
                Text("Are you sure you want to sign out?")
            }
            .task {
                isGoogleCalendarConnected = await authManager.isGoogleCalendarConnected()
            }
        }
    }

    private var profileHeader: some View {
        VStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(AmikaColors.sageLighter)
                    .frame(width: 100, height: 100)

                if let user = authManager.currentUser,
                   let imageUrl = user.profileImage,
                   let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        userInitials
                    }
                    .frame(width: 100, height: 100)
                    .clipShape(Circle())
                } else {
                    userInitials
                }
            }

            // Name
            if let user = authManager.currentUser {
                Text(user.name ?? user.email)
                    .font(.title2)
                    .fontWeight(.bold)
                    .foregroundColor(AmikaColors.textPrimary)

                Text(user.email)
                    .font(.subheadline)
                    .foregroundColor(AmikaColors.textSecondary)

                // Amika Code
                if let code = user.amikaCode {
                    HStack {
                        Text("Amika Code:")
                            .font(.caption)
                            .foregroundColor(AmikaColors.textMuted)
                        Text(code)
                            .font(.caption)
                            .fontWeight(.medium)
                            .foregroundColor(AmikaColors.sage)
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(AmikaColors.sageLighter)
                    .cornerRadius(16)
                }
            }

            // Edit button
            Button {
                showEditProfile = true
            } label: {
                Label("Edit Profile", systemImage: "pencil")
                    .font(.subheadline)
                    .foregroundColor(AmikaColors.sage)
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .cornerRadius(16)
        .padding(.horizontal)
    }

    private var userInitials: some View {
        Group {
            if let user = authManager.currentUser {
                let name = user.name ?? user.email
                let initials = name.split(separator: " ").prefix(2).map { String($0.prefix(1)) }.joined().uppercased()
                Text(initials.isEmpty ? "?" : initials)
                    .font(.largeTitle)
                    .foregroundColor(AmikaColors.sage)
            }
        }
    }

    private func statsSection(_ stats: UserStats) -> some View {
        HStack(spacing: 20) {
            StatItem(value: "\(stats.friendCount)", label: "Friends", icon: "person.2.fill")
            StatItem(value: "\(stats.eventCount)", label: "Events", icon: "calendar")
            StatItem(value: "\(stats.memoryCount)", label: "Memories", icon: "photo.fill")
            StatItem(value: "\(stats.diaryCount)", label: "Entries", icon: "book.fill")
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .padding(.horizontal)
    }

    private var settingsSection: some View {
        VStack(spacing: 0) {
            // Google Calendar
            SettingsRow(
                icon: "calendar.badge.plus",
                title: "Google Calendar",
                subtitle: isGoogleCalendarConnected ? "Connected" : "Not connected",
                showChevron: !isGoogleCalendarConnected
            ) {
                if !isGoogleCalendarConnected {
                    connectGoogleCalendar()
                }
            }

            Divider()
                .padding(.leading, 56)

            // Wishlist
            NavigationLink {
                WishlistView()
            } label: {
                SettingsRowContent(
                    icon: "gift.fill",
                    title: "My Wishlist",
                    subtitle: nil,
                    showChevron: true
                )
            }

            Divider()
                .padding(.leading, 56)

            // Notifications
            SettingsRow(
                icon: "bell.fill",
                title: "Notifications",
                subtitle: "Birthday reminders",
                showChevron: true
            ) {
                // Open settings
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }

            Divider()
                .padding(.leading, 56)

            // About
            SettingsRow(
                icon: "info.circle.fill",
                title: "About Amika",
                subtitle: "Version 1.0.0",
                showChevron: false
            ) {}
        }
        .background(Color.white)
        .cornerRadius(16)
        .padding(.horizontal)
    }

    private func connectGoogleCalendar() {
        // Open Google Calendar OAuth flow
        if let url = authManager.initiateGoogleCalendarConnection() {
            UIApplication.shared.open(url)
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String?
    let showChevron: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            SettingsRowContent(
                icon: icon,
                title: title,
                subtitle: subtitle,
                showChevron: showChevron
            )
        }
    }
}

struct SettingsRowContent: View {
    let icon: String
    let title: String
    let subtitle: String?
    let showChevron: Bool

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(AmikaColors.sage)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .foregroundColor(AmikaColors.textPrimary)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(AmikaColors.textMuted)
                }
            }

            Spacer()

            if showChevron {
                Image(systemName: "chevron.right")
                    .font(.caption)
                    .foregroundColor(AmikaColors.textMuted)
            }
        }
        .padding()
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthManager())
}
