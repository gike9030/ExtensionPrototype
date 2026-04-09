import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let savedConversations = '[]';
let sidebarView: vscode.WebviewView | undefined;
let floatingPanel: vscode.WebviewPanel | undefined;
let extUri: vscode.Uri;
let extContext: vscode.ExtensionContext;

function broadcastActiveFile(editor: vscode.TextEditor | undefined) {
    if (!editor) return;
    const fileName = path.basename(editor.document.fileName);
    const filePath = editor.document.fileName;
    const content = editor.document.getText();
    const msg = { command: 'activeFileChanged', name: fileName, path: filePath, content };
    sidebarView?.webview.postMessage(msg);
    floatingPanel?.webview.postMessage(msg);
}

export function activate(context: vscode.ExtensionContext) {
    extContext = context;
    extUri = context.extensionUri;
    savedConversations = context.globalState.get<string>('chatConversations', '[]');

    const provider = new ChatViewProvider(context.extensionUri);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider)
    );

    // Broadcast active editor changes to all open webviews
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => broadcastActiveFile(editor))
    );
}

export function deactivate() {}

function buildHtml(webview: vscode.Webview, mode: 'sidebar' | 'editor' | 'window'): string {
    const distPath = vscode.Uri.joinPath(extUri, 'webview-ui', 'dist');
    const indexPath = path.join(distPath.fsPath, 'index.html');

    try {
        let html = fs.readFileSync(indexPath, 'utf8');
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, 'assets', 'index.js')
        ).toString();
        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(distPath, 'assets', 'index.css')
        ).toString();

        html = html.replace(/src="\.\/assets\/index\.js"/g, `src="${scriptUri}"`);
        html = html.replace(/href="\.\/assets\/index\.css"/g, `href="${styleUri}"`);

        // Inject initial state and layout mode before </head>
        const initScript = `<script>
            window.__INITIAL_STATE__ = ${JSON.stringify(savedConversations)};
            window.__LAYOUT_MODE__ = "${mode}";
        </script>`;
        html = html.replace('</head>', `${initScript}</head>`);

        return html;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>AI Chat</title></head>
<body><h3>Failed to load webview UI</h3><p>${msg}</p></body>
</html>`;
    }
}

function handleMessage(msg: { command: string; data?: string }) {
    switch (msg.command) {
        case 'saveState':
            savedConversations = msg.data ?? '[]';
            extContext.globalState.update('chatConversations', savedConversations);
            break;

        case 'moveToEditorArea':
            openFloatingPanel('editor');
            break;

        case 'moveToNewWindow':
            openFloatingPanel('window');
            break;

        case 'getWorkspaceFiles':
            vscode.workspace.findFiles(
                '**/*.{ts,tsx,js,jsx,cs,py,json,md,html,css,yaml,yml,txt}',
                '**/node_modules/**',
                60
            ).then(files => {
                const fileList = files.map(f => ({ name: path.basename(f.fsPath), path: f.fsPath }));
                const response = { command: 'workspaceFiles', files: fileList };
                sidebarView?.webview.postMessage(response);
                floatingPanel?.webview.postMessage(response);
            });
            break;

        case 'getFileContent': {
            const filePath = msg.data;
            if (filePath) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const name = path.basename(filePath);
                    const response = { command: 'fileContent', name, path: filePath, content };
                    sidebarView?.webview.postMessage(response);
                    floatingPanel?.webview.postMessage(response);
                } catch { /* ignore unreadable files */ }
            }
            break;
        }

        case 'moveToSidebar':
            if (floatingPanel) {
                floatingPanel.dispose();
                floatingPanel = undefined;
            }
            // Reveal the sidebar panel and restore its state
            vscode.commands.executeCommand('aiChatPanel.focus').then(() => {
                if (sidebarView) {
                    sidebarView.webview.postMessage({
                        command: 'restoreState',
                        data: savedConversations,
                    });
                }
            });
            break;
    }
}

function openFloatingPanel(mode: 'editor' | 'window') {
    if (floatingPanel) {
        floatingPanel.reveal();
        if (mode === 'window') {
            setTimeout(
                () => vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow'),
                200
            );
        }
        return;
    }

    floatingPanel = vscode.window.createWebviewPanel(
        'aiChatFloat',
        'AI Chat',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.joinPath(extUri, 'webview-ui', 'dist')],
            retainContextWhenHidden: true,
        }
    );

    floatingPanel.webview.html = buildHtml(floatingPanel.webview, mode);
    floatingPanel.webview.onDidReceiveMessage(handleMessage);
    floatingPanel.onDidDispose(() => {
        floatingPanel = undefined;
    });

    if (mode === 'window') {
        setTimeout(
            () => vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow'),
            400
        );
    }
}

class ChatViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'aiChatPanel';

    constructor(private readonly _extensionUri: vscode.Uri) {}

    public resolveWebviewView(webviewView: vscode.WebviewView) {
        sidebarView = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'webview-ui', 'dist'),
            ],
        };

        webviewView.webview.html = buildHtml(webviewView.webview, 'sidebar');
        webviewView.webview.onDidReceiveMessage(handleMessage);
        webviewView.onDidDispose(() => { sidebarView = undefined; });

        // Send currently active file on load
        void Promise.resolve().then(() => broadcastActiveFile(vscode.window.activeTextEditor));
    }
}
