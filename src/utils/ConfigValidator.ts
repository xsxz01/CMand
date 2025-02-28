import * as fs from 'fs';
import * as path from 'path';

export class ConfigValidator {
    static validateCompilerPath(compilerPath: string): boolean {
        try {
            const fullPath = path.join(compilerPath, 'gmc.exe');
            return fs.existsSync(fullPath);
        } catch {
            return false;
        }
    }

    static async validateCredentials(
        username: string, 
        password: string
    ): Promise<boolean> {
        // 这里添加实际的认证逻辑
        return username.length > 0 && password.length >= 8;
    }
}
