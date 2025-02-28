import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class CreateProjectPanel {
    private static currentPanel: CreateProjectPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
        this._panel = panel;
        this._panel.webview.options = {
            enableScripts: true,
            localResourceRoots: [context.extensionUri]
        };
        this._panel.webview.html = this._getWebviewContent(context);

        this._setupWebviewHooks(context);
    }

    private _getWebviewContent(context: vscode.ExtensionContext): string {
        const templatePath = path.join(context.extensionPath, 'media', 'create-project.html');
        let html = fs.readFileSync(templatePath, 'utf-8');

        const cssUri = this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(context.extensionUri, 'media', 'webview.css')
        );

        return html.replace('${STYLE_URI}', cssUri.toString());
    }

    private _setupWebviewHooks(context: vscode.ExtensionContext) {
        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                // 在 _setupWebviewHooks 方法中添加：
                switch (message.command) {
                    case 'selectDirectory':
                        this._handleDirectorySelection();
                        break;
                    case 'createProject':
                        await this._handleProjectCreation(message.data);
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async _handleProjectCreation(data: any) {
        try {
            const projectPath = await this._validateAndGetPath(data.name);
            await this._createProjectStructure(projectPath, data.template);
            vscode.window.showInformationMessage(`项目 ${data.name} 创建成功`, {
                modal: true
            });
            this._panel.dispose();
            vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(projectPath));
        } catch (error: Error | any) {
            vscode.window.showErrorMessage(error.message, { modal: true });
        }
    }

    private async _validateAndGetPath(data: any): Promise<string> {
        // 合并名称验证和路径验证
        if (!/^[a-zA-Z0-9_-]+$/.test(data.name)) {
            throw new Error('项目名称只能包含字母、数字、下划线和连字符');
        }

        if (!data.path) {
            throw new Error('请选择项目位置');
        }

        const projectPath = path.join(data.path, data.name);
        if (fs.existsSync(projectPath)) {
            throw new Error('目录已存在，请使用其他名称');
        }

        return projectPath;
    }

    private async _createProjectStructure(path: string, template: string) {
        // 创建目录结构
        fs.mkdirSync(path);
        fs.mkdirSync(path + '/src');

        // 创建package.json
        const packageJson = {
            name: path.split('/').pop(),
            version: "0.1.0",
            dependencies: {},
            cmand: {
                template: template
            }
        };

        fs.writeFileSync(
            path + '/package.json',
            JSON.stringify(packageJson, null, 2)
        );

        // 根据模板创建示例文件
        const exampleFile = `// ${packageJson.name} 项目已就绪\nconsole.log("Hello CMand!");`;
        fs.writeFileSync(path + `/src/main.cm`, exampleFile);
    }

    public static createOrShow(context: vscode.ExtensionContext) {
        if (CreateProjectPanel.currentPanel) {
            CreateProjectPanel.currentPanel._panel.reveal();
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'cmandCreateProject',
            '新建CMand项目',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        CreateProjectPanel.currentPanel = new CreateProjectPanel(panel, context);
    }

    public dispose() {
        CreateProjectPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {disposable.dispose();}
        }
    }

    // 添加新的处理方法 ▼
    private async _handleDirectorySelection() {
        const uri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: '选择项目位置'
        });

        if (uri && uri[0]) {
            this._panel.webview.postMessage({
                command: 'selectedDirectory',
                path: uri[0].fsPath
            });
        }
    }
}