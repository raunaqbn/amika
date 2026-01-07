import SwiftUI

struct EditFriendView: View {
    let friend: Friend
    let onUpdate: (Friend) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var name: String
    @State private var birthday: String
    @State private var howWeMet: String
    @State private var notes: String
    @State private var interests: String
    @State private var showDatePicker = false
    @State private var selectedDate = Date()
    @State private var isLoading = false
    @State private var error: String?

    init(friend: Friend, onUpdate: @escaping (Friend) -> Void) {
        self.friend = friend
        self.onUpdate = onUpdate
        _name = State(initialValue: friend.name)
        _birthday = State(initialValue: friend.birthday ?? "")
        _howWeMet = State(initialValue: friend.howWeMet ?? "")
        _notes = State(initialValue: friend.notes ?? "")
        _interests = State(initialValue: friend.interests ?? "")

        if let birthdayDate = friend.birthdayDate {
            _selectedDate = State(initialValue: birthdayDate)
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Name
                        FormField(title: "Name *") {
                            TextField("Friend's name", text: $name)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Birthday
                        FormField(title: "Birthday") {
                            Button {
                                showDatePicker = true
                            } label: {
                                HStack {
                                    Text(birthday.isEmpty ? "Select birthday" : birthday)
                                        .foregroundColor(birthday.isEmpty ? AmikaColors.textMuted : AmikaColors.textPrimary)
                                    Spacer()
                                    Image(systemName: "calendar")
                                        .foregroundColor(AmikaColors.sage)
                                }
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AmikaColors.border, lineWidth: 1)
                                )
                            }
                        }

                        // How we met
                        FormField(title: "How We Met") {
                            TextField("Work, school, mutual friend...", text: $howWeMet)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Interests
                        FormField(title: "Interests (comma-separated)") {
                            TextField("hiking, photography, cooking...", text: $interests)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Notes
                        FormField(title: "Notes") {
                            TextEditor(text: $notes)
                                .frame(minHeight: 100)
                                .padding(8)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AmikaColors.border, lineWidth: 1)
                                )
                        }

                        if let error = error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(AmikaColors.error)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Edit Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        updateFriend()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(name.isEmpty || isLoading)
                }
            }
            .sheet(isPresented: $showDatePicker) {
                DatePickerSheet(selectedDate: $selectedDate, onSelect: { date in
                    let formatter = DateFormatter()
                    formatter.dateFormat = "yyyy-MM-dd"
                    birthday = formatter.string(from: date)
                    showDatePicker = false
                })
            }
        }
    }

    private func updateFriend() {
        isLoading = true
        error = nil

        Task {
            do {
                let request = UpdateFriendRequest(
                    id: friend.id,
                    name: name,
                    birthday: birthday.isEmpty ? nil : birthday,
                    howWeMet: howWeMet.isEmpty ? nil : howWeMet,
                    notes: notes.isEmpty ? nil : notes,
                    interests: interests.isEmpty ? nil : interests,
                    profileImage: friend.profileImage,
                    lastContact: nil
                )

                let updated = try await FriendsService.shared.updateFriend(request)
                onUpdate(updated)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    EditFriendView(
        friend: Friend(
            id: "1",
            userId: "1",
            name: "John Doe",
            birthday: "1990-05-15",
            howWeMet: "College",
            notes: "Great friend",
            interests: "hiking,photography",
            profileImage: nil,
            friendshipPoints: nil,
            lastContact: nil,
            linkedUserId: nil,
            amikaCode: nil,
            createdAt: nil,
            updatedAt: nil
        ),
        onUpdate: { _ in }
    )
}
