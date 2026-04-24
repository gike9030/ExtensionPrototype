# AI Chat Extension

A VS Code extension that provides an AI-powered chat interface integrated directly into Visual Studio Code's sidebar. The extension communicates with a .NET backend API for processing chat requests.

## Project Structure

```
ExtensionPrototype/
├── Extension.ApiService/      # .NET 9 Web API backend (chat endpoint)
├── vscode-extension/          # VS Code Extension entry point
│   └── webview-ui/            # React TypeScript UI (chat interface)
├── .vscode/                   # VS Code workspace configuration
│   ├── tasks.json             # Build and run tasks
│   ├── launch.json            # Debug configuration
│   └── settings.json          # Editor settings
└── README.md                  # This file
```

## Prerequisites

- **Node.js** v18+ (for webview development)
- **.NET 9 SDK** (for API service)
- **VS Code** v1.80.0+

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ExtensionPrototype

# Install extension dependencies
cd vscode-extension
npm install
cd webview-ui
npm install
cd ../..

# .NET dependencies are handled automatically by dotnet restore
```

### 2. Quick Start (One Command)

Simply press **F5** in VS Code. This automatically:
- Starts the .NET API service on port 5587
- Watches TypeScript files for changes
- Launches the Extension Development Host (new VS Code window with extension loaded)

## Development Workflow

### Running Individual Components

If you need to run components separately:

**Option 1: Using VS Code Task Menu**
- Press `Ctrl+Shift+B`
- Select `Run All (API + Extension)`

**Option 2: Manual Terminal Commands**
```bash
# Terminal 1: Start API
cd Extension.ApiService
dotnet run

# Terminal 2: Start Extension Watcher
cd vscode-extension
npm run watch

# Then press F5 to debug
```

### Building for Production

```bash
# Build webview UI
cd vscode-extension/webview-ui
npm run build

# Compile extension TypeScript
cd ..
npm run compile

# Package extension (if needed)
npm install -g @vscode/vsce
vsce package
```

## Architecture

### Backend (Extension.ApiService)
- **.NET 9** minimal API
- **Endpoint:** `POST /chat` accepts `{ message: string }`
- Returns: `{ reply: string }`
- *TODO: Integrate real AI model and database*

### Frontend (vscode-extension/webview-ui)
- **React** + TypeScript + Vite
- Chat interface with message history UI
- Communicates with backend via REST API

### Extension
- Registers a webview panel in VS Code sidebar
- Manages activation and lifecycle
- Hosts the React webview UI

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5587
netstat -ano | findstr :5587

# Kill it (replace PID)
taskkill /PID <PID> /F
```

### TypeScript Watch Not Starting
```bash
cd vscode-extension
npm install
npm run watch
```

### Extension Not Loading
1. Check Extension Development Host shows no errors
2. Verify webview-ui is built: `npm run build` in `webview-ui` folder
3. Check webview-ui dist folder exists

## Contributing

1. Create a feature branch from `master`
2. Make changes in your branch
3. Ensure tasks run without errors (F5)
4. Push to remote and create a PR
5. Request review from team

