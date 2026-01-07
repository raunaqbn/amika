import SwiftUI

struct AddDiaryNoteView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var content = ""
    @State private var selectedFriendIds: Set<String> = []
    @State private var showGuidedJournal = false
    @State private var guidedPrompt: String?
    @State private var isLoading = false
    @State private var error: String?

    @State private var friends: [Friend] = []

    let onAdd: (DiaryNote) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Guided journal prompt
                        if let prompt = guidedPrompt {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "lightbulb.fill")
                                        .foregroundColor(AmikaColors.sage)
                                    Text("Journal Prompt")
                                        .font(.subheadline)
                                        .fontWeight(.medium)
                                }

                                Text(prompt)
                                    .font(.body)
                                    .foregroundColor(AmikaColors.textPrimary)
                                    .italic()
                            }
                            .padding()
                            .background(AmikaColors.sageLighter)
                            .cornerRadius(12)
                        }

                        // Guided journal button
                        if guidedPrompt == nil {
                            Menu {
                                Button {
                                    getGuidedPrompt(category: "gratitude")
                                } label: {
                                    Label("Gratitude", systemImage: "heart.fill")
                                }

                                Button {
                                    getGuidedPrompt(category: "reflection")
                                } label: {
                                    Label("Reflection", systemImage: "brain.head.profile")
                                }

                                Button {
                                    getGuidedPrompt(category: "growth")
                                } label: {
                                    Label("Growth", systemImage: "leaf.fill")
                                }

                                Button {
                                    getGuidedPrompt(category: "relationships")
                                } label: {
                                    Label("Relationships", systemImage: "person.2.fill")
                                }
                            } label: {
                                HStack {
                                    Image(systemName: "sparkles")
                                    Text("Get a journaling prompt")
                                }
                                .font(.subheadline)
                                .foregroundColor(AmikaColors.sage)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(AmikaColors.sageLighter)
                                .cornerRadius(12)
                            }
                        }

                        // Content
                        FormField(title: "What's on your mind?") {
                            TextEditor(text: $content)
                                .frame(minHeight: 200)
                                .padding(12)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AmikaColors.border, lineWidth: 1)
                                )
                        }

                        // Tag friends
                        if !friends.isEmpty {
                            FormField(title: "Tag friends (optional)") {
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

                        // Writing assistant
                        if !content.isEmpty {
                            WritingAssistantSection(content: content) { suggestion in
                                content += "\n\n\(suggestion)"
                            }
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
            .navigationTitle("New Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        saveNote()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(content.isEmpty || isLoading)
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

    private func getGuidedPrompt(category: String) {
        Task {
            do {
                let response = try await DiaryService.shared.getGuidedJournalPrompt(category: category)
                guidedPrompt = response.prompt
            } catch {
                self.error = error.localizedDescription
            }
        }
    }

    private func saveNote() {
        isLoading = true
        error = nil

        Task {
            do {
                let request = CreateDiaryRequest(
                    content: content,
                    friendTags: selectedFriendIds.isEmpty ? nil : selectedFriendIds.joined(separator: ","),
                    sharedWithFriends: nil
                )

                let note = try await DiaryService.shared.createNote(request)
                onAdd(note)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

struct WritingAssistantSection: View {
    let content: String
    let onSuggestion: (String) -> Void

    @State private var isLoading = false
    @State private var suggestion: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "wand.and.stars")
                    .foregroundColor(AmikaColors.sage)
                Text("Writing Assistant")
                    .font(.subheadline)
                    .fontWeight(.medium)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(WritingCue.allCases, id: \.self) { cue in
                        Button {
                            getAssistance(cue: cue)
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: cue.icon)
                                    .font(.caption)
                                Text(cue.displayName)
                                    .font(.caption)
                            }
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.white)
                            .cornerRadius(16)
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(AmikaColors.border, lineWidth: 1)
                            )
                        }
                        .foregroundColor(AmikaColors.textPrimary)
                    }
                }
            }

            if isLoading {
                HStack {
                    ProgressView()
                    Text("Thinking...")
                        .font(.caption)
                        .foregroundColor(AmikaColors.textMuted)
                }
            }

            if let suggestion = suggestion {
                VStack(alignment: .leading, spacing: 8) {
                    Text(suggestion)
                        .font(.body)
                        .foregroundColor(AmikaColors.textSecondary)
                        .padding()
                        .background(AmikaColors.sageLighter.opacity(0.5))
                        .cornerRadius(8)

                    Button {
                        onSuggestion(suggestion)
                        self.suggestion = nil
                    } label: {
                        Label("Add to entry", systemImage: "plus.circle")
                            .font(.caption)
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
    }

    private func getAssistance(cue: WritingCue) {
        isLoading = true
        suggestion = nil

        Task {
            do {
                let response = try await DiaryService.shared.getWritingAssistance(content: content, cue: cue)
                suggestion = response.suggestion
            } catch {
                print("Error getting writing assistance: \(error)")
            }
            isLoading = false
        }
    }
}

#Preview {
    AddDiaryNoteView { _ in }
}
