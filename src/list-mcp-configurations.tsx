import {
  ActionPanel,
  Action,
  Icon,
  List,
  getPreferenceValues,
  showToast,
  Toast,
  closeMainWindow,
  openCommandPreferences,
} from "@raycast/api";
import { exec } from "child_process";
import { promisify } from "util";
import { homedir } from "os";
import { resolve } from "path";

const execAsync = promisify(exec);

interface MCPClient {
  id: string;
  name: string;
  icon: Icon;
}

type MCPClientWithPath = MCPClient & {
  filePath: string;
  expandedPath?: string;
};

const MCP_CLIENTS: MCPClient[] = [
  { id: "amp", name: "Amp", icon: Icon.Code },
  { id: "claude-code", name: "Claude Code", icon: Icon.Code },
  { id: "claude-desktop-app", name: "Claude Desktop app", icon: Icon.Code },
  { id: "cline", name: "Cline", icon: Icon.Code },
  { id: "codex", name: "Codex", icon: Icon.Code },
  { id: "copilot-cli", name: "Copilot CLI", icon: Icon.Terminal },
  { id: "copilot-vscode", name: "Copilot / VS Code", icon: Icon.Code },
  { id: "cursor", name: "Cursor", icon: Icon.Code },
  { id: "factory-cli", name: "Factory CLI", icon: Icon.Terminal },
  { id: "gemini-cli", name: "Gemini CLI", icon: Icon.Terminal },
  { id: "jetbrains", name: "JetBrains AI Assistant & Junie", icon: Icon.Code },
  { id: "kiro", name: "Kiro", icon: Icon.Code },
  { id: "qoder", name: "Qoder", icon: Icon.Code },
  { id: "visual-studio", name: "Visual Studio", icon: Icon.Code },
  { id: "warp", name: "Warp", icon: Icon.Terminal },
  { id: "windsurf", name: "Windsurf", icon: Icon.Code },
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

async function openInCursor(client: MCPClientWithPath) {
  try {
    const expandedPath = ensureConfiguredPath(client);
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

async function openInVSCode(client: MCPClientWithPath) {
  try {
    const expandedPath = ensureConfiguredPath(client);
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

async function openInZed(client: MCPClientWithPath) {
  try {
    const expandedPath = ensureConfiguredPath(client);
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

async function openInSublime(client: MCPClientWithPath) {
  try {
    const expandedPath = ensureConfiguredPath(client);
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

function ensureConfiguredPath(client: MCPClientWithPath): string {
  if (!client.filePath) {
    throw new Error(`Set the config path for ${client.name} in command preferences.`);
  }

  if (client.expandedPath) {
    return client.expandedPath;
  }

  return expandPath(client.filePath);
}

interface Preferences {
  [key: string]: boolean | string | undefined;
  showCursorAction?: boolean;
  showVsCodeAction?: boolean;
  showZedAction?: boolean;
  showSublimeAction?: boolean;
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();

  // Filter clients based on visibility preferences
  const visibleClients = MCP_CLIENTS.filter((client) => {
    const camelCaseId = toCamelCase(client.id);
    const showKey = `show${camelCaseId.charAt(0).toUpperCase()}${camelCaseId.slice(1)}`;
    return preferences[showKey] !== false; // Default to true if not set
  });

  // Get file path for each client (from preferences or default)
  const clientsWithPaths: MCPClientWithPath[] = visibleClients.map((client) => {
    const pathKey = getPreferenceKey(client.id, "Path");
    const customPath = preferences[pathKey];
    const filePath = typeof customPath === "string" ? customPath.trim() : "";
    const expandedPath = filePath ? expandPath(filePath) : undefined;
    return {
      ...client,
      filePath,
      expandedPath,
    };
  });

  return (
    <List searchBarPlaceholder="Search MCP configurations...">
      {clientsWithPaths.map((client) => (
        <List.Item
          key={client.id}
          icon={client.icon}
          title={client.name}
          subtitle={client.filePath || "Set path in command preferences"}
          actions={
            <ActionPanel>
              {preferences.showCursorAction !== false && (
                <Action title="Open in Cursor" icon={Icon.Code} onAction={() => openInCursor(client)} />
              )}
              <ActionPanel.Section title="Open in Editor">
                {preferences.showVsCodeAction !== false && (
                  <Action
                    title="Open in VS Code"
                    icon={Icon.Code}
                    shortcut={{ modifiers: ["cmd"], key: "v" }}
                    onAction={() => openInVSCode(client)}
                  />
                )}
                {preferences.showZedAction !== false && (
                  <Action
                    title="Open in Zed"
                    icon={Icon.Code}
                    shortcut={{ modifiers: ["cmd"], key: "z" }}
                    onAction={() => openInZed(client)}
                  />
                )}
                {preferences.showSublimeAction !== false && (
                  <Action
                    title="Open in Sublime Text"
                    icon={Icon.Code}
                    shortcut={{ modifiers: ["cmd"], key: "s" }}
                    onAction={() => openInSublime(client)}
                  />
                )}
              </ActionPanel.Section>
              <ActionPanel.Section title="File Actions">
                {client.expandedPath ? (
                  <>
                    <Action.CopyToClipboard
                      title="Copy File Path"
                      content={client.filePath}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action.ShowInFinder path={client.expandedPath} shortcut={{ modifiers: ["cmd"], key: "f" }} />
                  </>
                ) : (
                  <Action
                    title="Set Config Path…"
                    icon={Icon.Gear}
                    shortcut={{ modifiers: ["cmd"], key: "p" }}
                    onAction={() => openCommandPreferences()}
                  />
                )}
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
