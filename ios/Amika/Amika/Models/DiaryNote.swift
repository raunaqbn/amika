import Foundation

struct DiaryNote: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var content: String
    var analysis: String?
    var friendTags: String?
    var sharedWithFriends: String?
    let createdAt: String?
    let updatedAt: String?

    /// Friend IDs that are tagged in this note
    var taggedFriendIds: [String] {
        guard let friendTags = friendTags else { return [] }
        return friendTags.split(separator: ",").map { String($0) }
    }

    /// Friend IDs that this note is shared with
    var sharedWithFriendIds: [String] {
        guard let sharedWithFriends = sharedWithFriends else { return [] }
        return sharedWithFriends.split(separator: ",").map { String($0) }
    }

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
        formatter.dateStyle = .long
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    /// Short preview of content
    var preview: String {
        let maxLength = 150
        if content.count <= maxLength {
            return content
        }
        return String(content.prefix(maxLength)) + "..."
    }
}

struct CreateDiaryRequest: Codable {
    let content: String
    let friendTags: String?
    let sharedWithFriends: String?
}

struct UpdateDiaryRequest: Codable {
    let id: String
    let content: String?
    let friendTags: String?
    let sharedWithFriends: String?
}
