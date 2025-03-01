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
        // 检查当前工作区是否存在package.json
        const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        const hasPackageJson = workspacePath ?
            fs.existsSync(path.join(workspacePath, 'package.json')) : false;

        // 处理codicon路径
        const codiconUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'node_modules', '@vscode/codicons', 'dist')
        );

        // 读取模板文件
        const templatePath = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'config-project.html')
        );
        const html = await vscode.workspace.fs.readFile(templatePath);

        // 添加文件检查状态到模板变量

        // 处理CSS路径
        const cssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.css')
        );

        return Buffer.from(html)
            .toString('utf8')
            .replace(/\${WEBVIEW_URI}/g, codiconUri.toString())
            .replace(/\${STYLE_URI}/g, cssUri.toString())
            .replace(/\${HAS_PACKAGE_JSON}/g, hasPackageJson.toString());
    }

    private async setupMessageHandlers() {
        // 处理保存事件
        this._panel.webview.onDidReceiveMessage(
            async message => {
                if (message.type === 'SAVE_CONFIG') {
                    // 首先判断是否是全局配置
                    const isGlobal = !ConfigProjectPanel.isWorkspaceProject();
                    if (isGlobal) {
                       // 报错提示
                       vscode.window.showErrorMessage('只能在项目中保存该配置');
                       return; 
                    }
                    // 保存配置到package.json
                    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (!workspacePath) {
                        // 报错提示
                        vscode.window.showErrorMessage('无法获取工作区路径，只能在项目中保存该配置');
                        return;
                    }
                    const packageJsonPath = path.join(workspacePath, 'package.json');
                    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
                    const packageJsonData = JSON.parse(packageJsonContent);
                    // 更新配置
                    let targetConfig = message.config;
                    let currentConfig = packageJsonData;
                    for (let key in targetConfig) {
                        currentConfig[key] = targetConfig[key];
                    }
                    // 保存配置
                    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJsonData, null, 2));
                    // 提示保存成功
                    vscode.window.showInformationMessage('配置已保存');
                }
                if (message.type === 'REQUEST_CONTEXT') {
                    // 从插件获取当前配置上下文
                    let isGlobal = !ConfigProjectPanel.isWorkspaceProject();
                    const projectName = '测试项目'; // 获取当前项目名
                    this._panel.webview.postMessage({
                        type: 'CONFIG_CONTEXT',
                        isGlobal,
                        projectName
                    });
                }
                if (message.type === 'CHECK_PACKAGE_JSON') {
                    this._panel.webview.postMessage({
                        type: 'PACKAGE_JSON_STATUS',
                        exists: ConfigProjectPanel.isWorkspaceProject()
                    });
                }
                if (message.type === 'REQUEST_CONFIG') {
                    // 将package.json数据发送到Webview
                    // 读取package.json文件
                    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (workspacePath) {
                        const packageJsonPath = path.join(workspacePath, 'package.json');
                        console.log("packageJsonPath", packageJsonPath);
                        const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');
                        const packageJsonData = JSON.parse(packageJsonContent);
                        this._panel.webview.postMessage({
                            type: 'PACKAGE_JSON_DATA',
                            data: packageJsonData
                        });
                    }else{
                       // 提示文件读取失败
                       vscode.window.showErrorMessage('读取package.json失败'); 
                    }
                }
                if (message.type === 'CREATE_PACKAGE_JSON') {
                    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
                    if (workspacePath) {
                        const packageJsonPath = path.join(workspacePath, 'package.json');
                        try {
                            if (!fs.existsSync(packageJsonPath)) {
                                const defaultContent = JSON.stringify({
                                    name: "my-project",
                                    version: "1.0.0",
                                    description: "",
                                    main: "index.js",
                                    scripts: {},
                                    keywords: [],
                                    author: "",
                                    license: "ISC"
                                }, null, 2);

                                fs.writeFileSync(packageJsonPath, defaultContent);
                                vscode.window.showInformationMessage('package.json 创建成功');
                                this._panel.webview.postMessage({
                                    type: 'PACKAGE_CREATED',
                                    success: true
                                });
                            }
                        } catch (error) {
                            vscode.window.showErrorMessage('创建package.json失败: ' + error);
                            this._panel.webview.postMessage({
                                type: 'PACKAGE_CREATED',
                                success: false
                            });
                        }
                    }
                }
                else if (message.type === 'BROWSE_PATH') {
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

    public static isWorkspaceProject(): boolean {
        if (vscode.workspace.workspaceFolders) {
            const workspacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
            const packageJsonPath = path.join(workspacePath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                return true;
            }
        }
        return false;
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
