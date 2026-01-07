import SwiftUI

struct EditEventView: View {
    let event: AmikaEvent
    let onUpdate: (AmikaEvent) -> Void

    @Environment(\.dismiss) private var dismiss

    @State private var title: String
    @State private var description: String
    @State private var date: Date
    @State private var location: String
    @State private var category: EventCategory
    @State private var isLoading = false
    @State private var error: String?

    init(event: AmikaEvent, onUpdate: @escaping (AmikaEvent) -> Void) {
        self.event = event
        self.onUpdate = onUpdate
        _title = State(initialValue: event.title)
        _description = State(initialValue: event.description ?? "")
        _date = State(initialValue: event.eventDate ?? Date())
        _location = State(initialValue: event.location ?? "")
        _category = State(initialValue: event.category ?? .experiences)
    }

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Title
                        FormField(title: "Title *") {
                            TextField("Event title", text: $title)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Date & Time
                        FormField(title: "Date & Time") {
                            DatePicker(
                                "",
                                selection: $date,
                                displayedComponents: [.date, .hourAndMinute]
                            )
                            .datePickerStyle(.compact)
                            .labelsHidden()
                        }

                        // Category
                        FormField(title: "Category") {
                            Picker("Category", selection: $category) {
                                ForEach(EventCategory.allCases, id: \.self) { cat in
                                    Label(cat.displayName, systemImage: cat.icon)
                                        .tag(cat)
                                }
                            }
                            .pickerStyle(.segmented)
                        }

                        // Location
                        FormField(title: "Location") {
                            TextField("Add location", text: $location)
                                .textFieldStyle(AmikaTextFieldStyle())
                        }

                        // Description
                        FormField(title: "Description") {
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
            .navigationTitle("Edit Event")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        updateEvent()
                    } label: {
                        if isLoading {
                            ProgressView()
                        } else {
                            Text("Save")
                                .fontWeight(.semibold)
                        }
                    }
                    .disabled(title.isEmpty || isLoading)
                }
            }
        }
    }

    private func updateEvent() {
        isLoading = true
        error = nil

        Task {
            do {
                let formatter = ISO8601DateFormatter()
                formatter.formatOptions = [.withInternetDateTime]

                let request = UpdateEventRequest(
                    id: event.id,
                    title: title,
                    description: description.isEmpty ? nil : description,
                    date: formatter.string(from: date),
                    location: location.isEmpty ? nil : location,
                    category: category.rawValue,
                    isCompleted: event.isCompleted,
                    friendIds: event.friendIds
                )

                let updated = try await EventsService.shared.updateEvent(request)
                onUpdate(updated)
                dismiss()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    EditEventView(
        event: AmikaEvent(
            id: "1",
            userId: "1",
            title: "Coffee with John",
            description: "Catch up",
            date: ISO8601DateFormatter().string(from: Date()),
            location: "Cafe",
            category: .restaurants,
            isCompleted: false,
            friendIds: nil,
            googleEventId: nil,
            createdAt: nil,
            updatedAt: nil
        ),
        onUpdate: { _ in }
    )
}
