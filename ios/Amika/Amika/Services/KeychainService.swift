import Foundation
import Security

/// Secure storage service using iOS Keychain
final class KeychainService {
    static let shared = KeychainService()

    private init() {}

    enum KeychainError: Error {
        case duplicateEntry
        case unknown(OSStatus)
        case notFound
        case invalidData
    }

    /// Save data to keychain
    func save(_ data: Data, forKey key: String) throws {
        // Delete existing item first
        try? delete(forKey: key)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: Constants.App.bundleId,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        let status = SecItemAdd(query as CFDictionary, nil)

        guard status == errSecSuccess else {
            if status == errSecDuplicateItem {
                throw KeychainError.duplicateEntry
            }
            throw KeychainError.unknown(status)
        }
    }

    /// Save string to keychain
    func save(_ string: String, forKey key: String) throws {
        guard let data = string.data(using: .utf8) else {
            throw KeychainError.invalidData
        }
        try save(data, forKey: key)
    }

    /// Read data from keychain
    func read(forKey key: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: Constants.App.bundleId,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.notFound
            }
            throw KeychainError.unknown(status)
        }

        guard let data = result as? Data else {
            throw KeychainError.invalidData
        }

        return data
    }

    /// Read string from keychain
    func readString(forKey key: String) throws -> String {
        let data = try read(forKey: key)
        guard let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.invalidData
        }
        return string
    }

    /// Delete item from keychain
    func delete(forKey key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecAttrService as String: Constants.App.bundleId
        ]

        let status = SecItemDelete(query as CFDictionary)

        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unknown(status)
        }
    }

    /// Check if key exists in keychain
    func exists(forKey key: String) -> Bool {
        do {
            _ = try read(forKey: key)
            return true
        } catch {
            return false
        }
    }

    /// Clear all app-related keychain items
    func clearAll() {
        try? delete(forKey: Constants.Keychain.sessionToken)
        try? delete(forKey: Constants.Keychain.userId)
    }
}
