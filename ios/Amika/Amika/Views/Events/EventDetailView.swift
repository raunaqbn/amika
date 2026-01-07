import SwiftUI

struct EventDetailView: View {
    let event: AmikaEvent
    let onUpdate: (AmikaEvent) -> Void
    let onDelete: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var showEditSheet = false
    @State private var showDeleteAlert = false
    @State private var isCompleting = false

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 20) {
                        // Header
                        VStack(spacing: 16) {
                            // Category icon
                            ZStack {
                                Circle()
                                    .fill(AmikaColors.sageLighter)
                                    .frame(width: 80, height: 80)

                                Image(systemName: event.category?.icon ?? "calendar")
                                    .font(.system(size: 32))
                                    .foregroundColor(AmikaColors.sage)
                            }

                            // Title
                            Text(event.title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .foregroundColor(AmikaColors.textPrimary)
                                .multilineTextAlignment(.center)
                                .strikethrough(event.isCompleted == true)

                            // Status badge
                            if event.isCompleted == true {
                                Label("Completed", systemImage: "checkmark.circle.fill")
                                    .font(.subheadline)
                                    .foregroundColor(AmikaColors.success)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(AmikaColors.success.opacity(0.1))
                                    .cornerRadius(20)
                            } else if event.isToday {
                                Label("Today", systemImage: "star.fill")
                                    .font(.subheadline)
                                    .foregroundColor(AmikaColors.rose)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(AmikaColors.roseLighter)
                                    .cornerRadius(20)
                            }
                        }
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(Color.white)
                        .cornerRadius(16)

                        // Details
                        VStack(spacing: 0) {
                            // Date
                            DetailRow(
                                icon: "calendar",
                                title: "Date & Time",
                                value: event.displayDate
                            )

                            Divider()
                                .padding(.leading, 56)

                            // Category
                            if let category = event.category {
                                DetailRow(
                                    icon: category.icon,
                                    title: "Category",
                                    value: category.displayName
                                )

                                Divider()
                                    .padding(.leading, 56)
                            }

                            // Location
                            if let location = event.location, !location.isEmpty {
                                DetailRow(
                                    icon: "mappin",
                                    title: "Location",
                                    value: location
                                )

                                Divider()
                                    .padding(.leading, 56)
                            }

                            // Google Calendar
                            if event.googleEventId != nil {
                                DetailRow(
                                    icon: "link",
                                    title: "Calendar",
                                    value: "Synced with Google Calendar"
                                )
                            }
                        }
                        .background(Color.white)
                        .cornerRadius(16)

                        // Description
                        if let description = event.description, !description.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
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
                            .cornerRadius(16)
                        }

                        // Complete button
                        if event.isCompleted != true {
                            Button {
                                completeEvent()
                            } label: {
                                HStack {
                                    if isCompleting {
                                        ProgressView()
                                            .tint(.white)
                                    } else {
                                        Image(systemName: "checkmark.circle")
                                        Text("Mark as Complete")
                                    }
                                }
                                .font(.headline)
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(AmikaColors.sage)
                                .cornerRadius(12)
                            }
                            .disabled(isCompleting)
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

                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        Button {
                            showEditSheet = true
                        } label: {
                            Label("Edit", systemImage: "pencil")
                        }

                        Button(role: .destructive) {
                            showDeleteAlert = true
                        } label: {
                            Label("Delete", systemImage: "trash")
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
            .sheet(isPresented: $showEditSheet) {
                EditEventView(event: event, onUpdate: onUpdate)
            }
            .alert("Delete Event", isPresented: $showDeleteAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Delete", role: .destructive) {
                    deleteEvent()
                }
            } message: {
                Text("Are you sure you want to delete this event?")
            }
        }
    }

    private func completeEvent() {
        isCompleting = true

        Task {
            do {
                let updated = try await EventsService.shared.markEventComplete(
                    id: event.id,
                    isCompleted: true
                )
                onUpdate(updated)
            } catch {
                print("Error completing event: \(error)")
            }
            isCompleting = false
        }
    }

    private func deleteEvent() {
        Task {
            do {
                try await EventsService.shared.deleteEvent(id: event.id)
                onDelete()
                dismiss()
            } catch {
                print("Error deleting event: \(error)")
            }
        }
    }
}

struct DetailRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(AmikaColors.sage)
                .frame(width: 40)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(AmikaColors.textMuted)

                Text(value)
                    .font(.body)
                    .foregroundColor(AmikaColors.textPrimary)
            }

            Spacer()
        }
        .padding()
    }
}

#Preview {
    EventDetailView(
        event: AmikaEvent(
            id: "1",
            userId: "1",
            title: "Coffee with John",
            description: "Catch up over coffee at the new cafe downtown",
            date: ISO8601DateFormatter().string(from: Date()),
            location: "Blue Bottle Coffee",
            category: .restaurants,
            isCompleted: false,
            friendIds: "1",
            googleEventId: nil,
            createdAt: nil,
            updatedAt: nil
        ),
        onUpdate: { _ in },
        onDelete: {}
    )
}
