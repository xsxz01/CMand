import * as vscode from 'vscode';
import { CmandWebview } from './CmandWebview';
import { initializeCommandMapping } from './cmds/CommandMapping';
import { ConfigManager } from './ConfigManager';
import { ConfigValidator } from './utils/ConfigValidator';
import { InitializePanel } from './panels/InitializePanel';

// 添加拼音补全提供器
const pinyinProvider = vscode.languages.registerCompletionItemProvider('cm', {
  provideCompletionItems(document, position) {
    const pinyinMap = [
      { py: 'rg', word: '如果', snippet: '如果 ($1) {\n\t$2\n}' },
      { py: 'hs', word: '函数', snippet: '函数 ${1:函数名}($2) {\n\t$3\n}' },
      { py: 'xh', word: '循环', snippet: '循环 ($1) {\n\t$2\n}' },
      { py: 'fz', word: '否则', snippet: '否则 {\n\t$1\n}' },
      { py: 'zl', word: '整型', snippet: '整型 $1 = $2' },
      { py: 'fd', word: '浮点', snippet: '浮点 $1 = $2' }
    ];
    // 获取光标前的连续字母（支持大小写）
    const linePrefix = document.getText(new vscode.Range(
      position.line, 0,
      position.line, position.character
    ));
    const inputPinyin = linePrefix.match(/[a-zA-Z]+$/)?.[0]?.toLowerCase() || '';

    return pinyinMap.filter(item => 
      item.py.startsWith(inputPinyin)
    ).map(item => {
      const completion = new vscode.CompletionItem({
        label: item.word,
        description: `[${item.py}]`  // 在右侧显示对应拼音
      });
      completion.filterText = item.py; // 关键修复：设置拼音匹配字段
      completion.insertText = new vscode.SnippetString(item.snippet);
      completion.documentation = `结构化代码模板：${item.word}`;
      completion.detail = '中文代码块';
      
      // 添加额外的关键字补全项
      if (item.py === 'rg') {
        const keywordCompletion = new vscode.CompletionItem(item.word);
        keywordCompletion.insertText = item.word;
        keywordCompletion.documentation = `中文关键字 → ${item.word}`;
        keywordCompletion.detail = '中文关键字';
        return [completion, keywordCompletion];
      }
      return completion;
    }).flat();
  }
}, ''); // 保留空触发字符

// 添加中文关键词补全提供器
const chineseKeywordsProvider = vscode.languages.registerCompletionItemProvider('cm', {
  provideCompletionItems(document, position) {
    // 中文关键词列表
    const keywords = [
      '如果', '否则', '函数', '循环', '返回',
      '整型', '浮点', '字符串', '布尔', '新建',
      '导入', '导出', '当', '继续', '跳出'
    ];

    return keywords.map(word => {
      const completion = new vscode.CompletionItem(word);
      completion.documentation = `中文关键字 → ${word}`;
      completion.kind = vscode.CompletionItemKind.Keyword;
      return completion;
    });
  }
}, '');


export function activate(context: vscode.ExtensionContext) {
  // 注册中文关键词补全提供器
  context.subscriptions.push(pinyinProvider, chineseKeywordsProvider);

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
