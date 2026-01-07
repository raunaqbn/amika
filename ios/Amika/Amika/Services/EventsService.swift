import Foundation

/// Service for managing events
actor EventsService {
    static let shared = EventsService()
    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - CRUD Operations

    func fetchEvents(friendId: String? = nil) async throws -> [AmikaEvent] {
        var queryItems: [URLQueryItem]? = nil
        if let friendId = friendId {
            queryItems = [URLQueryItem(name: "friendId", value: friendId)]
        }
        return try await apiClient.request(endpoint: "/api/events", queryItems: queryItems)
    }

    func createEvent(_ request: CreateEventRequest) async throws -> AmikaEvent {
        try await apiClient.request(endpoint: "/api/events", method: .post, body: request)
    }

    func updateEvent(_ request: UpdateEventRequest) async throws -> AmikaEvent {
        try await apiClient.request(endpoint: "/api/events", method: .put, body: request)
    }

    func deleteEvent(id: String) async throws {
        try await apiClient.requestVoid(
            endpoint: "/api/events",
            method: .delete,
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
    }

    func markEventComplete(id: String, isCompleted: Bool) async throws -> AmikaEvent {
        let request = UpdateEventRequest(
            id: id,
            title: nil,
            description: nil,
            date: nil,
            location: nil,
            category: nil,
            isCompleted: isCompleted,
            friendIds: nil
        )
        return try await updateEvent(request)
    }

    // MARK: - Upcoming Events

    func fetchUpcomingEvents(limit: Int = 5) async throws -> [AmikaEvent] {
        let events = try await fetchEvents()
        let now = Date()

        return events
            .filter { event in
                guard let eventDate = event.eventDate else { return false }
                return eventDate >= now && event.isCompleted != true
            }
            .sorted { ($0.eventDate ?? now) < ($1.eventDate ?? now) }
            .prefix(limit)
            .map { $0 }
    }

    // MARK: - Events by Category

    func fetchEventsByCategory(_ category: EventCategory) async throws -> [AmikaEvent] {
        let events = try await fetchEvents()
        return events.filter { $0.category == category }
    }
}
