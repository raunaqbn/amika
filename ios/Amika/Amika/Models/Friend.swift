import Foundation

struct Friend: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var name: String
    var birthday: String?
    var howWeMet: String?
    var notes: String?
    var interests: String?
    var profileImage: String?
    var friendshipPoints: Int?
    var lastContact: String?
    var linkedUserId: String?
    var amikaCode: String?
    let createdAt: String?
    let updatedAt: String?

    /// Whether this friend is an Amika user (connected)
    var isAmikaFriend: Bool {
        linkedUserId != nil
    }

    /// Parsed interests as an array
    var interestsList: [String] {
        guard let interests = interests else { return [] }
        return interests.split(separator: ",").map { String($0).trimmingCharacters(in: .whitespaces) }
    }

    /// Parsed birthday as Date
    var birthdayDate: Date? {
        guard let birthday = birthday else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: birthday)
    }

    /// Days until birthday (nil if no birthday set)
    var daysUntilBirthday: Int? {
        guard let birthdayDate = birthdayDate else { return nil }
        let calendar = Calendar.current
        let today = Date()

        var nextBirthday = calendar.dateComponents([.month, .day], from: birthdayDate)
        nextBirthday.year = calendar.component(.year, from: today)

        guard var next = calendar.date(from: nextBirthday) else { return nil }

        if next < today {
            nextBirthday.year = calendar.component(.year, from: today) + 1
            next = calendar.date(from: nextBirthday) ?? next
        }

        return calendar.dateComponents([.day], from: today, to: next).day
    }

    /// Initials for avatar
    var initials: String {
        let words = name.split(separator: " ")
        if words.count >= 2 {
            return String(words[0].prefix(1) + words[1].prefix(1)).uppercased()
        }
        return String(name.prefix(2)).uppercased()
    }
}

struct CreateFriendRequest: Codable {
    let name: String
    let birthday: String?
    let howWeMet: String?
    let notes: String?
    let interests: String?
    let profileImage: String?
    let amikaCode: String?
}

struct UpdateFriendRequest: Codable {
    let id: String
    let name: String?
    let birthday: String?
    let howWeMet: String?
    let notes: String?
    let interests: String?
    let profileImage: String?
    let lastContact: String?
}
