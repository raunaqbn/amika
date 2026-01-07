import SwiftUI

/// Amika design system colors matching the web app
enum AmikaColors {
    /// Warm white background - #FFFBF5
    static let background = Color(red: 1.0, green: 0.984, blue: 0.961)

    /// Sage green primary color - #A8C5A8
    static let sage = Color(red: 0.659, green: 0.773, blue: 0.659)

    /// Rose accent color - #D4A5A5
    static let rose = Color(red: 0.831, green: 0.647, blue: 0.647)

    /// Light sage for backgrounds - #E8F0E8
    static let sageLighter = Color(red: 0.91, green: 0.941, blue: 0.91)

    /// Light rose for backgrounds - #F5E8E8
    static let roseLighter = Color(red: 0.961, green: 0.91, blue: 0.91)

    /// Primary text color - dark gray
    static let textPrimary = Color(red: 0.2, green: 0.2, blue: 0.2)

    /// Secondary text color - medium gray
    static let textSecondary = Color(red: 0.4, green: 0.4, blue: 0.4)

    /// Muted text color - light gray
    static let textMuted = Color(red: 0.6, green: 0.6, blue: 0.6)

    /// Border color
    static let border = Color(red: 0.9, green: 0.9, blue: 0.9)

    /// Card background
    static let cardBackground = Color.white

    /// Error/warning color
    static let error = Color(red: 0.9, green: 0.3, blue: 0.3)

    /// Success color
    static let success = Color(red: 0.3, green: 0.7, blue: 0.4)

    /// Event category colors
    enum EventCategory {
        static let fitness = Color(red: 0.4, green: 0.7, blue: 0.4)
        static let experiences = Color(red: 0.6, green: 0.4, blue: 0.8)
        static let places = Color(red: 0.3, green: 0.6, blue: 0.9)
        static let restaurants = Color(red: 0.9, green: 0.5, blue: 0.3)
        static let virtual = Color(red: 0.5, green: 0.5, blue: 0.7)
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
