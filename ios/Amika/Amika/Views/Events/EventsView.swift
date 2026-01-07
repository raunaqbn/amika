import SwiftUI

struct EventsView: View {
    @StateObject private var viewModel = EventsViewModel()
    @State private var showAddEvent = false
    @State private var selectedEvent: AmikaEvent?
    @State private var selectedCategory: EventCategory?

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                if viewModel.isLoading && viewModel.events.isEmpty {
                    ProgressView()
                        .scaleEffect(1.5)
                } else if viewModel.events.isEmpty {
                    EmptyEventsView(showAddEvent: $showAddEvent)
                } else {
                    eventsList
                }
            }
            .navigationTitle("Events")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showAddEvent = true
                    } label: {
                        Image(systemName: "plus")
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
            .sheet(isPresented: $showAddEvent) {
                AddEventView { event in
                    viewModel.events.insert(event, at: 0)
                    viewModel.sortEvents()
                }
            }
            .sheet(item: $selectedEvent) { event in
                EventDetailView(event: event, onUpdate: { updated in
                    if let index = viewModel.events.firstIndex(where: { $0.id == updated.id }) {
                        viewModel.events[index] = updated
                    }
                }, onDelete: {
                    viewModel.events.removeAll { $0.id == event.id }
                })
            }
            .refreshable {
                await viewModel.loadEvents()
            }
            .task {
                await viewModel.loadEvents()
            }
        }
    }

    private var eventsList: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Category filter
                categoryFilter

                // Upcoming events section
                if !upcomingEvents.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Upcoming")
                            .font(.headline)
                            .foregroundColor(AmikaColors.textPrimary)

                        ForEach(upcomingEvents) { event in
                            EventRow(event: event)
                                .onTapGesture {
                                    selectedEvent = event
                                }
                        }
                    }
                }

                // Past events section
                if !pastEvents.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Past")
                            .font(.headline)
                            .foregroundColor(AmikaColors.textSecondary)

                        ForEach(pastEvents) { event in
                            EventRow(event: event, isPast: true)
                                .onTapGesture {
                                    selectedEvent = event
                                }
                        }
                    }
                }
            }
            .padding()
        }
    }

    private var categoryFilter: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                CategoryChip(
                    title: "All",
                    isSelected: selectedCategory == nil
                ) {
                    selectedCategory = nil
                }

                ForEach(EventCategory.allCases, id: \.self) { category in
                    CategoryChip(
                        title: category.displayName,
                        icon: category.icon,
                        isSelected: selectedCategory == category
                    ) {
                        selectedCategory = category
                    }
                }
            }
        }
    }

    private var filteredEvents: [AmikaEvent] {
        guard let category = selectedCategory else {
            return viewModel.events
        }
        return viewModel.events.filter { $0.category == category }
    }

    private var upcomingEvents: [AmikaEvent] {
        filteredEvents.filter { !$0.isPast }
    }

    private var pastEvents: [AmikaEvent] {
        filteredEvents.filter { $0.isPast }
    }
}

struct CategoryChip: View {
    let title: String
    var icon: String?
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.subheadline)
            }
            .foregroundColor(isSelected ? .white : AmikaColors.textPrimary)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
            .background(isSelected ? AmikaColors.sage : Color.white)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(isSelected ? Color.clear : AmikaColors.border, lineWidth: 1)
            )
        }
    }
}

struct EventRow: View {
    let event: AmikaEvent
    var isPast: Bool = false

    var body: some View {
        HStack(spacing: 16) {
            // Date box
            VStack(spacing: 2) {
                if let date = event.eventDate {
                    Text(date, format: .dateTime.day())
                        .font(.title2)
                        .fontWeight(.bold)
                    Text(date, format: .dateTime.month(.abbreviated))
                        .font(.caption)
                        .textCase(.uppercase)
                }
            }
            .foregroundColor(isPast ? AmikaColors.textMuted : AmikaColors.sage)
            .frame(width: 50)

            // Event info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(event.title)
                        .font(.headline)
                        .foregroundColor(isPast ? AmikaColors.textMuted : AmikaColors.textPrimary)
                        .strikethrough(event.isCompleted == true)

                    if event.isCompleted == true {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(AmikaColors.success)
                    }
                }

                if let eventDate = event.eventDate {
                    Text(eventDate, format: .dateTime.hour().minute())
                        .font(.subheadline)
                        .foregroundColor(AmikaColors.textSecondary)
                }

                if let location = event.location, !location.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin")
                            .font(.caption2)
                        Text(location)
                            .font(.caption)
                    }
                    .foregroundColor(AmikaColors.textMuted)
                }
            }

            Spacer()

            // Category icon
            if let category = event.category {
                Image(systemName: category.icon)
                    .font(.title3)
                    .foregroundColor(isPast ? AmikaColors.textMuted : AmikaColors.sage)
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundColor(AmikaColors.textMuted)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .opacity(isPast ? 0.7 : 1)
    }
}

struct EmptyEventsView: View {
    @Binding var showAddEvent: Bool

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "calendar")
                .font(.system(size: 60))
                .foregroundColor(AmikaColors.sage.opacity(0.5))

            Text("No events yet")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundColor(AmikaColors.textPrimary)

            Text("Plan your first activity with friends")
                .font(.subheadline)
                .foregroundColor(AmikaColors.textSecondary)
                .multilineTextAlignment(.center)

            Button {
                showAddEvent = true
            } label: {
                Label("Add Event", systemImage: "plus")
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
    EventsView()
}
