import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export async function openProject() {
    const folderUri = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: '选择项目文件夹'
    });

    if (!folderUri || folderUri.length === 0) {
        return;
    }

    const projectPath = folderUri[0].fsPath;
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
        await vscode.commands.executeCommand('vscode.openFolder', folderUri[0], false);
    } else {
        vscode.window.showWarningMessage(
            '该文件夹不是有效的CMand项目（未找到package.json）',
            { modal: true }
        );
    }
}
