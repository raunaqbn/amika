import Foundation

@MainActor
class WishlistViewModel: ObservableObject {
    @Published var items: [WishlistItem] = []
    @Published var isLoading = false
    @Published var error: String?

    private let service = WishlistService.shared

    func loadItems() async {
        isLoading = true
        error = nil

        do {
            items = try await service.fetchItems()
            // Sort by priority (high first), then by creation date
            items.sort { item1, item2 in
                if item1.priorityLevel.rawValue != item2.priorityLevel.rawValue {
                    return item1.priorityLevel.rawValue > item2.priorityLevel.rawValue
                }
                return (item1.createdAt ?? "") > (item2.createdAt ?? "")
            }
        } catch {
            self.error = error.localizedDescription
        }

        isLoading = false
    }

    func deleteItem(_ item: WishlistItem) async {
        do {
            try await service.deleteItem(id: item.id)
            items.removeAll { $0.id == item.id }
        } catch {
            self.error = error.localizedDescription
        }
    }

    func togglePurchased(_ item: WishlistItem) async {
        do {
            let updated = try await service.markItemPurchased(
                id: item.id,
                isPurchased: !(item.isPurchased ?? false)
            )
            if let index = items.firstIndex(where: { $0.id == updated.id }) {
                items[index] = updated
            }
        } catch {
            self.error = error.localizedDescription
        }
    }
}
