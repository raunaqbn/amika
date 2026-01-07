import Foundation

/// Service for managing wishlist items
actor WishlistService {
    static let shared = WishlistService()
    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - CRUD Operations

    func fetchItems() async throws -> [WishlistItem] {
        try await apiClient.request(endpoint: "/api/wishlist")
    }

    func createItem(_ request: CreateWishlistRequest) async throws -> WishlistItem {
        try await apiClient.request(endpoint: "/api/wishlist", method: .post, body: request)
    }

    func updateItem(_ request: UpdateWishlistRequest) async throws -> WishlistItem {
        try await apiClient.request(endpoint: "/api/wishlist", method: .put, body: request)
    }

    func deleteItem(id: String) async throws {
        try await apiClient.requestVoid(
            endpoint: "/api/wishlist",
            method: .delete,
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
    }

    // MARK: - Convenience Methods

    func markItemPurchased(id: String, isPurchased: Bool) async throws -> WishlistItem {
        let request = UpdateWishlistRequest(
            id: id,
            name: nil,
            description: nil,
            link: nil,
            imageUrl: nil,
            price: nil,
            category: nil,
            priority: nil,
            isPurchased: isPurchased
        )
        return try await updateItem(request)
    }

    func updatePriority(id: String, priority: PriorityLevel) async throws -> WishlistItem {
        let request = UpdateWishlistRequest(
            id: id,
            name: nil,
            description: nil,
            link: nil,
            imageUrl: nil,
            price: nil,
            category: nil,
            priority: priority.rawValue,
            isPurchased: nil
        )
        return try await updateItem(request)
    }

    // MARK: - Public Wishlist

    func fetchPublicWishlist(userId: String) async throws -> [WishlistItem] {
        try await apiClient.request(
            endpoint: "/api/wishlist/public",
            queryItems: [URLQueryItem(name: "userId", value: userId)]
        )
    }
}
