import SwiftUI

struct WishlistItemDetailView: View {
    let item: WishlistItem
    let onUpdate: (WishlistItem) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showDeleteAlert = false
    @State private var isTogglingPurchased = false

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Image
                        ZStack {
                            RoundedRectangle(cornerRadius: 16)
                                .fill(AmikaColors.sageLighter)
                                .frame(height: 200)

                            if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                                AsyncImage(url: url) { image in
                                    image
                                        .resizable()
                                        .scaledToFit()
                                } placeholder: {
                                    Image(systemName: "gift.fill")
                                        .font(.system(size: 60))
                                        .foregroundColor(AmikaColors.sage)
                                }
                                .frame(height: 200)
                                .clipShape(RoundedRectangle(cornerRadius: 16))
                            } else {
                                Image(systemName: "gift.fill")
                                    .font(.system(size: 60))
                                    .foregroundColor(AmikaColors.sage)
                            }
                        }

                        // Title and price
                        VStack(spacing: 8) {
                            HStack {
                                Text(item.name)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundColor(AmikaColors.textPrimary)

                                if item.priorityLevel == .top {
                                    Image(systemName: "star.fill")
                                        .foregroundColor(AmikaColors.rose)
                                }
                            }

                            if let price = item.displayPrice {
                                Text(price)
                                    .font(.title3)
                                    .foregroundColor(AmikaColors.sage)
                            }

                            if let category = item.category, !category.isEmpty {
                                Text(category)
                                    .font(.subheadline)
                                    .foregroundColor(AmikaColors.textMuted)
                            }
                        }

                        // Status
                        if item.isPurchased == true {
                            Label("Purchased", systemImage: "checkmark.circle.fill")
                                .font(.headline)
                                .foregroundColor(AmikaColors.success)
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(AmikaColors.success.opacity(0.1))
                                .cornerRadius(12)
                        }

                        // Description
                        if let description = item.description, !description.isEmpty {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Description")
                                    .font(.headline)
                                    .foregroundColor(AmikaColors.textPrimary)

                                Text(description)
                                    .font(.body)
                                    .foregroundColor(AmikaColors.textSecondary)
                            }
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .cornerRadius(12)
                        }

                        // Link
                        if let link = item.link, let url = URL(string: link) {
                            Link(destination: url) {
                                HStack {
                                    Image(systemName: "link")
                                    Text("View Item")
                                    Spacer()
                                    Image(systemName: "arrow.up.right")
                                }
                                .font(.headline)
                                .foregroundColor(AmikaColors.sage)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                        }

                        // Actions
                        VStack(spacing: 12) {
                            Button {
                                togglePurchased()
                            } label: {
                                HStack {
                                    if isTogglingPurchased {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Image(systemName: item.isPurchased == true ? "arrow.uturn.backward" : "checkmark")
                                        Text(item.isPurchased == true ? "Mark as Not Purchased" : "Mark as Purchased")
                                    }
                                }
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(item.isPurchased == true ? AmikaColors.textMuted : AmikaColors.sage)
                                .cornerRadius(12)
                            }
                            .disabled(isTogglingPurchased)

                            Button(role: .destructive) {
                                showDeleteAlert = true
                            } label: {
                                HStack {
                                    Image(systemName: "trash")
                                    Text("Delete Item")
                                }
                                .font(.headline)
                                .foregroundColor(AmikaColors.error)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white)
                                .cornerRadius(12)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("Delete Item", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteItem()
                }
            } message: {
                Text("Are you sure you want to delete this item?")
            }
        }
    }

    private func togglePurchased() {
        isTogglingPurchased = true

        Task {
            do {
                let updated = try await WishlistService.shared.markItemPurchased(
                    id: item.id,
                    isPurchased: !(item.isPurchased ?? false)
                )
                onUpdate(updated)
            } catch {
                print("Error toggling purchased: \(error)")
            }
            isTogglingPurchased = false
        }
    }

    private func deleteItem() {
        Task {
            do {
                try await WishlistService.shared.deleteItem(id: item.id)
                onDelete()
                dismiss()
            } catch {
                print("Error deleting item: \(error)")
            }
        }
    }
}

#Preview {
    WishlistItemDetailView(
        item: WishlistItem(
            id: "1",
            userId: "1",
            name: "AirPods Pro",
            description: "Great for listening to music and podcasts",
            link: "https://apple.com/airpods-pro",
            imageUrl: nil,
            price: "249.00",
            category: "Electronics",
            priority: 2,
            isPurchased: false,
            createdAt: nil,
            updatedAt: nil
        ),
        onUpdate: { _ in },
        onDelete: {}
    )
}
