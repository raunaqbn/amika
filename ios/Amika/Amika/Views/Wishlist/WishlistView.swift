import SwiftUI

struct WishlistView: View {
    @StateObject private var viewModel = WishlistViewModel()
    @State private var showAddItem = false
    @State private var selectedItem: WishlistItem?

    var body: some View {
        ZStack {
            AmikaColors.background
                .ignoresSafeArea()

            if viewModel.isLoading && viewModel.items.isEmpty {
                ProgressView()
                    .scaleEffect(1.5)
            } else if viewModel.items.isEmpty {
                EmptyWishlistView(showAddItem: $showAddItem)
            } else {
                itemsList
            }
        }
        .navigationTitle("Wishlist")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    showAddItem = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundColor(AmikaColors.sage)
                }
            }
        }
        .sheet(isPresented: $showAddItem) {
            AddWishlistItemView { item in
                viewModel.items.insert(item, at: 0)
            }
        }
        .sheet(item: $selectedItem) { item in
            WishlistItemDetailView(item: item, onUpdate: { updated in
                if let index = viewModel.items.firstIndex(where: { $0.id == updated.id }) {
                    viewModel.items[index] = updated
                }
            }, onDelete: {
                viewModel.items.removeAll { $0.id == item.id }
            })
        }
        .refreshable {
            await viewModel.loadItems()
        }
        .task {
            await viewModel.loadItems()
        }
    }

    private var itemsList: some View {
        ScrollView {
            LazyVStack(spacing: 12) {
                // Top priority section
                if !topPriorityItems.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Label("Top Priority", systemImage: "star.circle.fill")
                            .font(.headline)
                            .foregroundColor(AmikaColors.rose)

                        ForEach(topPriorityItems) { item in
                            WishlistItemRow(item: item)
                                .onTapGesture {
                                    selectedItem = item
                                }
                        }
                    }
                }

                // Other items
                if !regularItems.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        if !topPriorityItems.isEmpty {
                            Text("Other Items")
                                .font(.headline)
                                .foregroundColor(AmikaColors.textPrimary)
                        }

                        ForEach(regularItems) { item in
                            WishlistItemRow(item: item)
                                .onTapGesture {
                                    selectedItem = item
                                }
                        }
                    }
                }
            }
            .padding()
        }
    }

    private var topPriorityItems: [WishlistItem] {
        viewModel.items.filter { $0.priorityLevel == .top && $0.isPurchased != true }
    }

    private var regularItems: [WishlistItem] {
        viewModel.items.filter { $0.priorityLevel != .top || $0.isPurchased == true }
    }
}

struct WishlistItemRow: View {
    let item: WishlistItem

    var body: some View {
        HStack(spacing: 16) {
            // Image or icon
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(AmikaColors.sageLighter)
                    .frame(width: 60, height: 60)

                if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                    AsyncImage(url: url) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Image(systemName: "gift.fill")
                            .font(.title2)
                            .foregroundColor(AmikaColors.sage)
                    }
                    .frame(width: 60, height: 60)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                } else {
                    Image(systemName: "gift.fill")
                        .font(.title2)
                        .foregroundColor(AmikaColors.sage)
                }
            }

            // Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(item.name)
                        .font(.headline)
                        .foregroundColor(AmikaColors.textPrimary)
                        .strikethrough(item.isPurchased == true)

                    if item.priorityLevel == .top {
                        Image(systemName: "star.fill")
                            .font(.caption)
                            .foregroundColor(AmikaColors.rose)
                    }
                }

                if let price = item.displayPrice {
                    Text(price)
                        .font(.subheadline)
                        .foregroundColor(AmikaColors.sage)
                }

                if let category = item.category, !category.isEmpty {
                    Text(category)
                        .font(.caption)
                        .foregroundColor(AmikaColors.textMuted)
                }
            }

            Spacer()

            if item.isPurchased == true {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(AmikaColors.success)
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(AmikaColors.textMuted)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .opacity(item.isPurchased == true ? 0.7 : 1)
    }
}

struct EmptyWishlistView: View {
    @Binding var showAddItem: Bool

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "gift.fill")
                .font(.system(size: 60))
                .foregroundColor(AmikaColors.sage.opacity(0.5))

            Text("Your wishlist is empty")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(AmikaColors.textPrimary)

            Text("Add items you'd love to receive")
                .font(.subheadline)
                .foregroundColor(AmikaColors.textSecondary)

            Button {
                showAddItem = true
            } label: {
                Label("Add Item", systemImage: "plus")
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(AmikaColors.sage)
                    .cornerRadius(12)
            }
        }
    }
}

#Preview {
    NavigationStack {
        WishlistView()
    }
}
