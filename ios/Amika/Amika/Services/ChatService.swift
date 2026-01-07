import Foundation

/// Service for Mirror AI chat
@MainActor
class ChatService: ObservableObject {
    @Published var messages: [ChatMessage] = []
    @Published var isStreaming = false
    @Published var error: String?

    private let apiClient = APIClient.shared
    private var streamTask: Task<Void, Never>?

    // Local storage key for chat history
    private let chatHistoryKey = "amika_chat_history"

    init() {
        loadChatHistory()
    }

    // MARK: - Chat Operations

    func sendMessage(_ content: String, friendContext: String? = nil) {
        let userMessage = ChatMessage(role: .user, content: content)
        messages.append(userMessage)
        saveChatHistory()

        // Start streaming response
        streamResponse(friendContext: friendContext)
    }

    private func streamResponse(friendContext: String?) {
        isStreaming = true
        error = nil

        // Create placeholder for assistant message
        let assistantMessage = ChatMessage(role: .assistant, content: "")
        messages.append(assistantMessage)

        let messageIndex = messages.count - 1

        // Prepare request messages
        let requestMessages = messages.dropLast().map { msg in
            ChatRequestMessage(role: msg.role.rawValue, content: msg.content)
        }

        streamTask = Task {
            do {
                var fullContent = ""

                for try await chunk in await apiClient.streamChat(messages: Array(requestMessages), friendContext: friendContext) {
                    // Parse streaming response
                    if let data = chunk.data(using: .utf8),
                       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let text = json["text"] as? String {
                        fullContent += text
                        messages[messageIndex].content = fullContent
                    } else {
                        // Assume plain text chunk
                        fullContent += chunk
                        messages[messageIndex].content = fullContent
                    }
                }

                saveChatHistory()
            } catch {
                self.error = error.localizedDescription
                // Remove failed message
                if messages.count > messageIndex {
                    messages.remove(at: messageIndex)
                }
            }

            isStreaming = false
        }
    }

    func cancelStream() {
        streamTask?.cancel()
        streamTask = nil
        isStreaming = false
    }

    func clearChat() {
        messages = []
        saveChatHistory()
    }

    func deleteMessage(at index: Int) {
        guard index < messages.count else { return }
        messages.remove(at: index)
        saveChatHistory()
    }

    // MARK: - Persistence

    private func loadChatHistory() {
        guard let data = UserDefaults.standard.data(forKey: chatHistoryKey),
              let decoded = try? JSONDecoder().decode([ChatMessage].self, from: data) else {
            return
        }
        messages = decoded
    }

    private func saveChatHistory() {
        guard let encoded = try? JSONEncoder().encode(messages) else { return }
        UserDefaults.standard.set(encoded, forKey: chatHistoryKey)
    }

    // MARK: - Save to Diary

    func saveConversationToDiary() async throws {
        let diaryContent = messages.map { msg in
            let role = msg.role == .user ? "Me" : "Mirror"
            return "**\(role):** \(msg.content)"
        }.joined(separator: "\n\n")

        let request = CreateDiaryRequest(
            content: "## Mirror Conversation\n\n\(diaryContent)",
            friendTags: nil,
            sharedWithFriends: nil
        )

        _ = try await DiaryService.shared.createNote(request)
    }
}
