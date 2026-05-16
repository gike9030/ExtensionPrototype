# AI Chat Extension

A VS Code extension that provides an AI-powered chat interface integrated directly into Visual Studio Code's sidebar. The extension communicates with a .NET 9 backend API, which uses Google Gemini for AI responses and Supabase for conversation persistence.

## Project Structure

```
ExtensionPrototype/
├── Extension.ApiService/      # .NET 9 Web API backend
│   ├── Models/                # ChatRequest, ChatResponse, MessageRecord
│   ├── Processors/            # ChatProcessor (orchestration logic)
│   ├── Repositories/          # SupabaseRepository (data persistence)
│   ├── Services/              # GeminiChatService (AI inference)
│   ├── appsettings.json       # Config template (empty keys — safe to commit)
│   └── appsettings.Development.json  # Your local secrets (git-ignored)
├── vscode-extension/          # VS Code Extension entry point
│   └── webview-ui/            # React + TypeScript chat interface (Vite)
├── .vscode/                   # VS Code workspace configuration
│   ├── tasks.json             # Build and run tasks
│   ├── launch.json            # Debug configuration
│   └── settings.json          # Editor settings
└── README.md                  # This file
```

## Prerequisites

- **Node.js** v18+
- **.NET 9 SDK**
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

# .NET dependencies are restored automatically on first run
```

### 2. Configure Secrets

The backend requires a Supabase project and a Gemini API key. Each developer sets up their own instances for local development.

#### Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. In your project, open the **SQL Editor** and run the following to create the messages table:

```sql
create table folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table chats (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  folder_id uuid references folders(id) on delete set null,
  pinned bool not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  user_text text not null,
  ai_text text not null,
  created_at timestamptz default now(),
  chat_id uuid references chats(id) on delete cascade
);
```

3. Go to **Project Settings → API** and copy:
   - **Project URL** → `Supabase.Url`
   - **`service_role` secret** → `Supabase.ServiceRoleKey`

#### Gemini

1. Go to [Google AI Studio](https://aistudio.google.com) → **Get API key**
2. Copy the key → `Gemini.ApiKey`

#### Apply the config

Create `Extension.ApiService/appsettings.Development.json` (already git-ignored) and fill in your values:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "Supabase": {
    "Url": "<your-supabase-project-url>",
    "ServiceRoleKey": "<your-supabase-service-role-key>"
  },
  "Gemini": {
    "ApiKey": "<your-gemini-api-key>"
  }
}
```

> The `appsettings.json` file in the repo contains empty keys and serves as a reference — do not put real values there.

### 3. Quick Start (One Command)

Press **F5** in VS Code. This automatically:

- Starts the .NET API service on port 5587
- Watches TypeScript files for changes
- Launches the Extension Development Host (a new VS Code window with the extension loaded)

> To start components manually: run `dotnet run` in `Extension.ApiService`, then `npm run dev` in `vscode-extension/webview-ui`, then press **F5**.

## Development Workflow

### Running Individual Components

**Option 1: VS Code Task Menu**
- Press `Ctrl+Shift+B`
- Select `Run All (API + Extension)`

**Option 2: Manual terminals**

```bash
# Terminal 1 — backend API
cd Extension.ApiService
dotnet run

# Terminal 2 — webview UI watcher
cd vscode-extension/webview-ui
npm run dev

# Terminal 3 — extension TypeScript watcher (optional)
cd vscode-extension
npm run watch

# Then press F5 in VS Code
```

### Building for Production

```bash
# Build webview UI
cd vscode-extension/webview-ui
npm run build

# Compile extension TypeScript
cd ..
npm run compile

# Package extension
npm install -g @vscode/vsce
vsce package
```

## Architecture

### Backend (Extension.ApiService)

- **.NET 9** minimal API
- **Endpoint:** `POST /chat` — accepts `{ message, sessionId, context }`, returns `{ reply, steps }`
- **GeminiChatService** — calls the Gemini API for AI responses with a fallback model chain
- **SupabaseRepository** — persists each exchange (session ID, user text, AI reply) to Supabase
- **ChatProcessor** — orchestrates inference and storage

### Frontend (vscode-extension/webview-ui)

- **React 19** + TypeScript + Vite
- Components: `InputArea`, `CodeBlock`, `MessageBubble`, `ExecutingPanel`, `SessionsPanel`
- Communicates with the backend via REST; communicates with the extension host via `postMessage`

### Extension Host (vscode-extension)

- Registers the webview sidebar panel in VS Code
- Manages editor decorations for inline code preview (accept/reject)
- Stores session metadata (titles, folders, pins) in VS Code `globalState`

## Troubleshooting

### Port already in use

```bash
netstat -ano | findstr :5587
taskkill /PID <PID> /F
```

### TypeScript watch not starting

```bash
cd vscode-extension
npm install
npm run watch
```

### Extension not loading

1. Check the Extension Development Host for errors
2. Verify the webview UI is built: run `npm run build` in `webview-ui/`
3. Confirm the `dist/` folder exists inside `webview-ui/`

### API returning 500 / Unauthorized

1. Confirm `appsettings.Development.json` exists in `Extension.ApiService/`
2. Check all three keys are filled in and not empty
3. Verify the Supabase `messages` table exists (re-run the SQL above if needed)
4. Confirm the Gemini API key is active in [Google AI Studio](https://aistudio.google.com)

## Contributing

1. Create a feature branch from `master`
2. Make your changes
3. Confirm F5 launches without errors
4. **Never commit `appsettings.Development.json`**
5. Push and open a PR against `master`
6. Request a review from the team
