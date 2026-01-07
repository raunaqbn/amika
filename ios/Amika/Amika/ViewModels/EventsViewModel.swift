import Foundation

@MainActor
class EventsViewModel: ObservableObject {
    @Published var events: [AmikaEvent] = []
    @Published var isLoading = false
    @Published var error: String?

    private let service = EventsService.shared

    func loadEvents() async {
        isLoading = true
        error = nil

        do {
            events = try await service.fetchEvents()
            sortEvents()
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func sortEvents() {
        let now = Date()
        events.sort { event1, event2 in
            let date1 = event1.eventDate ?? now
            let date2 = event2.eventDate ?? now

            // Upcoming events first, sorted by date ascending
            // Past events last, sorted by date descending
            if date1 >= now && date2 >= now {
                return date1 < date2
            } else if date1 < now && date2 < now {
                return date1 > date2
            } else {
                return date1 >= now
            }
        }
    }

    func deleteEvent(_ event: AmikaEvent) async {
        do {
            try await service.deleteEvent(id: event.id)
            events.removeAll { $0.id == event.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func toggleComplete(_ event: AmikaEvent) async {
        do {
            let updated = try await service.markEventComplete(
                id: event.id,
                isCompleted: !(event.isCompleted ?? false)
            )
            if let index = events.firstIndex(where: { $0.id == updated.id }) {
                events[index] = updated
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
