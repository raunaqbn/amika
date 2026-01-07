import SwiftUI

struct MirrorView: View {
    @StateObject private var chatService = ChatService()
    @State private var inputText = ""
    @State private var showSaveToDiary = false
    @FocusState private var isInputFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack {
                AmikaColors.background
                    .ignoresSafeArea()

                VStack(spacing: 0) {
                    // Messages
                    if chatService.messages.isEmpty {
                        emptyState
                    } else {
                        messagesList
                    }

                    // Input
                    inputArea
                }
            }
            .navigationTitle("Mirror")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Menu {
                        if !chatService.messages.isEmpty {
                            Button {
                                showSaveToDiary = true
                            } label: {
                                Label("Save to Diary", systemImage: "book")
                            }

                            Button(role: .destructive) {
                                chatService.clearChat()
                            } label: {
                                Label("Clear Chat", systemImage: "trash")
                            }
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                            .foregroundColor(AmikaColors.sage)
                    }
                }
            }
            .alert("Save to Diary", isPresented: $showSaveToDiary) {
                Button("Cancel", role: .cancel) {}
                Button("Save") {
                    saveToDiary()
                }
            } message: {
                Text("Save this conversation as a diary entry?")
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: 20) {
            Spacer()

            Image(systemName: "bubble.left.and.bubble.right.fill")
                .font(.system(size: 60))
                .foregroundColor(AmikaColors.sage.opacity(0.5))

            Text("Mirror AI")
                .font(.title)
                .fontWeight(.bold)
                .foregroundColor(AmikaColors.textPrimary)

            Text("Your AI companion for nurturing friendships. Ask for advice, plan activities, or just chat.")
                .font(.subheadline)
                .foregroundColor(AmikaColors.textSecondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)

            // Suggestion chips
            VStack(spacing: 12) {
                SuggestionChip(text: "Help me plan an outing with friends") {
                    sendMessage("Help me plan an outing with friends")
                }

                SuggestionChip(text: "I haven't talked to a friend in a while") {
                    sendMessage("I haven't talked to a friend in a while and I'm feeling guilty about it")
                }

                SuggestionChip(text: "Gift ideas for a birthday") {
                    sendMessage("I need gift ideas for a friend's birthday")
                }
            }
            .padding(.top, 20)

            Spacer()
        }
    }

    private var messagesList: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 16) {
                    ForEach(chatService.messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }

                    if chatService.isStreaming {
                        HStack {
                            TypingIndicator()
                            Spacer()
                        }
                        .padding(.horizontal)
                    }
                }
                .padding()
            }
            .onChange(of: chatService.messages.count) {
                if let lastMessage = chatService.messages.last {
                    withAnimation {
                        proxy.scrollTo(lastMessage.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private var inputArea: some View {
        VStack(spacing: 0) {
            Divider()

            HStack(spacing: 12) {
                TextField("Ask Mirror anything...", text: $inputText, axis: .vertical)
                    .textFieldStyle(.plain)
                    .padding(12)
                    .background(Color.white)
                    .cornerRadius(20)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(AmikaColors.border, lineWidth: 1)
                    )
                    .focused($isInputFocused)
                    .lineLimit(1...5)
                    .onSubmit {
                        sendMessage(inputText)
                    }

                Button {
                    sendMessage(inputText)
                } label: {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.system(size: 32))
                        .foregroundColor(inputText.isEmpty ? AmikaColors.textMuted : AmikaColors.sage)
                }
                .disabled(inputText.isEmpty || chatService.isStreaming)
            }
            .padding()
            .background(AmikaColors.background)
        }
    }

    private func sendMessage(_ text: String) {
        guard !text.isEmpty else { return }
        let message = text
        inputText = ""
        isInputFocused = false
        chatService.sendMessage(message)
    }

    private func saveToDiary() {
        Task {
            do {
                try await chatService.saveConversationToDiary()
            } catch {
                print("Error saving to diary: \(error)")
            }
        }
    }
}

struct SuggestionChip: View {
    let text: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(text)
                .font(.subheadline)
                .foregroundColor(AmikaColors.textPrimary)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.white)
                .cornerRadius(20)
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(AmikaColors.border, lineWidth: 1)
                )
        }
    }
}

struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == .user {
                Spacer()
            }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(message.content)
                    .font(.body)
                    .foregroundColor(message.role == .user ? .white : AmikaColors.textPrimary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(message.role == .user ? AmikaColors.sage : Color.white)
                    .cornerRadius(20)

                Text(message.createdAt, style: .time)
                    .font(.caption2)
                    .foregroundColor(AmikaColors.textMuted)
            }

            if message.role == .assistant {
                Spacer()
            }
        }
    }
}

struct TypingIndicator: View {
    @State private var animating = false

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { index in
                Circle()
                    .fill(AmikaColors.textMuted)
                    .frame(width: 8, height: 8)
                    .scaleEffect(animating ? 1.0 : 0.5)
                    .animation(
                        .easeInOut(duration: 0.5)
                        .repeatForever()
                        .delay(Double(index) * 0.2),
                        value: animating
                    )
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.white)
        .cornerRadius(20)
        .onAppear {
            animating = true
        }
    }
}

#Preview {
    MirrorView()
}
