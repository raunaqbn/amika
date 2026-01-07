import Foundation

struct User: Codable, Identifiable, Equatable {
    let id: String
    let email: String
    var name: String?
    var birthday: String?
    var interests: String?
    var profileImage: String?
    var amikaCode: String?
    let createdAt: String?
    let updatedAt: String?

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
}

struct AuthSession: Codable {
    let userId: String
    let user: User
    let stats: UserStats?
}

struct UserStats: Codable {
    let friendCount: Int
    let eventCount: Int
    let memoryCount: Int
    let diaryCount: Int
}

struct SignInRequest: Codable {
    let email: String
    let password: String
}

struct SignUpRequest: Codable {
    let email: String
    let password: String
    let name: String?
}

struct AuthResponse: Codable {
    let userId: String?
    let error: String?
}

struct ProfileUpdateRequest: Codable {
    let name: String?
    let birthday: String?
    let interests: String?
    let profileImage: String?
}
