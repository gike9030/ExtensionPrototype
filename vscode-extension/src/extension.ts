import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    const provider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    );
}

export function deactivate() {}

class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChatPanel';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist')
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
                const distPath = vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist');
                const indexPath = path.join(distPath.fsPath, 'index.html');

                try {
                        let html = fs.readFileSync(indexPath, 'utf8');
                        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'assets', 'index.js')).toString();
                        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(distPath, 'assets', 'index.css')).toString();

                        html = html.replace(/src="\.\/assets\/index\.js"/g, `src="${scriptUri}"`);
                        html = html.replace(/href="\.\/assets\/index\.css"/g, `href="${styleUri}"`);

                        return html;
                } catch (error) {
                        const message = error instanceof Error ? error.message : String(error);
                        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AI Chat</title>
</head>
<body>
    <h3>Failed to load webview UI</h3>
    <p>${message}</p>
</body>
</html>`;
                }
    }
}
