import SwiftUI
import WebKit

/// WebView for OAuth authentication flows
struct WebAuthView: UIViewRepresentable {
    let url: URL
    let callbackScheme: String
    let onCallback: (URL) -> Void

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.load(URLRequest(url: url))

        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    class Coordinator: NSObject, WKNavigationDelegate {
        let parent: WebAuthView

        init(_ parent: WebAuthView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            if let url = navigationAction.request.url,
               url.scheme == parent.callbackScheme {
                parent.onCallback(url)
                decisionHandler(.cancel)
                return
            }
            decisionHandler(.allow)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            // Check if we landed on a success page
            if let url = webView.url {
                // Check for OAuth callback in the URL path
                if url.path.contains("callback") || url.path.contains("success") {
                    // Check cookies for session
                    WKWebsiteDataStore.default().httpCookieStore.getAllCookies { cookies in
                        for cookie in cookies where cookie.name == "amika_session" {
                            // Save session token
                            try? KeychainService.shared.save(cookie.value, forKey: Constants.Keychain.sessionToken)
                            DispatchQueue.main.async {
                                self.parent.onCallback(url)
                            }
                            break
                        }
                    }
                }
            }
        }
    }
}

#Preview {
    WebAuthView(
        url: URL(string: "https://example.com")!,
        callbackScheme: "amika"
    ) { _ in }
}
