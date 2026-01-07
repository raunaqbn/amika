import Foundation

/// Service for managing memories
actor MemoriesService {
    static let shared = MemoriesService()
    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - CRUD Operations

    func fetchMemories(friendId: String? = nil) async throws -> [Memory] {
        var queryItems: [URLQueryItem]? = nil
        if let friendId = friendId {
            queryItems = [URLQueryItem(name: "friendId", value: friendId)]
        }
        return try await apiClient.request(endpoint: "/api/memories", queryItems: queryItems)
    }

    func createMemory(_ request: CreateMemoryRequest) async throws -> Memory {
        try await apiClient.request(endpoint: "/api/memories", method: .post, body: request)
    }

    func updateMemory(_ request: UpdateMemoryRequest) async throws -> Memory {
        try await apiClient.request(endpoint: "/api/memories", method: .put, body: request)
    }

    func deleteMemory(id: String) async throws {
        try await apiClient.requestVoid(
            endpoint: "/api/memories",
            method: .delete,
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
    }

    // MARK: - Sharing

    func shareMemoryWithFriend(memoryId: String) async throws -> Memory {
        let request = UpdateMemoryRequest(id: memoryId, content: nil, imageUrl: nil, sharedWithFriend: true)
        return try await updateMemory(request)
    }

    func unshareMemoryWithFriend(memoryId: String) async throws -> Memory {
        let request = UpdateMemoryRequest(id: memoryId, content: nil, imageUrl: nil, sharedWithFriend: false)
        return try await updateMemory(request)
    }
}
