import * as vscode from 'vscode';
import { CmandWebview } from './CmandWebview';

export function activate(context: vscode.ExtensionContext) {
  // 注册Webview视图
  const webviewProvider = new CmandWebview(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('cmand.webview', webviewProvider)
  );

  // 注册命令
  const commands = ['打开项目', '创建新项目', '构建', '调试', '配置'];
  commands.forEach(command => {
    context.subscriptions.push(
      vscode.commands.registerCommand(`cmand.${command}`, () => {
        vscode.window.showInformationMessage(`执行操作: ${command}`);
      })
    );
  });
}

export function deactivate() {}
