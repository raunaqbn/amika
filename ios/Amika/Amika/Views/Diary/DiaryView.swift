import SwiftUI

struct DiaryView: View {
    @StateObject private var viewModel = DiaryViewModel()
    @State private var showAddNote = false
    @State private var selectedNote: DiaryNote?

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                if viewModel.isLoading && viewModel.notes.isEmpty {
                    ProgressView()
                        .scaleEffect(1.5)
                } else if viewModel.notes.isEmpty {
                    EmptyDiaryView(showAddNote: $showAddNote)
                } else {
                    notesList
                }

                // Floating action button
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button {
                            showAddNote = true
                        } label: {
                            Image(systemName: "plus")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                                .frame(width: 56, height: 56)
                                .background(AmikaColors.sage)
                                .clipShape(Circle())
                                .shadow(color: AmikaColors.sage.opacity(0.4), radius: 8, x: 0, y: 4)
                        }
                        .padding(.trailing, 20)
                        .padding(.bottom, 20)
                    }
                }
            }
            .navigationTitle("Diary")
            .sheet(isPresented: $showAddNote) {
                AddDiaryNoteView { note in
                    viewModel.notes.insert(note, at: 0)
                }
            }
            .sheet(item: $selectedNote) { note in
                DiaryNoteDetailView(note: note, onUpdate: { updated in
                    if let index = viewModel.notes.firstIndex(where: { $0.id == updated.id }) {
                        viewModel.notes[index] = updated
                    }
                }, onDelete: {
                    viewModel.notes.removeAll { $0.id == note.id }
                })
            }
            .refreshable {
                await viewModel.loadNotes()
            }
            .task {
                await viewModel.loadNotes()
            }
        }
    }

    private var notesList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                ForEach(viewModel.notes) { note in
                    DiaryNoteCard(note: note)
                        .onTapGesture {
                            selectedNote = note
                        }
                }
            }
            .padding()
            .padding(.bottom, 80) // Space for FAB
        }
    }
}

struct DiaryNoteCard: View {
    let note: DiaryNote

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Date
            Text(note.displayDate)
                .font(.caption)
                .foregroundColor(AmikaColors.textMuted)

            // Content preview
            Text(note.preview)
                .font(.body)
                .foregroundColor(AmikaColors.textPrimary)
                .lineLimit(4)

            // AI analysis preview
            if let analysis = note.analysis, !analysis.isEmpty {
                HStack(spacing: 8) {
                    Image(systemName: "sparkles")
                        .font(.caption)
                        .foregroundColor(AmikaColors.sage)

                    Text("AI reflection available")
                        .font(.caption)
                        .foregroundColor(AmikaColors.sage)
                }
            }

            // Shared indicator
            if !note.sharedWithFriendIds.isEmpty {
                HStack(spacing: 4) {
                    Image(systemName: "person.2.fill")
                        .font(.caption2)
                    Text("Shared with \(note.sharedWithFriendIds.count) friend(s)")
                        .font(.caption)
                }
                .foregroundColor(AmikaColors.textMuted)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.03), radius: 2, x: 0, y: 1)
    }
}

struct EmptyDiaryView: View {
    @Binding var showAddNote: Bool

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "book.fill")
                .font(.system(size: 60))
                .foregroundColor(AmikaColors.sage.opacity(0.5))

            Text("Your diary is empty")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(AmikaColors.textPrimary)

            Text("Start journaling your thoughts and reflections")
                .font(.subheadline)
                .foregroundColor(AmikaColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            Button {
                showAddNote = true
            } label: {
                Label("Write Entry", systemImage: "pencil")
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
    DiaryView()
}
