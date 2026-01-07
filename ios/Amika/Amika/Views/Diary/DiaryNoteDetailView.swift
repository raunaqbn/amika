import SwiftUI

struct DiaryNoteDetailView: View {
    let note: DiaryNote
    let onUpdate: (DiaryNote) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 20) {
                        // Date header
                        Text(note.displayDate)
                            .font(.subheadline)
                            .foregroundColor(AmikaColors.textMuted)
                            .frame(maxWidth: .infinity, alignment: .center)

                        // Content
                        Text(note.content)
                            .font(.body)
                            .foregroundColor(AmikaColors.textPrimary)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)

                        // AI Analysis
                        if let analysis = note.analysis, !analysis.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .foregroundColor(AmikaColors.sage)
                                    Text("AI Reflection")
                                        .font(.headline)
                                        .foregroundColor(AmikaColors.textPrimary)
                                }

                                Text(analysis)
                                    .font(.body)
                                    .foregroundColor(AmikaColors.textSecondary)
                            }
                            .padding()
                            .background(AmikaColors.sageLighter)
                            .cornerRadius(12)
                        }

                        // Tagged friends
                        if !note.taggedFriendIds.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Tagged Friends")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(AmikaColors.textSecondary)

                                Text("\(note.taggedFriendIds.count) friend(s)")
                                    .font(.body)
                                    .foregroundColor(AmikaColors.textPrimary)
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)
                        }

                        // Shared with
                        if !note.sharedWithFriendIds.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Shared With")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(AmikaColors.textSecondary)

                                Text("\(note.sharedWithFriendIds.count) friend(s)")
                                    .font(.body)
                                    .foregroundColor(AmikaColors.textPrimary)
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)
                        }
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
                    Button(role: .destructive) {
                        showDeleteAlert = true
                    } label: {
                        Image(systemName: "trash")
                            .foregroundColor(AmikaColors.error)
                    }
                }
            }
            .alert("Delete Entry", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteNote()
                }
            } message: {
                Text("Are you sure you want to delete this diary entry?")
            }
        }
    }

    private func deleteNote() {
        Task {
            do {
                try await DiaryService.shared.deleteNote(id: note.id)
                onDelete()
                dismiss()
            } catch {
                print("Error deleting note: \(error)")
            }
        }
    }
}

#Preview {
    DiaryNoteDetailView(
        note: DiaryNote(
            id: "1",
            userId: "1",
            content: "Today was a great day! I had coffee with John and we talked about our plans for the summer. It felt really good to connect after not seeing each other for a while.",
            analysis: "This entry shows positive social connection and the importance of maintaining friendships. You're showing appreciation for meaningful conversations and shared experiences.",
            friendTags: "1",
            sharedWithFriends: nil,
            createdAt: ISO8601DateFormatter().string(from: Date()),
            updatedAt: nil
        ),
        onUpdate: { _ in },
        onDelete: {}
    )
}
