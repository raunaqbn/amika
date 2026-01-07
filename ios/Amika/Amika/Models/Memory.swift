import Foundation

struct Memory: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    let friendId: String
    var content: String
    var imageUrl: String?
    var sharedWithFriend: Bool?
    let createdAt: String?
    let updatedAt: String?

    /// Parsed creation date
    var createdDate: Date? {
        guard let createdAt = createdAt else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let date = formatter.date(from: createdAt) {
            return date
        }
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.date(from: createdAt)
    }

    /// Formatted date for display
    var displayDate: String {
        guard let date = createdDate else { return "" }
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
}

struct CreateMemoryRequest: Codable {
    let friendId: String
    let content: String
    let imageUrl: String?
    let sharedWithFriend: Bool?
}

struct UpdateMemoryRequest: Codable {
    let id: String
    let content: String?
    let imageUrl: String?
    let sharedWithFriend: Bool?
}
