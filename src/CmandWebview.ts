import * as vscode from 'vscode';

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

        return `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="${styleUri}" rel="stylesheet">
      <link href="${codiconsUri}" rel="stylesheet" />
    </head>
    <script>
      function toggleFolder(element) {
        element.classList.toggle('collapsed');
        const content = element.nextElementSibling;
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      }
    </script>
    <body>
      <div class="button-container">
        ${this._createButton('打开项目', 'folder-opened')}
        ${this._createButton('创建新项目', 'new-folder')}
        ${this._createButton('构建', 'gear')}
        ${this._createButton('调试', 'debug-alt')}
        ${this._createButton('配置', 'settings-gear')}
      </div>
      <div class="folder-list">
      ${[
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
        // ... 其他文件夹数据类似 ...
      ].map(folder => `
        <div class="folder-container">
          <div class="folder-header" onclick="toggleFolder(this)">
            <span class="codicon codicon-chevron-right"></span>
            <span class="folder-name">📁 ${folder.name} (${folder.version})</span>
            <div class="folder-actions">
              <button class="icon-button" data-folder="${folder.name}" data-action="add">
                <span class="codicon codicon-plus"></span>
              </button>
              <button class="icon-button" data-folder="${folder.name}" data-action="settings">
                <span class="codicon codicon-gear"></span>
              </button>
            </div>
          </div>
          <div class="folder-content">
            ${folder.items.map(item => `
              <div class="extension-item">
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
          </div>
        </div>
      `).join('')}
    </div>
    </body>
    </html>`;
    }

    private _createButton(label: string, icon: string): string {
        return `
    <button class="cmd-button" data-action="${label}">
      <span class="codicon codicon-${icon}"></span>
      <span>${label}</span>
    </button>`;
    }
}
