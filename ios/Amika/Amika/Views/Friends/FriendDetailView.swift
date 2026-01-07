import SwiftUI

struct FriendDetailView: View {
    let friend: Friend
    let onUpdate: (Friend) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showEditSheet = false
    @State private var showDeleteAlert = false
    @State private var selectedTab = 0

    @State private var memories: [Memory] = []
    @State private var events: [AmikaEvent] = []
    @State private var isLoading = false

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
                        statsSection

                        // Tabs
                        tabSection

                        // Content based on selected tab
                        contentSection
                    }
                    .padding()
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button {
                            showEditSheet = true
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }

                        Button(role: .destructive) {
                            showDeleteAlert = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
            .sheet(isPresented: $showEditSheet) {
                EditFriendView(friend: friend, onUpdate: onUpdate)
            }
            .alert("Delete Friend", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteFriend()
                }
            } message: {
                Text("Are you sure you want to delete \(friend.name)? This action cannot be undone.")
            }
            .task {
                await loadData()
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

                if let imageUrl = friend.profileImage, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Text(friend.initials)
                            .font(.largeTitle)
                            .foregroundColor(AmikaColors.sage)
                    }
                    .frame(width: 100, height: 100)
                    .clipShape(Circle())
                } else {
                    Text(friend.initials)
                        .font(.largeTitle)
                        .foregroundColor(AmikaColors.sage)
                }

                if friend.isAmikaFriend {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 24))
                        .foregroundColor(AmikaColors.sage)
                        .background(Color.white)
                        .clipShape(Circle())
                        .offset(x: 35, y: 35)
                }
            }

            // Name
            Text(friend.name)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(AmikaColors.textPrimary)

            // How we met
            if let howWeMet = friend.howWeMet, !howWeMet.isEmpty {
                Text(howWeMet)
                    .font(.subheadline)
                    .foregroundColor(AmikaColors.textSecondary)
            }

            // Birthday
            if let birthdayDate = friend.birthdayDate {
                HStack(spacing: 4) {
                    Image(systemName: "birthday.cake.fill")
                    Text(birthdayDate, style: .date)
                    if let days = friend.daysUntilBirthday {
                        Text("(\(days == 0 ? "Today!" : "in \(days) days"))")
                            .fontWeight(.medium)
                    }
                }
                .font(.subheadline)
                .foregroundColor(AmikaColors.rose)
            }

            // Interests
            if !friend.interestsList.isEmpty {
                FlowLayout(spacing: 8) {
                    ForEach(friend.interestsList, id: \.self) { interest in
                        Text(interest)
                            .font(.caption)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(AmikaColors.sageLighter)
                            .foregroundColor(AmikaColors.sage)
                            .cornerRadius(16)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
    }

    private var statsSection: some View {
        HStack(spacing: 20) {
            StatItem(value: "\(memories.count)", label: "Memories", icon: "photo.fill")
            StatItem(value: "\(events.count)", label: "Events", icon: "calendar")
            if let points = friend.friendshipPoints {
                StatItem(value: "\(points)", label: "Points", icon: "heart.fill")
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
    }

    private var tabSection: some View {
        HStack(spacing: 0) {
            TabButton(title: "Notes", isSelected: selectedTab == 0) {
                selectedTab = 0
            }
            TabButton(title: "Memories", isSelected: selectedTab == 1) {
                selectedTab = 1
            }
            TabButton(title: "Events", isSelected: selectedTab == 2) {
                selectedTab = 2
            }
        }
        .background(Color.white)
        .cornerRadius(12)
    }

    @ViewBuilder
    private var contentSection: some View {
        switch selectedTab {
        case 0:
            notesSection
        case 1:
            memoriesSection
        case 2:
            eventsSection
        default:
            EmptyView()
        }
    }

    private var notesSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            if let notes = friend.notes, !notes.isEmpty {
                Text(notes)
                    .font(.body)
                    .foregroundColor(AmikaColors.textPrimary)
                    .padding()
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.white)
                    .cornerRadius(12)
            } else {
                EmptyContentView(
                    icon: "note.text",
                    title: "No notes yet",
                    subtitle: "Add notes about \(friend.name)"
                )
            }
        }
    }

    private var memoriesSection: some View {
        VStack(spacing: 12) {
            if memories.isEmpty && !isLoading {
                EmptyContentView(
                    icon: "photo.fill",
                    title: "No memories yet",
                    subtitle: "Create memories with \(friend.name)"
                )
            } else {
                ForEach(memories) { memory in
                    MemoryCard(memory: memory)
                }
            }
        }
    }

    private var eventsSection: some View {
        VStack(spacing: 12) {
            if events.isEmpty && !isLoading {
                EmptyContentView(
                    icon: "calendar",
                    title: "No events yet",
                    subtitle: "Plan activities with \(friend.name)"
                )
            } else {
                ForEach(events) { event in
                    EventCard(event: event)
                }
            }
        }
    }

    private func loadData() async {
        isLoading = true

        do {
            async let memoriesTask = MemoriesService.shared.fetchMemories(friendId: friend.id)
            async let eventsTask = EventsService.shared.fetchEvents(friendId: friend.id)

            memories = try await memoriesTask
            events = try await eventsTask
        } catch {
            print("Error loading friend data: \(error)")
        }

        isLoading = false
    }

    private func deleteFriend() {
        Task {
            do {
                try await FriendsService.shared.deleteFriend(id: friend.id)
                onDelete()
                dismiss()
            } catch {
                print("Error deleting friend: \(error)")
            }
        }
    }
}

