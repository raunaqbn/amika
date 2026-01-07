import SwiftUI

struct AddFriendView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var birthday = ""
    @State private var howWeMet = ""
    @State private var notes = ""
    @State private var amikaCode = ""
    @State private var showDatePicker = false
    @State private var selectedDate = Date()
    @State private var isLoading = false
    @State private var error: String?

    let onAdd: (Friend) -> Void

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

                        // Amika Code (for connecting with other Amika users)
                        FormField(title: "Amika Code (optional)") {
                            TextField("Enter their Amika code to connect", text: $amikaCode)
                                .textFieldStyle(AmikaTextFieldStyle())
                                .autocapitalization(.none)
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
            .navigationTitle("Add Friend")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        addFriend()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Add")
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

    private func addFriend() {
        isLoading = true
        error = nil

        Task {
            do {
                let request = CreateFriendRequest(
                    name: name,
                    birthday: birthday.isEmpty ? nil : birthday,
                    howWeMet: howWeMet.isEmpty ? nil : howWeMet,
                    notes: notes.isEmpty ? nil : notes,
                    interests: nil,
                    profileImage: nil,
                    amikaCode: amikaCode.isEmpty ? nil : amikaCode
                )

                let friend = try await FriendsService.shared.createFriend(request)
                onAdd(friend)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct FormField<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(AmikaColors.textPrimary)

            content
        }
    }
}

struct DatePickerSheet: View {
    @Binding var selectedDate: Date
    let onSelect: (Date) -> Void

    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            DatePicker(
                "Select Date",
                selection: $selectedDate,
                displayedComponents: .date
            )
            .datePickerStyle(.graphical)
            .padding()
            .navigationTitle("Select Birthday")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        onSelect(selectedDate)
                    }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    AddFriendView { _ in }
}
