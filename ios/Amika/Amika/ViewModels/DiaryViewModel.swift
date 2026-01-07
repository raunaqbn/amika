import Foundation

@MainActor
class DiaryViewModel: ObservableObject {
    @Published var notes: [DiaryNote] = []
    @Published var isLoading = false
    @Published var error: String?

    private let service = DiaryService.shared

    func loadNotes() async {
        isLoading = true
        error = nil

        do {
            notes = try await service.fetchNotes()
            // Sort by creation date, newest first
            notes.sort { note1, note2 in
                let date1 = note1.createdDate ?? Date.distantPast
                let date2 = note2.createdDate ?? Date.distantPast
                return date1 > date2
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteNote(_ note: DiaryNote) async {
        do {
            try await service.deleteNote(id: note.id)
            notes.removeAll { $0.id == note.id }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
