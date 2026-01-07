import SwiftUI

struct FriendsView: View {
    @StateObject private var viewModel = FriendsViewModel()
    @State private var searchText = ""
    @State private var showAddFriend = false
    @State private var selectedFriend: Friend?

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                if viewModel.isLoading && viewModel.friends.isEmpty {
                    ProgressView()
                        .scaleEffect(1.5)
                } else if viewModel.friends.isEmpty {
                    EmptyFriendsView(showAddFriend: $showAddFriend)
                } else {
                    friendsList
                }
            }
            .navigationTitle("Friends")
            .searchable(text: $searchText, prompt: "Search friends")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddFriend = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
            .sheet(isPresented: $showAddFriend) {
                AddFriendView { friend in
                    viewModel.friends.insert(friend, at: 0)
                }
            }
            .sheet(item: $selectedFriend) { friend in
                FriendDetailView(friend: friend, onUpdate: { updated in
                    if let index = viewModel.friends.firstIndex(where: { $0.id == updated.id }) {
                        viewModel.friends[index] = updated
                    }
                }, onDelete: {
                    viewModel.friends.removeAll { $0.id == friend.id }
                })
            }
            .refreshable {
                await viewModel.loadFriends()
            }
            .task {
                await viewModel.loadFriends()
            }
        }
    }

    private var friendsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Upcoming birthdays section
                if !upcomingBirthdays.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Upcoming Birthdays")
                            .font(.headline)
                            .foregroundColor(AmikaColors.textPrimary)
                            .padding(.horizontal)

                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(upcomingBirthdays) { friend in
                                    BirthdayCard(friend: friend)
                                        .onTapGesture {
                                            selectedFriend = friend
                                        }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.vertical)
                }

                // All friends
                ForEach(filteredFriends) { friend in
                    FriendRow(friend: friend)
                        .onTapGesture {
                            selectedFriend = friend
                        }
                        .padding(.horizontal)
                }
            }
            .padding(.vertical)
        }
    }

    private var filteredFriends: [Friend] {
        if searchText.isEmpty {
            return viewModel.friends
        }
        return viewModel.friends.filter { friend in
            friend.name.localizedCaseInsensitiveContains(searchText) ||
            (friend.notes?.localizedCaseInsensitiveContains(searchText) ?? false)
        }
    }

    private var upcomingBirthdays: [Friend] {
        viewModel.friends
            .filter { friend in
                guard let days = friend.daysUntilBirthday else { return false }
                return days <= 30
            }
            .sorted { ($0.daysUntilBirthday ?? 999) < ($1.daysUntilBirthday ?? 999) }
            .prefix(5)
            .map { $0 }
    }
}

struct FriendRow: View {
    let friend: Friend

    var body: some View {
        HStack(spacing: 16) {
            // Avatar
            ZStack {
                Circle()
                    .fill(AmikaColors.sageLighter)
                    .frame(width: 56, height: 56)

                if let imageUrl = friend.profileImage, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Text(friend.initials)
                            .font(.headline)
                            .foregroundColor(AmikaColors.sage)
                    }
                    .frame(width: 56, height: 56)
                    .clipShape(Circle())
                } else {
                    Text(friend.initials)
                        .font(.headline)
                        .foregroundColor(AmikaColors.sage)
                }

                // Amika friend badge
                if friend.isAmikaFriend {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 16))
                        .foregroundColor(AmikaColors.sage)
                        .background(Color.white)
                        .clipShape(Circle())
                        .offset(x: 20, y: 20)
                }
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                Text(friend.name)
                    .font(.headline)
                    .foregroundColor(AmikaColors.textPrimary)

                if let howWeMet = friend.howWeMet, !howWeMet.isEmpty {
                    Text(howWeMet)
                        .font(.subheadline)
                        .foregroundColor(AmikaColors.textSecondary)
                        .lineLimit(1)
                }

                if let days = friend.daysUntilBirthday, days <= 30 {
                    HStack(spacing: 4) {
                        Image(systemName: "birthday.cake.fill")
                            .font(.caption)
                        Text(days == 0 ? "Today!" : "in \(days) days")
                            .font(.caption)
                    }
                    .foregroundColor(AmikaColors.rose)
                }
            }

            Spacer()

            // Friendship points
            if let points = friend.friendshipPoints, points > 0 {
                HStack(spacing: 2) {
                    Image(systemName: "heart.fill")
                        .font(.caption)
                    Text("\(points)")
                        .font(.caption)
                }
                .foregroundColor(AmikaColors.rose)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(AmikaColors.roseLighter)
                .cornerRadius(12)
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(AmikaColors.textMuted)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

struct BirthdayCard: View {
    let friend: Friend

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(AmikaColors.roseLighter)
                    .frame(width: 60, height: 60)

                Text(friend.initials)
                    .font(.headline)
                    .foregroundColor(AmikaColors.rose)
            }

            Text(friend.name)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(AmikaColors.textPrimary)
                .lineLimit(1)

            if let days = friend.daysUntilBirthday {
                Text(days == 0 ? "Today!" : "\(days)d")
                    .font(.caption2)
                    .foregroundColor(AmikaColors.rose)
            }
        }
        .frame(width: 80)
        .padding(.vertical, 12)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.05), radius: 2, x: 0, y: 1)
    }
}

struct EmptyFriendsView: View {
    @Binding var showAddFriend: Bool

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "person.2.fill")
                .font(.system(size: 60))
                .foregroundColor(AmikaColors.sage.opacity(0.5))

            Text("No friends yet")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(AmikaColors.textPrimary)

            Text("Add your first friend to start nurturing your relationships")
                .font(.subheadline)
                .foregroundColor(AmikaColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button {
                showAddFriend = true
            } label: {
                Label("Add Friend", systemImage: "plus")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(AmikaColors.sage)
                    .cornerRadius(12)
            }
        }
    }
}

#Preview {
    FriendsView()
        .environmentObject(AuthManager())
}
