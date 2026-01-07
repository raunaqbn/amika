import Foundation

struct AmikaEvent: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var title: String
    var description: String?
    var date: String
    var location: String?
    var category: EventCategory?
    var isCompleted: Bool?
    var friendIds: String?
    var googleEventId: String?
    let createdAt: String?
    let updatedAt: String?

    /// Friends associated with this event
    var friendIdList: [String] {
        guard let friendIds = friendIds else { return [] }
        return friendIds.split(separator: ",").map { String($0) }
    }

    /// Parsed date
    var eventDate: Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: date) {
            return date
        }
        // Try without fractional seconds
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: date)
    }

    /// Whether the event is in the past
    var isPast: Bool {
        guard let eventDate = eventDate else { return false }
        return eventDate < Date()
    }

    /// Whether the event is today
    var isToday: Bool {
        guard let eventDate = eventDate else { return false }
        return Calendar.current.isDateInToday(eventDate)
    }

    /// Formatted date for display
    var displayDate: String {
        guard let eventDate = eventDate else { return date }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: eventDate)
    }
}

enum EventCategory: String, Codable, CaseIterable {
    case fitness
    case experiences
    case places
    case restaurants
    case virtual

    var displayName: String {
        rawValue.capitalized
    }

    var icon: String {
        switch self {
        case .fitness: return "figure.run"
        case .experiences: return "star.fill"
        case .places: return "mappin.circle.fill"
        case .restaurants: return "fork.knife"
        case .virtual: return "video.fill"
        }
    }
}

struct CreateEventRequest: Codable {
    let title: String
    let description: String?
    let date: String
    let location: String?
    let category: String?
    let friendIds: String?
    let sendGoogleInvite: Bool?
}

struct UpdateEventRequest: Codable {
    let id: String
    let title: String?
    let description: String?
    let date: String?
    let location: String?
    let category: String?
    let isCompleted: Bool?
    let friendIds: String?
}
