import * as vscode from 'vscode';
import { CmandWebview } from './CmandWebview';
import { initializeCommandMapping, registerAllCommands } from './cmds/CommandMapping';
import { ConfigManager } from './ConfigManager';
import { ConfigValidator } from './utils/ConfigValidator';
import { InitializePanel } from './panels/InitializePanel';

export function activate(context: vscode.ExtensionContext) {
  // 初始化配置
  const userAccount = ConfigManager.getConfig<string>('userAccount');

  // 验证编译器路径
  const compilerPath = ConfigManager.getConfig<string>('compilerPath');
  if (compilerPath && !ConfigValidator.validateCompilerPath(compilerPath)) {
    vscode.window.showErrorMessage(
      `编译器路径 ${compilerPath} 无效，未找到 gmc.exe`
    );
  }
  // 如果没有配置，显示初始化面板
  if (!userAccount || !compilerPath) {
    InitializePanel.show(context);
  }

  // 注册密码设置命令
  context.subscriptions.push(
    vscode.commands.registerCommand('cmand.setPassword', async () => {
      const password = await vscode.window.showInputBox({
        password: true,
        placeHolder: '输入登录密码...'
      });
      if (password) {
        await vscode.workspace.getConfiguration('cmand')
          .update('password', password, true);
      }
    })
  );
  // 注册Webview视图
  const webviewProvider = new CmandWebview(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('cmand.webview', webviewProvider)
  );

  // 注册命令
  initializeCommandMapping(context);
}

export function deactivate() { }
