import * as vscode from 'vscode';

export class ConfigManager {
    static getConfig<T>(key: 'userAccount' | 'compilerPath'): T | undefined {
        return vscode.workspace.getConfiguration('cmand').get<T>(key);
    }

    static async getPassword(): Promise<string | undefined> {
        return vscode.workspace.getConfiguration('cmand').get('password');
    }
}
