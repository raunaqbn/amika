import Foundation

/// Service for managing diary notes
actor DiaryService {
    static let shared = DiaryService()
    private let apiClient = APIClient.shared

    private init() {}

    // MARK: - CRUD Operations

    func fetchNotes() async throws -> [DiaryNote] {
        try await apiClient.request(endpoint: "/api/diary")
    }

    func createNote(_ request: CreateDiaryRequest) async throws -> DiaryNote {
        try await apiClient.request(endpoint: "/api/diary", method: .post, body: request)
    }

    func updateNote(_ request: UpdateDiaryRequest) async throws -> DiaryNote {
        try await apiClient.request(endpoint: "/api/diary", method: .put, body: request)
    }

    func deleteNote(id: String) async throws {
        try await apiClient.requestVoid(
            endpoint: "/api/diary",
            method: .delete,
            queryItems: [URLQueryItem(name: "id", value: id)]
        )
    }

    // MARK: - Sharing

    func shareNoteWithFriends(noteId: String, friendIds: [String]) async throws -> DiaryNote {
        let request = UpdateDiaryRequest(
            id: noteId,
            content: nil,
            friendTags: nil,
            sharedWithFriends: friendIds.joined(separator: ",")
        )
        return try await updateNote(request)
    }

    // MARK: - Guided Journaling

    func getGuidedJournalPrompt(category: String) async throws -> GuidedJournalResponse {
        struct GuidedJournalRequest: Codable {
            let category: String
        }
        return try await apiClient.request(
            endpoint: "/api/guided-journal",
            method: .post,
            body: GuidedJournalRequest(category: category)
        )
    }

    // MARK: - Writing Assistant

    func getWritingAssistance(content: String, cue: WritingCue) async throws -> WritingAssistantResponse {
        struct WritingAssistantRequest: Codable {
            let content: String
            let cue: String
        }
        return try await apiClient.request(
            endpoint: "/api/writing-assistant",
            method: .post,
            body: WritingAssistantRequest(content: content, cue: cue.rawValue)
        )
    }
}

struct GuidedJournalResponse: Codable {
    let prompt: String
    let followUp: String?
}

struct WritingAssistantResponse: Codable {
    let suggestion: String
}

enum WritingCue: String, CaseIterable {
    case suggestIdeas = "suggest_ideas"
    case challengeThinking = "challenge_thinking"
    case alternativePerspectives = "alternative_perspectives"
    case thinkingTraps = "thinking_traps"
    case positiveReframe = "positive_reframe"

    var displayName: String {
        switch self {
        case .suggestIdeas: return "Suggest Ideas"
        case .challengeThinking: return "Challenge My Thinking"
        case .alternativePerspectives: return "Alternative Perspectives"
        case .thinkingTraps: return "Identify Thinking Traps"
        case .positiveReframe: return "Positive Reframe"
        }
    }

    var icon: String {
        switch self {
        case .suggestIdeas: return "lightbulb.fill"
        case .challengeThinking: return "questionmark.circle.fill"
        case .alternativePerspectives: return "arrow.left.arrow.right"
        case .thinkingTraps: return "exclamationmark.triangle.fill"
        case .positiveReframe: return "sun.max.fill"
        }
    }
}
