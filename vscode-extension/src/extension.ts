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
        const distUri = webview.asWebviewUri(distPath);

        let html = fs.readFileSync(indexPath, 'utf8');
        // Replace relative asset paths with webview URIs
        html = html.replace(/\.\//g, `${distUri}/`);
        return html;
    }
}
