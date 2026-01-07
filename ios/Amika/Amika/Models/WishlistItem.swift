import Foundation

struct WishlistItem: Codable, Identifiable, Equatable {
    let id: String
    let userId: String
    var name: String
    var description: String?
    var link: String?
    var imageUrl: String?
    var price: String?
    var category: String?
    var priority: Int?
    var isPurchased: Bool?
    let createdAt: String?
    let updatedAt: String?

    /// Priority level
    var priorityLevel: PriorityLevel {
        switch priority {
        case 2: return .top
        case 1: return .high
        default: return .normal
        }
    }

    /// Formatted price for display
    var displayPrice: String? {
        guard let price = price, !price.isEmpty else { return nil }
        // If already has currency symbol, return as-is
        if price.hasPrefix("$") || price.hasPrefix("EUR") || price.hasPrefix("GBP") {
            return price
        }
        // Otherwise, assume USD
        return "$\(price)"
    }
}

enum PriorityLevel: Int, Codable, CaseIterable {
    case normal = 0
    case high = 1
    case top = 2

    var displayName: String {
        switch self {
        case .normal: return "Normal"
        case .high: return "High"
        case .top: return "Top Priority"
        }
    }

    var icon: String {
        switch self {
        case .normal: return "star"
        case .high: return "star.fill"
        case .top: return "star.circle.fill"
        }
    }
}

struct CreateWishlistRequest: Codable {
    let name: String
    let description: String?
    let link: String?
    let imageUrl: String?
    let price: String?
    let category: String?
    let priority: Int?
}

struct UpdateWishlistRequest: Codable {
    let id: String
    let name: String?
    let description: String?
    let link: String?
    let imageUrl: String?
    let price: String?
    let category: String?
    let priority: Int?
    let isPurchased: Bool?
}
