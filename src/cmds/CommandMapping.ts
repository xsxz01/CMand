// 定义命令映射
import * as vscode from 'vscode';
import { openProject } from './OpenProject';
import { CreateProjectPanel } from '../panels/CreateProjectPanel';
export const CommandMapping: Map<string, Function> = new Map();

// 初始化命令映射
export function initializeCommandMapping(context: vscode.ExtensionContext) {
    registerCommand('cmand.打开项目', () => openProject());
    registerCommand('cmand.创建新项目', () => CreateProjectPanel.createOrShow(context));
    registerCommand('cmand.构建', () => {
        vscode.window.showInformationMessage(`执行操作: 构建`);
    });
    registerCommand('cmand.调试', () => {
        vscode.window.showInformationMessage(`执行操作: 调试`);
    });
    registerCommand('cmand.配置', () => {
        vscode.window.showInformationMessage(`执行操作: 配置`);
    });
    registerAllCommands(context);
}

// 注册命令
export function registerCommand(command: string, callback: Function) {
    CommandMapping.set(command, callback);
}

// 注册全部命令
export function registerAllCommands(context: vscode.ExtensionContext) {
    CommandMapping.forEach((callback, command) => {
        context.subscriptions.push(vscode.commands.registerCommand(command, () => callback()));
    });
}