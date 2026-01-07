import Foundation

/// Main API client for communicating with the Amika backend
actor APIClient {
    static let shared = APIClient()

    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true

        self.session = URLSession(configuration: config)

        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601

        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    enum APIError: LocalizedError {
        case invalidURL
        case invalidResponse
        case httpError(statusCode: Int, message: String?)
        case decodingError(Error)
        case networkError(Error)
        case unauthorized
        case notFound
        case serverError

        var errorDescription: String? {
            switch self {
            case .invalidURL:
                return "Invalid URL"
            case .invalidResponse:
                return "Invalid server response"
            case .httpError(let code, let message):
                return message ?? "HTTP Error: \(code)"
            case .decodingError(let error):
                return "Failed to parse response: \(error.localizedDescription)"
            case .networkError(let error):
                return "Network error: \(error.localizedDescription)"
            case .unauthorized:
                return "Session expired. Please sign in again."
            case .notFound:
                return "Resource not found"
            case .serverError:
                return "Server error. Please try again later."
            }
        }
    }

    enum HTTPMethod: String {
        case get = "GET"
        case post = "POST"
        case put = "PUT"
        case delete = "DELETE"
    }

    // MARK: - Core Request Methods

    func request<T: Decodable>(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        let data = try await performRequest(endpoint: endpoint, method: method, body: body, queryItems: queryItems)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }

    func requestVoid(
        endpoint: String,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws {
        _ = try await performRequest(endpoint: endpoint, method: method, body: body, queryItems: queryItems)
    }

    private func performRequest(
        endpoint: String,
        method: HTTPMethod,
        body: Encodable?,
        queryItems: [URLQueryItem]?
    ) async throws -> Data {
        // Build URL
        var urlString = Constants.apiBaseURL + endpoint
        if let queryItems = queryItems, !queryItems.isEmpty {
            var components = URLComponents(string: urlString)
            components?.queryItems = queryItems
            urlString = components?.string ?? urlString
        }

        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }

        // Build request
        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        // Add session cookie if available
        if let sessionToken = try? KeychainService.shared.readString(forKey: Constants.Keychain.sessionToken) {
            request.setValue("amika_session=\(sessionToken)", forHTTPHeaderField: "Cookie")
        }

        // Add body if present
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }

        // Perform request
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }

        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }

        // Handle cookies from response
        if let headerFields = httpResponse.allHeaderFields as? [String: String],
           let url = httpResponse.url {
            let cookies = HTTPCookie.cookies(withResponseHeaderFields: headerFields, for: url)
            for cookie in cookies where cookie.name == "amika_session" {
                try? KeychainService.shared.save(cookie.value, forKey: Constants.Keychain.sessionToken)
            }
        }

        // Handle status codes
        switch httpResponse.statusCode {
        case 200...299:
            return data

        case 401:
            // Clear session and notify
            KeychainService.shared.clearAll()
            NotificationCenter.default.post(name: Constants.Notifications.sessionExpired, object: nil)
            throw APIError.unauthorized

        case 404:
            throw APIError.notFound

        case 500...599:
            throw APIError.serverError

        default:
            // Try to extract error message from response
            let errorMessage = try? decoder.decode(ErrorResponse.self, from: data)
            throw APIError.httpError(statusCode: httpResponse.statusCode, message: errorMessage?.error)
        }
    }

    // MARK: - Streaming Support for Chat

    func streamChat(
        messages: [ChatRequestMessage],
        friendContext: String?
    ) -> AsyncThrowingStream<String, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let urlString = Constants.apiBaseURL + "/api/chat"
                    guard let url = URL(string: urlString) else {
                        continuation.finish(throwing: APIError.invalidURL)
                        return
                    }

                    var request = URLRequest(url: url)
                    request.httpMethod = "POST"
                    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                    request.setValue("text/event-stream", forHTTPHeaderField: "Accept")

                    if let sessionToken = try? KeychainService.shared.readString(forKey: Constants.Keychain.sessionToken) {
                        request.setValue("amika_session=\(sessionToken)", forHTTPHeaderField: "Cookie")
                    }

                    let chatRequest = ChatRequest(messages: messages, friendContext: friendContext)
                    request.httpBody = try encoder.encode(chatRequest)

                    let (bytes, response) = try await session.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse,
                          (200...299).contains(httpResponse.statusCode) else {
                        continuation.finish(throwing: APIError.invalidResponse)
                        return
                    }

                    for try await line in bytes.lines {
                        if line.hasPrefix("data: ") {
                            let data = String(line.dropFirst(6))
                            if data != "[DONE]" {
                                continuation.yield(data)
                            }
                        }
                    }

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}

struct ErrorResponse: Codable {
    let error: String?
}