struct StatItem: View {
    let value: String
    let label: String
    let icon: String

    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(AmikaColors.sage)

            Text(value)
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(AmikaColors.textPrimary)

            Text(label)
                .font(.caption)
                .foregroundColor(AmikaColors.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }
}

struct TabButton: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.subheadline)
                .fontWeight(isSelected ? .semibold : .regular)
                .foregroundColor(isSelected ? AmikaColors.sage : AmikaColors.textSecondary)
                .padding(.vertical, 12)
                .frame(maxWidth: .infinity)
                .background(isSelected ? AmikaColors.sageLighter : Color.clear)
        }
    }
}

struct EmptyContentView: View {
    let icon: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundColor(AmikaColors.textMuted)

            Text(title)
                .font(.headline)
                .foregroundColor(AmikaColors.textSecondary)

            Text(subtitle)
                .font(.subheadline)
                .foregroundColor(AmikaColors.textMuted)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 40)
    }
}

struct MemoryCard: View {
    let memory: Memory

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(memory.content)
                .font(.body)
                .foregroundColor(AmikaColors.textPrimary)

            Text(memory.displayDate)
                .font(.caption)
                .foregroundColor(AmikaColors.textMuted)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(12)
    }
}

struct EventCard: View {
    let event: AmikaEvent

    var body: some View {
        HStack(spacing: 12) {
            // Category icon
            Image(systemName: event.category?.icon ?? "calendar")
                .font(.title2)
                .foregroundColor(AmikaColors.sage)
                .frame(width: 44, height: 44)
                .background(AmikaColors.sageLighter)
                .cornerRadius(10)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .foregroundColor(AmikaColors.textPrimary)
                    .strikethrough(event.isCompleted == true)

                Text(event.displayDate)
                    .font(.caption)
                    .foregroundColor(AmikaColors.textSecondary)

                if let location = event.location, !location.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(location)
                            .font(.caption)
                    }
                    .foregroundColor(AmikaColors.textMuted)
                }
            }

            Spacer()

            if event.isCompleted == true {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(AmikaColors.success)
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = FlowResult(in: proposal.width ?? 0, subviews: subviews, spacing: spacing)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = FlowResult(in: bounds.width, subviews: subviews, spacing: spacing)
        for (index, subview) in subviews.enumerated() {
            subview.place(at: CGPoint(x: bounds.minX + result.positions[index].x, y: bounds.minY + result.positions[index].y), proposal: .unspecified)
        }
    }

    struct FlowResult {
        var size: CGSize = .zero
        var positions: [CGPoint] = []

        init(in width: CGFloat, subviews: Subviews, spacing: CGFloat) {
            var currentX: CGFloat = 0
            var currentY: CGFloat = 0
            var lineHeight: CGFloat = 0

            for subview in subviews {
                let size = subview.sizeThatFits(.unspecified)

                if currentX + size.width > width && currentX > 0 {
                    currentX = 0
                    currentY += lineHeight + spacing
                    lineHeight = 0
                }

                positions.append(CGPoint(x: currentX, y: currentY))
                lineHeight = max(lineHeight, size.height)
                currentX += size.width + spacing
                self.size.width = max(self.size.width, currentX)
            }

            self.size.height = currentY + lineHeight
        }
    }
}

#Preview {
    FriendDetailView(
        friend: Friend(
            id: "1",
            userId: "1",
            name: "John Doe",
            birthday: "1990-05-15",
            howWeMet: "College roommate",
            notes: "Great friend, loves hiking",
            interests: "hiking,photography,cooking",
            profileImage: nil,
            friendshipPoints: 42,
            lastContact: nil,
            linkedUserId: nil,
            amikaCode: nil,
            createdAt: nil,
            updatedAt: nil
        ),
        onUpdate: { _ in },
        onDelete: {}
    )
}
