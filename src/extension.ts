'use strict';

import * as vscode from 'vscode';

const EXTENSION_PREFIX = '[cleanup-json]';

function log(...args: any[]) {
  if (args.length === 0) {
    console.log();
    return;
  }
  const first = args[0];
  if (typeof first === 'string') {
    args[0] = `${EXTENSION_PREFIX} ${first}`;
  } else {
    args.unshift(EXTENSION_PREFIX);
  }

  console.log.apply(null, args);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    log('extension activated');

    let jsonCleaner = new JSONCleaner();

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.unescapeAndFormatJSON', () => {
        log('starting');
        jsonCleaner.unescapeAndFormatJSON();
        log('finished');
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class JSONCleaner {
  /**
   * Processes escaped JSON input and formats it into readable output
   * Example:
   *   In: {\n  \"asdf\": \"hello\"\n}
   *   Out:
   *   {
   *     "asdf": "hello"
   *   }
   */
  //
  public unescapeAndFormatJSON() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const doc = editor.document;
    const original = doc.getText();
    if (!original) {
      return;
    }

    try {
      const lines = original.split('\n');
      const numLines = lines.length;
      const lastLineLength = lines[numLines - 1].length;

      const unescaped = this.unescape(original);
      const formatted = this.tryFormatJSON(unescaped);
      const edit = new vscode.WorkspaceEdit();

      // Construct start positions (beginning of document)
      const startPosition = new vscode.Position(0, 0);
      const endPosition = new vscode.Position(numLines, lastLineLength);

      edit.replace(
        doc.uri,
        new vscode.Range(startPosition, endPosition),
        formatted
      );

      vscode.workspace.applyEdit(edit)
        .then(
          (value) => value,
          (err) => {
            log(err.message, err.stack);
          }
        )
      ;
    } catch (err) {
        log(err.message, err.stack);
    }
  }

  public unescape(input: string): string {
    return input
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
    ;
  }

  public tryFormatJSON(input: string): string {
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch (e) {
      log('failed to parse input as valid JSON');
      return input;
    }

    return JSON.stringify(parsed, null, 2);
  }
}
