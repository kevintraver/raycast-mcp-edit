import { ActionPanel, Action, Icon, List, getPreferenceValues, showToast, Toast, closeMainWindow } from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { resolve } from "path";

const execAsync = promisify(exec);

interface MCPClient {
  id: string;
  name: string;
  defaultPath: string;
  icon: Icon;
}

const MCP_CLIENTS: MCPClient[] = [
  { id: "amp", name: "Amp", defaultPath: "~/placeholder-amp.json", icon: Icon.Code },
  { id: "claude-code", name: "Claude Code", defaultPath: "~/placeholder-claude-code.json", icon: Icon.Code },
  { id: "cline", name: "Cline", defaultPath: "~/placeholder-cline.json", icon: Icon.Code },
  { id: "codex", name: "Codex", defaultPath: "~/placeholder-codex.json", icon: Icon.Code },
  { id: "copilot-cli", name: "Copilot CLI", defaultPath: "~/placeholder-copilot-cli.json", icon: Icon.Terminal },
  {
    id: "copilot-vscode",
    name: "Copilot / VS Code",
    defaultPath: "~/placeholder-copilot-vscode.json",
    icon: Icon.Code,
  },
  { id: "cursor", name: "Cursor", defaultPath: "~/.cursor/mcp.json", icon: Icon.Code },
  { id: "factory-cli", name: "Factory CLI", defaultPath: "~/placeholder-factory-cli.json", icon: Icon.Terminal },
  { id: "gemini-cli", name: "Gemini CLI", defaultPath: "~/placeholder-gemini-cli.json", icon: Icon.Terminal },
  {
    id: "gemini-code-assist",
    name: "Gemini Code Assist",
    defaultPath: "~/placeholder-gemini-code-assist.json",
    icon: Icon.Code,
  },
  {
    id: "jetbrains",
    name: "JetBrains AI Assistant & Junie",
    defaultPath: "~/placeholder-jetbrains.json",
    icon: Icon.Code,
  },
  { id: "kiro", name: "Kiro", defaultPath: "~/placeholder-kiro.json", icon: Icon.Code },
  { id: "qoder", name: "Qoder", defaultPath: "~/placeholder-qoder.json", icon: Icon.Code },
  { id: "visual-studio", name: "Visual Studio", defaultPath: "~/placeholder-visual-studio.json", icon: Icon.Code },
  { id: "warp", name: "Warp", defaultPath: "~/placeholder-warp.json", icon: Icon.Terminal },
  { id: "windsurf", name: "Windsurf", defaultPath: "~/placeholder-windsurf.json", icon: Icon.Code },
];

function expandPath(filePath: string): string {
  const trimmedPath = filePath.trim();

  if (trimmedPath.startsWith("~/")) {
    return resolve(homedir(), trimmedPath.slice(2));
  }

  if (trimmedPath.startsWith("~")) {
    return resolve(homedir(), trimmedPath.slice(1));
  }

  return resolve(trimmedPath);
}

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function getPreferenceKey(clientId: string, suffix: string): string {
  const camelCaseId = toCamelCase(clientId);
  return `${camelCaseId}${suffix}`;
}

async function openInCursor(filePath: string) {
  try {
    const expandedPath = expandPath(filePath);
    await execAsync(`open -a "Cursor" "${expandedPath}"`);
    await closeMainWindow({ clearRootSearch: true });
    await showToast({
      style: Toast.Style.Success,
      title: "Opened in Cursor",
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open in Cursor",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function openInVSCode(filePath: string) {
  try {
    const expandedPath = expandPath(filePath);
    await execAsync(`open -a "Visual Studio Code" "${expandedPath}"`);
    await closeMainWindow({ clearRootSearch: true });
    await showToast({
      style: Toast.Style.Success,
      title: "Opened in VS Code",
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open in VS Code",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function openInZed(filePath: string) {
  try {
    const expandedPath = expandPath(filePath);
    await execAsync(`open -a "Zed" "${expandedPath}"`);
    await closeMainWindow({ clearRootSearch: true });
    await showToast({
      style: Toast.Style.Success,
      title: "Opened in Zed",
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open in Zed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function openInSublime(filePath: string) {
  try {
    const expandedPath = expandPath(filePath);
    await execAsync(`open -a "Sublime Text" "${expandedPath}"`);
    await closeMainWindow({ clearRootSearch: true });
    await showToast({
      style: Toast.Style.Success,
      title: "Opened in Sublime Text",
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to open in Sublime Text",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export default function Command() {
  const preferences = getPreferenceValues<Record<string, boolean | string>>();

  // Filter clients based on visibility preferences
  const visibleClients = MCP_CLIENTS.filter((client) => {
    const camelCaseId = toCamelCase(client.id);
    const showKey = `show${camelCaseId.charAt(0).toUpperCase()}${camelCaseId.slice(1)}`;
    return preferences[showKey] !== false; // Default to true if not set
  });

  // Get file path for each client (from preferences or default)
  const clientsWithPaths = visibleClients.map((client) => {
    const pathKey = getPreferenceKey(client.id, "Path");
    const customPath = preferences[pathKey];
    const filePath = typeof customPath === "string" && customPath ? customPath : client.defaultPath;
    return {
      ...client,
      filePath,
      expandedPath: expandPath(filePath),
    };
  });

  return (
    <List searchBarPlaceholder="Search MCP configurations...">
      {clientsWithPaths.map((client) => (
        <List.Item
          key={client.id}
          icon={client.icon}
          title={client.name}
          subtitle={client.filePath}
          actions={
            <ActionPanel>
              <Action title="Open in Cursor" icon={Icon.Code} onAction={() => openInCursor(client.filePath)} />
              <ActionPanel.Section title="Open in Editor">
                <Action
                  title="Open in VS Code"
                  icon={Icon.Code}
                  shortcut={{ modifiers: ["cmd"], key: "v" }}
                  onAction={() => openInVSCode(client.filePath)}
                />
                <Action
                  title="Open in Zed"
                  icon={Icon.Code}
                  shortcut={{ modifiers: ["cmd"], key: "z" }}
                  onAction={() => openInZed(client.filePath)}
                />
                <Action
                  title="Open in Sublime Text"
                  icon={Icon.Code}
                  shortcut={{ modifiers: ["cmd"], key: "s" }}
                  onAction={() => openInSublime(client.filePath)}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="File Actions">
                <Action.CopyToClipboard
                  title="Copy File Path"
                  content={client.expandedPath}
                  shortcut={{ modifiers: ["cmd"], key: "c" }}
                />
                <Action.ShowInFinder path={client.expandedPath} shortcut={{ modifiers: ["cmd"], key: "f" }} />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
