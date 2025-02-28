import * as vscode from 'vscode';
import { CmandWebview } from './CmandWebview';
import { initializeCommandMapping, registerAllCommands } from './cmds/CommandMapping';

export function activate(context: vscode.ExtensionContext) {
  // 注册Webview视图
  const webviewProvider = new CmandWebview(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('cmand.webview', webviewProvider)
  );

  // 注册命令
  initializeCommandMapping(context);
}

export function deactivate() {}
