import Foundation

/// Service for managing friends
actor FriendsService {
    static let shared = FriendsService()
    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - CRUD Operations

    func fetchFriends() async throws -> [Friend] {
        try await apiClient.request(endpoint: "/api/friends")
    }

    func createFriend(_ request: CreateFriendRequest) async throws -> Friend {
        try await apiClient.request(endpoint: "/api/friends", method: .post, body: request)
    }

    func updateFriend(_ request: UpdateFriendRequest) async throws -> Friend {
        try await apiClient.request(endpoint: "/api/friends", method: .put, body: request)
    }

    func deleteFriend(id: String) async throws {
        try await apiClient.requestVoid(
            endpoint: "/api/friends",
            method: .delete,
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
    }

    // MARK: - Amika Friend Operations

    func fetchAmikaFriendProfile(friendId: String) async throws -> User {
        try await apiClient.request(endpoint: "/api/amika-friends/\(friendId)/profile")
    }

    func fetchAmikaFriendMemories(friendId: String) async throws -> [Memory] {
        try await apiClient.request(endpoint: "/api/amika-friends/\(friendId)/memories")
    }

    func fetchAmikaFriendEvents(friendId: String) async throws -> [AmikaEvent] {
        try await apiClient.request(endpoint: "/api/amika-friends/\(friendId)/events")
    }

    func fetchAmikaFriendWishlist(friendId: String) async throws -> [WishlistItem] {
        try await apiClient.request(endpoint: "/api/amika-friends/\(friendId)/wishlist")
    }

    func fetchAmikaFriendInterests(friendId: String) async throws -> [String] {
        struct InterestsResponse: Codable {
            let interests: [String]
        }
        let response: InterestsResponse = try await apiClient.request(endpoint: "/api/amika-friends/\(friendId)/interests")
        return response.interests
    }

    // MARK: - Connection Requests

    func sendConnectionRequest(amikaCode: String) async throws {
        struct ConnectionRequest: Codable {
            let amikaCode: String
        }
        try await apiClient.requestVoid(
            endpoint: "/api/connections",
            method: .post,
            body: ConnectionRequest(amikaCode: amikaCode)
        )
    }

    func fetchPendingConnections() async throws -> [ConnectionRequest] {
        try await apiClient.request(endpoint: "/api/connections")
    }

    func respondToConnection(connectionId: String, accept: Bool) async throws {
        struct ConnectionResponse: Codable {
            let id: String
            let accept: Bool
        }
        try await apiClient.requestVoid(
            endpoint: "/api/connections",
            method: .put,
            body: ConnectionResponse(id: connectionId, accept: accept)
        )
    }
}

struct ConnectionRequest: Codable, Identifiable {
    let id: String
    let fromUserId: String
    let toUserId: String
    let status: String
    let fromUser: User?
    let createdAt: String?
}
