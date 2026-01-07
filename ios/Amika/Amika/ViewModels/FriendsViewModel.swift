import Foundation

@MainActor
class FriendsViewModel: ObservableObject {
    @Published var friends: [Friend] = []
    @Published var isLoading = false
    @Published var error: String?

    private let service = FriendsService.shared

    func loadFriends() async {
        isLoading = true
        error = nil

        do {
            friends = try await service.fetchFriends()
            // Sort by name
            friends.sort { $0.name.lowercased() < $1.name.lowercased() }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteFriend(_ friend: Friend) async {
        do {
            try await service.deleteFriend(id: friend.id)
            friends.removeAll { $0.id == friend.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func updateFriend(_ request: UpdateFriendRequest) async throws -> Friend {
        let updated = try await service.updateFriend(request)
        if let index = friends.firstIndex(where: { $0.id == updated.id }) {
            friends[index] = updated
        }
        return updated
    }
}
