import SwiftUI

struct EditProfileView: View {
    @EnvironmentObject var authManager: AuthManager
    @Environment(\.dismiss) private var dismiss

    @State private var name: String = ""
    @State private var birthday: String = ""
    @State private var interests: String = ""
    @State private var showDatePicker = false
    @State private var selectedDate = Date()
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Avatar
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(AmikaColors.sageLighter)
                                    .frame(width: 100, height: 100)

                                Text(initials)
                                    .font(.largeTitle)
                                    .foregroundColor(AmikaColors.sage)
                            }

                            Button {
                                // Photo picker would go here
                            } label: {
                                Text("Change Photo")
                                    .font(.subheadline)
                                    .foregroundColor(AmikaColors.sage)
                            }
                        }
                        .padding()

                        // Name
                        FormField(title: "Name") {
                            TextField("Your name", text: $name)
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

                        // Interests
                        FormField(title: "Interests (comma-separated)") {
                            TextField("hiking, photography, cooking...", text: $interests)
                                .textFieldStyle(AmikaTextFieldStyle())
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
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        saveProfile()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(isLoading)
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
            .onAppear {
                loadCurrentProfile()
            }
        }
    }

    private var initials: String {
        let words = name.split(separator: " ")
        if words.count >= 2 {
            return String(words[0].prefix(1) + words[1].prefix(1)).uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }

    private func loadCurrentProfile() {
        if let user = authManager.currentUser {
            name = user.name ?? ""
            birthday = user.birthday ?? ""
            interests = user.interests ?? ""

            if let birthdayDate = user.birthdayDate {
                selectedDate = birthdayDate
            }
        }
    }

    private func saveProfile() {
        isLoading = true
        error = nil

        Task {
            do {
                try await authManager.updateProfile(
                    name: name.isEmpty ? nil : name,
                    birthday: birthday.isEmpty ? nil : birthday,
                    interests: interests.isEmpty ? nil : interests,
                    profileImage: authManager.currentUser?.profileImage
                )
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    EditProfileView()
        .environmentObject(AuthManager())
}
