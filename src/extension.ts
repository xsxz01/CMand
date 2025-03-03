import * as vscode from 'vscode';
import { CmandWebview } from './CmandWebview';
import { initializeCommandMapping } from './cmds/CommandMapping';
import { ConfigManager } from './ConfigManager';
import { ConfigValidator } from './utils/ConfigValidator';
import { InitializePanel } from './panels/InitializePanel';
import { pinyin } from 'pinyin-pro';
import { keywords as ChineseKeyword } from './config/constant';
import type { PinyinMapping } from './config/pinyin-mappings';

// 中文关键词列表


const pinyinCache = new Map(ChineseKeyword.map(word => [
  word, 
  pinyin(word, { pattern: 'first', toneType: 'none', type: 'array' }).join('')
]));

// 添加拼音补全提供器
const pinyinProvider = vscode.languages.registerCompletionItemProvider('cm', {
  provideCompletionItems(document, position) {
    const pinyinMap: PinyinMapping[] = require('./config/pinyin-mappings').pinyinMappings;
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
    const linePrefix = document.getText(new vscode.Range(
      position.line, 0,
      position.line, position.character
    ));
    
    // 修正1：精确获取输入内容
    const inputMatch = linePrefix.match(/([a-zA-Z]+|[\u4e00-\u9fa5])$/);
    const input = inputMatch ? inputMatch[0] : '';
    const isPinyinInput = /^[a-z]+$/i.test(input);
    const searchKey = input.toLowerCase();

    return ChineseKeyword.map(word => {
      // 修正2：使用预生成的拼音缓存
      const pyAbbr = pinyinCache.get(word) || '';
      
      // 修正3：精确匹配逻辑
      let match = false;
      if (isPinyinInput) {
        match = pyAbbr.startsWith(searchKey);
      } else {
        match = word.startsWith(searchKey);
      }
      
      // 无输入时返回所有项
      if (!input) {match = true;}

      if (!match) {return null;}

      // 修正4：正确的CompletionItem构造方式
      const completion = new vscode.CompletionItem(word);
      completion.insertText = word;
      completion.filterText = pyAbbr;
      completion.sortText = pyAbbr;
      completion.documentation = `中文关键字（拼音：${pyAbbr}）→ ${word}`;
      completion.kind = vscode.CompletionItemKind.Keyword;
      
      // 在右侧显示拼音提示
      completion.label = {
        label: word,
        description: `[${pyAbbr}]`
      };
      
      return completion;
    }).filter((item): item is vscode.CompletionItem => item !== null);
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
