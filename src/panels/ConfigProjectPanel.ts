import * as vscode from 'vscode';
import * as path from 'path';
// import { ConfigurationManager } from '../services/ConfigurationManager';
import * as fs from 'fs';

export class ConfigProjectPanel {
    private static instance: ConfigProjectPanel | null = null;
    private _panel: vscode.WebviewPanel;
    private disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [context.extensionUri]
        };
        this.initializeWebview(context);
    }

    private async initializeWebview(context: vscode.ExtensionContext) {
        // 替换为异步模板加载
        this._panel.webview.html = await this.getWebviewContent(context);
        this.setupMessageHandlers();
    }

    private async getWebviewContent(context: vscode.ExtensionContext): Promise<string> {
        // 处理codicon路径
        const codiconUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode/codicons', 'dist')
        );

        // 读取模板文件
        const templatePath = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'config-project.html')
        );
        const html = await vscode.workspace.fs.readFile(templatePath);

        // 处理CSS路径
        const cssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.css')
        );

        return Buffer.from(html)
            .toString('utf8')
            .replace(/\${WEBVIEW_URI}/g, codiconUri.toString())
            .replace(/\${STYLE_URI}/g, cssUri.toString());
    }

    private async setupMessageHandlers() {
        // 处理保存事件
        this._panel.webview.onDidReceiveMessage(
            async message => {
                if (message.type === 'SAVE_CONFIG') {
                    // ConfigurationManager.saveConfig(message.data);
                    vscode.window.showInformationMessage('配置已保存');
                }
                if (message.type === 'REQUEST_CONTEXT') {
                    // 从插件获取当前配置上下文
                    const isGlobal = true; // 根据实际逻辑判断
                    const projectName = '测试项目'; // 获取当前项目名
                    this._panel.webview.postMessage({
                        type: 'CONFIG_CONTEXT',
                        isGlobal,
                        projectName
                    });
                }
                if (message.type === 'BROWSE_PATH') {
                    const options: vscode.OpenDialogOptions = {
                        canSelectMany: false,
                        canSelectFolders: message.isDirectory,
                        canSelectFiles: !message.isDirectory
                    };

                    const uri = await vscode.window.showOpenDialog(options);
                    if (uri && uri[0]) {
                        this._panel.webview.postMessage({
                            type: 'BROWSE_RESULT',
                            target: message.target,
                            path: uri[0].fsPath
                        });
                    }
                }

            },
            null,
            this.disposables
        );
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        if (ConfigProjectPanel.instance) {
            ConfigProjectPanel.instance._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'configPanel',
            '项目配置',
            vscode.ViewColumn.Active, // 修改为当前活动编辑器组
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'src', 'templates'))
                ]
            }
        );

        ConfigProjectPanel.instance = new ConfigProjectPanel(panel, context);
        panel.onDidDispose(() => {
            // 清理工作
            ConfigProjectPanel.instance!.disposables.forEach(d => d.dispose()); // 释放所有订阅
            ConfigProjectPanel.instance = null; // 清除单例实例
        });
    }
}