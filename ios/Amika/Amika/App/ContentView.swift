import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthManager

    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
        .animation(.easeInOut, value: authManager.isAuthenticated)
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            AmikaColors.background
                .ignoresSafeArea()

            VStack(spacing: 20) {
                Image(systemName: "heart.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(AmikaColors.sage)

                Text("Amika")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .foregroundColor(AmikaColors.textPrimary)

                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: AmikaColors.sage))
            }
        }
    }
}

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            FriendsView()
                .tabItem {
                    Label("Friends", systemImage: "person.2.fill")
                }
                .tag(0)

            EventsView()
                .tabItem {
                    Label("Events", systemImage: "calendar")
                }
                .tag(1)

            MirrorView()
                .tabItem {
                    Label("Mirror", systemImage: "bubble.left.and.bubble.right.fill")
                }
                .tag(2)

            DiaryView()
                .tabItem {
                    Label("Diary", systemImage: "book.fill")
                }
                .tag(3)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.circle.fill")
                }
                .tag(4)
        }
        .tint(AmikaColors.sage)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthManager())
        .environmentObject(NetworkMonitor())
}
