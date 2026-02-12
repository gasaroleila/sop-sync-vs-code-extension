import * as vscode from 'vscode';
import Anthropic from "@anthropic-ai/sdk";

async function getAnthropicClient(context: vscode.ExtensionContext) {
  let apiKey = await context.secrets.get('anthropicApiKey');
  
  if (!apiKey) {
    apiKey = await vscode.window.showInputBox({
      prompt: "Enter your Anthropic API key",
      password: true,
      placeHolder: "sk-ant-api03-..."
    });
    
    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }
    
    await context.secrets.store('anthropicApiKey', apiKey);
  }
  
  return new Anthropic({ apiKey });
}


let extensionContext: vscode.ExtensionContext;

// Command 1 - All about prompting the user the sample instruction and generating details using Claude
const saveCommand = vscode.commands.registerCommand(
  "sopSync.saveInstruction",
  async () => {

    const instruction = await vscode.window.showInputBox({
      prompt: "Paste or describe the instruction to save",
      placeHolder: "e.g., Create a Next.js app with TypeScript and Tailwind..."
    });

    if (!instruction) {
      vscode.window.showErrorMessage("No instruction provided.");
      return;
    }

    const title = await vscode.window.showInputBox({
      prompt: "Enter workflow title"
    });

	  if (!title) {
		  return;
	  }

    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    if (!workspaceFolder) {
      vscode.window.showErrorMessage("No workspace folder open.");
      return;
    }

    const path = vscode.Uri.joinPath(
      workspaceFolder.uri,
      ".sopsync",
      "workflows"
    );

    await vscode.workspace.fs.createDirectory(path);

    const fileName = title.replace(/\s+/g, "-").toLowerCase() + ".md";
    const fileUri = vscode.Uri.joinPath(path, fileName);

    const contentToWrite = await generateTemplate(
      title,
      instruction
    );

    await vscode.workspace.fs.writeFile(
      fileUri,
      Buffer.from(contentToWrite)
    );

    const document = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(document);

    vscode.window.showInformationMessage("Saved to SopSync successfully.");
  }
);

async function refineInstruction(instruction: string) {
  const anthropic = await getAnthropicClient(extensionContext);
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `
    You are an expert workflow architect.
    Transform the given instruction into a structured, reusable SOP guide.
    Each section must contain only actionable, specific content.
    Avoid repetition, being verbose, and giving generic advice.

    # Purpose
      [Fill in]

		# When to Use
      [Fill in]

		# Required Input
      [Fill in]

		# Step-by-Step Instructions
      [Fill in]

		# Output Format
      [Fill in]

		# Notes
      [Fill in]

    Instruction to expand on:
    ${instruction}
`
      }
    ]
  });

  const content = response.content[0];
  if (content.type === 'text') {
    return content.text;
  }
  throw new Error('Unexpected response type from API');
}


async function generateTemplate(title: string, instruction: string) {
  const date = new Date().toISOString();
  const content = await refineInstruction(instruction);

  return`title: ${title}
  created: ${date}
  updated: ${date}
  version: 1.0

  ${content}`;

}

// Command 2 - Command to populate CLAUDE.md file for session context
const loadSOPCommand = vscode.commands.registerCommand(
  "sopSync.loadSOPIntoClaude",
  async () => {
    await loadSOPIntoClaude();
  }
);

async function loadSOPIntoClaude() {
  const workspace = vscode.workspace.workspaceFolders?.[0];

  if (!workspace) {
    vscode.window.showErrorMessage("No workspace folder open.");
    return;
  }

  const sopPath = vscode.Uri.joinPath(
    workspace.uri,
    ".sopsync",
    "workflows"
  );

  try {
    const entries = await vscode.workspace.fs.readDirectory(sopPath);

    const mdFiles = entries.filter(([name, type]) =>
      name.endsWith(".md")
    );

    if (mdFiles.length === 0) {
      vscode.window.showInformationMessage("No SOP files found.");
      return;
    }

    let compiledContent = "# Project SOP Context\n\n";

    for (const [fileName] of mdFiles) {
      const fileUri = vscode.Uri.joinPath(sopPath, fileName);
      const fileData = await vscode.workspace.fs.readFile(fileUri);
      const fileContent = Buffer.from(fileData).toString("utf8");

      compiledContent += `\n\n## ${fileName.replace(".md", "")}\n\n`;
      compiledContent += fileContent;
      compiledContent += "\n\n---\n";
    }

    await updateClaudeFile(workspace.uri, compiledContent);

    vscode.window.showInformationMessage(
      "SOPs successfully loaded into .claude.md"
    );
  } catch (err) {
    vscode.window.showErrorMessage(
      "SOP folder not found. Ensure .sopsync/sop exists."
    );
  }
}


async function updateClaudeFile(
  workspaceUri: vscode.Uri,
  generatedContent: string
) {
  const claudeUri = vscode.Uri.joinPath(workspaceUri, ".claude/CLAUDE.md");

  const START_MARKER = "<!-- SOPSYNC_START -->";
  const END_MARKER = "<!-- SOPSYNC_END -->";

  let existingContent = "";

  try {
    const data = await vscode.workspace.fs.readFile(claudeUri);
    existingContent = Buffer.from(data).toString("utf8");
  } catch {
    // File doesn't exist — we'll create it
  }

  const injectionBlock = `
${START_MARKER}
${generatedContent}
${END_MARKER}
`;

  let finalContent;

  if (
    existingContent.includes(START_MARKER) &&
    existingContent.includes(END_MARKER)
  ) {
    // Replace existing SopSync section
    const regex = new RegExp(
      `${START_MARKER}[\\s\\S]*?${END_MARKER}`,
      "g"
    );
    finalContent = existingContent.replace(regex, injectionBlock);
  } else {
    // Append section
    finalContent = existingContent + "\n\n" + injectionBlock;
  }

  await vscode.workspace.fs.writeFile(
    claudeUri,
    Buffer.from(finalContent)
  );
}


export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;
  context.subscriptions.push(saveCommand);
  context.subscriptions.push(loadSOPCommand);
}

export function deactivate() {}
