import SwiftUI

struct AddWishlistItemView: View {
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var description = ""
    @State private var link = ""
    @State private var price = ""
    @State private var category = ""
    @State private var priority: PriorityLevel = .normal
    @State private var isLoading = false
    @State private var error: String?

    let onAdd: (WishlistItem) -> Void

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Name
                        FormField(title: "Item Name *") {
                            TextField("What do you want?", text: $name)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Link
                        FormField(title: "Link (optional)") {
                            TextField("https://...", text: $link)
                                .textFieldStyle(AmikaTextFieldStyle())
                                .keyboardType(.URL)
                                .autocapitalization(.none)
                                .autocorrectionDisabled()
                        }

                        // Price
                        FormField(title: "Price (optional)") {
                            TextField("$0.00", text: $price)
                                .textFieldStyle(AmikaTextFieldStyle())
                                .keyboardType(.decimalPad)
                        }

                        // Category
                        FormField(title: "Category (optional)") {
                            TextField("e.g., Electronics, Books, Clothing", text: $category)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Priority
                        FormField(title: "Priority") {
                            Picker("Priority", selection: $priority) {
                                ForEach(PriorityLevel.allCases, id: \.self) { level in
                                    Label(level.displayName, systemImage: level.icon)
                                        .tag(level)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        // Description
                        FormField(title: "Description (optional)") {
                            TextEditor(text: $description)
                                .frame(minHeight: 80)
                                .padding(8)
                                .background(Color.white)
                                .cornerRadius(12)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 12)
                                        .stroke(AmikaColors.border, lineWidth: 1)
                                )
                        }

                        if let error = error {
                            Text(error)
                                .font(.caption)
                                .foregroundColor(AmikaColors.error)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Add Item")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        addItem()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Add")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(name.isEmpty || isLoading)
                }
            }
        }
    }

    private func addItem() {
        isLoading = true
        error = nil

        Task {
            do {
                let request = CreateWishlistRequest(
                    name: name,
                    description: description.isEmpty ? nil : description,
                    link: link.isEmpty ? nil : link,
                    imageUrl: nil,
                    price: price.isEmpty ? nil : price,
                    category: category.isEmpty ? nil : category,
                    priority: priority.rawValue
                )

                let item = try await WishlistService.shared.createItem(request)
                onAdd(item)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    AddWishlistItemView { _ in }
}
