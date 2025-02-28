import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class InitializePanel {
    private static currentPanel: InitializePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;

    private constructor(context: vscode.ExtensionContext) {
        this._panel = vscode.window.createWebviewPanel(
            'cmandInitialize',
            'CMand 初始化向导',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'node_modules', '@vscode/codicons', 'dist'))
                ]
            }
        );

        // 添加面板关闭时的清理逻辑
        this._panel.onDidDispose(() => {
            InitializePanel.currentPanel = undefined;
        });

        // 加载模板文件
        const diskPath = vscode.Uri.file(
            path.join(context.extensionPath, 'media', 'initialize-panel.html')
        );
        const htmlContent = fs.readFileSync(diskPath.fsPath, 'utf-8');

        // 生成正确的codicon CSS路径
        const codiconCssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri,
                'node_modules',
                '@vscode/codicons',
                'dist',
                'codicon.css'  // 添加具体的CSS文件名
            )
        );

        // 替换占位符
        const finalHtml = htmlContent
            .replace(/\${WEBVIEW_URI}/g, codiconCssUri.toString())
            .replace('</head>',
                `<link rel="stylesheet" href="${codiconCssUri}"></head>`);

        this._panel.webview.html = finalHtml;

        this.setupMessageHandlers(context);
    }

    private setupMessageHandlers(context: vscode.ExtensionContext) {
        this._panel.webview.onDidReceiveMessage(async message => {
            console.log(message);
            switch (message.type) {
                case 'SUBMIT_LOGIN':
                    await this.handleLogin(message.data);
                    break;
                case 'SELECT_COMPILER': {
                    const result = await this.handleCompilerBrowse();
                    this._panel.webview.postMessage({
                        type: 'SELECT_COMPILER_RESULT',
                        valid: result
                    });
                    break;
                }
                case 'CLOSE_WEBVIEW':
                    // 仅在用户主动点击关闭按钮时销毁面板
                    if (message.source === 'user-action') {
                        this._panel.dispose();
                        InitializePanel.currentPanel = undefined;
                    }
                    break;
                case 'SELECT_COMPILER_RESULT':
                    if (message.valid) {
                        this.navigateToStep(3);
                    } else {
                        this._panel.webview.postMessage({
                            type: 'SHOW_ERROR',
                            message: '目录中未找到 gmc.exe，请重新选择'
                        });
                        this.navigateToStep(2); // 保持停留在步骤2
                    }
                    break;
            }
        });
    }

    private async handleCompilerBrowse(): Promise<boolean> {
        const options: vscode.OpenDialogOptions = {
            canSelectFolders: true,
            canSelectFiles: false,
            title: '选择编译器目录'
        };

        const selected = await vscode.window.showOpenDialog(options);
        if (!selected || selected.length === 0) { return false; }

        const compilerPath = path.join(selected[0].fsPath, 'gmc.exe');
        const valid = fs.existsSync(compilerPath);
        
        if (!valid) {
            return false;
        }

        await vscode.workspace.getConfiguration('cmand')
            .update('compilerPath', selected[0].fsPath, true);
            
        return true;
    }

    private async handleLogin(data: any) {
        // 保存账号密码
        await vscode.workspace.getConfiguration('cmand').update('userAccount', data.username, true);
        await vscode.workspace.getConfiguration('cmand').update('password', data.password, true);

        // 检查环境变量
        const hasGmcHome = !!process.env.GMC_HOME;
        this._panel.webview.postMessage({
            type: 'NAVIGATE',
            step: hasGmcHome ? 3 : 2
        });
    }

    private navigateToStep(step: number) {
        this._panel.webview.postMessage({
            type: 'NAVIGATE',
            step: step
        });
    }

    private async handleCompilerSelection(data: any) {
        if (data.action === 'download') {
            // 模拟下载进度
            this._panel.webview.postMessage({ type: 'DOWNLOAD_PROGRESS', progress: 0 });
            // ...模拟下载逻辑...
        } else {
            await vscode.workspace.getConfiguration('cmand')
                .update('compilerPath', data.path, true);
        }
    }

    static show(context: vscode.ExtensionContext) {
        if (!this.currentPanel) {
            this.currentPanel = new InitializePanel(context);
        }
        return this.currentPanel._panel;
    }
}
