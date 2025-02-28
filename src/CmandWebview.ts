import * as vscode from 'vscode';
import * as fs from 'fs';

export class CmandWebview implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private _context: vscode.ExtensionContext) { }

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._context.extensionUri]
    };

    webviewView.webview.html = this._getHtmlContent(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'executeCommand':
          vscode.commands.executeCommand(`cmand.${message.action}`);
          break;
        case 'buttonClick':
          vscode.commands.executeCommand(`cmand.${message.action}`);
          break;
      }
    });
  }

  private _getHtmlContent(webview: vscode.Webview): string {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'media', 'styles.css')
    );
    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css')
    );

    // 从外部文件加载基础HTML模板
    const htmlPath = vscode.Uri.joinPath(this._context.extensionUri, 'media', 'cmand-webview.html');
    let htmlContent = fs.readFileSync(htmlPath.fsPath, 'utf-8');

    // 替换模板变量
    return htmlContent
      .replace('${STYLE_URI}', styleUri.toString())
      .replace('${CODICONS_URI}', codiconsUri.toString())
      .replace('${BUTTONS}', this._createButtonSection())
      .replace('${FOLDER_LIST}', this._createFolderList());
  }
  private _createButtonSection(): string {
    return [
      this._createButton('打开项目', 'folder-opened'),
      this._createButton('创建新项目', 'new-folder'),
      this._createButton('构建', 'gear'),
      this._createButton('调试', 'debug-alt'),
      this._createButton('配置', 'settings-gear')
    ].join('\n');
  }

  private _createFolderItem(folder: any): string {
    return `
    <div class="folder-container">
      <div class="folder-header" onclick="toggleFolder(this)">
        <span class="codicon codicon-chevron-right"></span>
        <span class="folder-name">📁 ${folder.name} (${folder.version})</span>
        ${this._createFolderActions(folder)}
      </div>
      ${this._createFolderContent(folder)}
    </div>`;
  }
  private _createFolderList(): string {
    return [
      // 标准库
      {
        name: '标准库',
        version: 'v1.2.3',
        items: [
          { name: '标准IO库', version: '1.2.3', author: 'CMand官方', description: '基础输入输出支持库', status: '已安装' },
          { name: '数学库', version: '2.1.0', author: 'CMand团队', description: '高级数学运算支持', status: '可更新' }
        ]
      },
      // 支持库
      {
        name: '支持库',
        version: 'v4.5.6',
        items: [
          { name: '网络库', version: '3.0.1', author: '网络组', description: 'TCP/UDP协议支持', status: '已安装' },
          { name: '图形库', version: '2.4.0', author: '图形组', description: 'OpenGL图形接口', status: '未安装' }
        ]
      },
      // 模块
      {
        name: '模块',
        version: 'v7.8.9',
        items: [
          { name: 'AI模块', version: '1.0.0', author: 'AI实验室', description: '机器学习算法集成', status: '可更新' },
          { name: '物联网模块', version: '1.2.3', author: 'IoT组', description: 'MQTT协议支持', status: '已安装' }
        ]
      }
    ].map(folder => this._createFolderItem(folder)).join('');
  }

  // 新增文件夹操作按钮生成方法
  private _createFolderActions(folder: any): string {
    return `
  <div class="folder-actions">
      <button class="icon-button" data-folder="${folder.name}" data-action="add">
          <span class="codicon codicon-plus"></span>
      </button>
      <button class="icon-button" data-folder="${folder.name}" data-action="settings">
          <span class="codicon codicon-gear"></span>
      </button>
  </div>`;
  }

  // 新增文件夹内容生成方法
  private _createFolderContent(folder: any): string {
    return `
  <div class="folder-content">
      ${folder.items.map((item: any) => `
          <div class="extension-item">
              <!-- 补充扩展信息部分 -->
              <div class="extension-info">
                  <span class="codicon codicon-extensions"></span>
                  <div class="extension-meta">
                      <div class="extension-title">
                          <span>${item.name}</span>
                          <span class="extension-version">${item.version}</span>
                      </div>
                      <div class="extension-author">${item.author}</div>
                      <div class="extension-desc">${item.description}</div>
                  </div>
              </div>
              <div class="extension-actions">
                  <span class="status-label ${item.status === '已安装' ? 'installed' : 'update'}">
                      ${item.status}
                  </span>
                  <button class="icon-button" data-action="settings">
                      <span class="codicon codicon-gear"></span>
                  </button>
                  <button class="icon-button" data-action="remove">
                      <span class="codicon codicon-trash"></span>
                  </button>
              </div>
          </div>
      `).join('')}
  </div>`;
  }

  private _createButton(label: string, icon: string): string {
    return `
  <button class="cmd-button" data-action="${label.toLowerCase().replace(' ', '-')}">
    <span class="codicon codicon-${icon}"></span>
    <span>${label}</span>
  </button>`;
  }
}
