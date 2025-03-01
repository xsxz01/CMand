import * as vscode from 'vscode';
import { exec } from 'child_process';
import { ConfigManager } from '../ConfigManager';

export async function buildProject() {
    // 暂时使用硬编码的编译参数
    const compilerPath = ConfigManager.getConfig<string>('compilerPath');
    if (!compilerPath) {
        vscode.window.showErrorMessage('未配置编译器路径');
        return;
    }
    
    // 获取当前活动编辑器文件路径
    const filePath = vscode.window.activeTextEditor?.document.fileName;
    if (!filePath) {
        vscode.window.showErrorMessage('No active document found');
        return;
    }
    // 取到文件名
    const fileName = filePath.split('\\')[filePath.split('\\').length - 1];
    const projectPath = filePath.split('\\').slice(0, -1).join('\\');
    // 组装编译参数[测试]
    const compileOptions = `-o target\\release\\${fileName.replace('.cm', '.exe')}`;

    // 构建完整命令
    const command = `cd ${projectPath}\\..\ && ${compilerPath}\\gmc.exe ${compileOptions} src\\${fileName}`;
    try {
        // 执行编译命令
        exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`编译失败: ${error.message}`);
                return;
            }
            if (stderr) {
                vscode.window.showWarningMessage(`编译警告: ${stderr}`);
            }
            vscode.window.showInformationMessage('编译成功');
            console.log(stdout);
        });
    } catch (err) {
        vscode.window.showErrorMessage(`编译异常: ${err}`);
    }
}
