import SwiftUI

struct AddEventView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var title = ""
    @State private var description = ""
    @State private var date = Date()
    @State private var location = ""
    @State private var category: EventCategory = .experiences
    @State private var selectedFriendIds: Set<String> = []
    @State private var sendGoogleInvite = false
    @State private var isLoading = false
    @State private var error: String?

    @State private var friends: [Friend] = []

    let onAdd: (AmikaEvent) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Title
                        FormField(title: "Title *") {
                            TextField("Event title", text: $title)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Date & Time
                        FormField(title: "Date & Time") {
                            DatePicker(
                                "",
                                selection: $date,
                                displayedComponents: [.date, .hourAndMinute]
                            )
                            .datePickerStyle(.compact)
                            .labelsHidden()
                        }

                        // Category
                        FormField(title: "Category") {
                            Picker("Category", selection: $category) {
                                ForEach(EventCategory.allCases, id: \.self) { cat in
                                    Label(cat.displayName, systemImage: cat.icon)
                                        .tag(cat)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        // Location
                        FormField(title: "Location") {
                            TextField("Add location", text: $location)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Description
                        FormField(title: "Description") {
                            TextEditor(text: $description)
                                .frame(minHeight: 80)
                                .padding(8)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AmikaColors.border, lineWidth: 1)
                                )
                        }

                        // Friends
                        if !friends.isEmpty {
                            FormField(title: "Friends") {
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 8) {
                                        ForEach(friends) { friend in
                                            FriendChip(
                                                friend: friend,
                                                isSelected: selectedFriendIds.contains(friend.id)
                                            ) {
                                                if selectedFriendIds.contains(friend.id) {
                                                    selectedFriendIds.remove(friend.id)
                                                } else {
                                                    selectedFriendIds.insert(friend.id)
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Google Calendar invite
                        Toggle(isOn: $sendGoogleInvite) {
                            HStack {
                                Image(systemName: "calendar.badge.plus")
                                    .foregroundColor(AmikaColors.sage)
                                Text("Send Google Calendar invite")
                            }
                        }
                        .tint(AmikaColors.sage)
                        .padding()
                        .background(Color.white)
                        .cornerRadius(12)

                        if let error = error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(AmikaColors.error)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Add Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        addEvent()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Add")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(title.isEmpty || isLoading)
                }
            }
            .task {
                await loadFriends()
            }
        }
    }

    private func loadFriends() async {
        do {
            friends = try await FriendsService.shared.fetchFriends()
        } catch {
            print("Error loading friends: \(error)")
        }
    }

    private func addEvent() {
        isLoading = true
        error = nil

        Task {
            do {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime]

                let request = CreateEventRequest(
                    title: title,
                    description: description.isEmpty ? nil : description,
                    date: formatter.string(from: date),
                    location: location.isEmpty ? nil : location,
                    category: category.rawValue,
                    friendIds: selectedFriendIds.isEmpty ? nil : selectedFriendIds.joined(separator: ","),
                    sendGoogleInvite: sendGoogleInvite
                )

                let event = try await EventsService.shared.createEvent(request)
                onAdd(event)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct FriendChip: View {
    let friend: Friend
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 6) {
                Text(friend.initials)
                    .font(.caption)
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : AmikaColors.sage)
                    .frame(width: 24, height: 24)
                    .background(isSelected ? AmikaColors.sage : AmikaColors.sageLighter)
                    .clipShape(Circle())

                Text(friend.name)
                    .font(.subheadline)
                    .foregroundColor(isSelected ? .white : AmikaColors.textPrimary)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(isSelected ? AmikaColors.sage : Color.white)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? Color.clear : AmikaColors.border, lineWidth: 1)
            )
        }
    }
}

#Preview {
    AddEventView { _ in }
}
