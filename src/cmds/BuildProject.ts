import * as vscode from 'vscode';
import * as fs from 'fs';
import { exec } from 'child_process';
import { ConfigManager } from '../ConfigManager';

export async function buildProject() {
    const outputChannel = vscode.window.createOutputChannel('GMC程序输出');
    outputChannel.show();
    outputChannel.appendLine('开始编译...');
    // 暂时使用硬编码的编译参数
    let compilerPath = ConfigManager.getConfig<string>('compilerPath');
    // 拼接编译路径
    compilerPath = `${compilerPath}\\gmc.exe`;
    // 获取当前活动编辑器文件路径
    const filePath = vscode.window.activeTextEditor?.document.fileName;
    if (!filePath) {
        vscode.window.showErrorMessage('No active document found');
        return;
    }
    // 取到文件名
    const fileName = filePath.split('\\')[filePath.split('\\').length - 1];
    // 使用VScode API取到工作区目录
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder found');
        return;
    }
    // 取到工作区目录
    const workspaceFolder = workspaceFolders[0];
    const projectPath = workspaceFolder.uri.fsPath;
    // 设置工作路径
    process.chdir(projectPath);
    outputChannel.appendLine(`工作路径: ${projectPath}`);
    outputChannel.appendLine(`文件名: ${fileName}`);
    outputChannel.appendLine(`正在读取项目配置文件...`);
    // 读取项目配置文件package.json
    const packageJsonPath = `${projectPath}\\package.json`;
    if (!fs.existsSync(packageJsonPath)) {
        vscode.window.showErrorMessage('未找到项目配置文件package.json');
        return;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    // 读取一些必要的基础配置
    const { main } = packageJson;
    // 拼接link
    let linkParam = '';
    const linkCOnfig = packageJson.link = packageJson.link || {};
    // 发布版打包
    const packageRelease = linkCOnfig.packageRelease === "on";
    if (packageRelease) {
        linkParam += '-r ';
    }
    // 可执行文件瘦身
    const executableSlim = linkCOnfig.executableSlim === "on";
    if (executableSlim) {
        linkParam += '-s ';
    }
    // 可执行文件压缩
    const executableCompress = linkCOnfig.executableCompress === "on";
    if (executableCompress) {
        linkParam += '-u ';
    }
    // 最大压缩
    const maxCompression = linkCOnfig.maxCompression === "on";
    if (maxCompression) {
        linkParam += '-u9 ';
    }
    // 链接库
    const linkedLibraries = linkCOnfig.linkedLibraries;
    if (linkedLibraries) {
        linkParam += '-l ';
        linkParam += linkedLibraries.join(' ');
    }
    // 拼接编译选项
    const buildConfig = packageJson.build || {};
    let buildParam = '';
    const { buildDir, outputFileName, optimizationLevel, cppStandard, architecture, projectType } = buildConfig;
    const projectCompiler = buildConfig.projectCompiler;
    // if projectCompiler is not empty, use plugin setting of compilerPath
    if (projectCompiler) {
        compilerPath = `${projectCompiler}\\gmc.exe`;
    }
    if (!compilerPath) {
        vscode.window.showErrorMessage('未配置编译器路径');
        return;
    }
    // 输出文件夹 = 项目文件夹 + buildDir
    const outputDir = buildDir ? `${projectPath}\\${buildDir}` : `${projectPath}\\build`;
    // 判断文件夹是否存在
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }
    // 优化等级
    if (optimizationLevel) {
        buildParam += `-O ${optimizationLevel} `;
    }
    // C++标准
    if (cppStandard) {
        if (cppStandard === 'c++11') {
            buildParam += `-std 11 `;
        } else if (cppStandard === 'c++14') {
            buildParam += `-std 14 `;
        } else if (cppStandard === 'c++17') {
            buildParam += `-std 17 `;
        } else if (cppStandard === 'c++20') {
            buildParam += `-std 20 `;
        }
    }
    // 架构
    if (architecture) {
        if (architecture === 'x86') {
            buildParam += `-m 32 `;
        } else if (architecture === 'x86_64') {
            buildParam += `-m 64 `;
        }
    }
    // 项目类型
    if (!projectType) {
        // show error message
        vscode.window.showErrorMessage('未配置项目类型');
        return;
    }
    if (projectType === 'nasm') {
        buildParam += `-a `;
    } else if (projectType === 'static') {
        buildParam += `-c `;
    } else if (projectType === 'executable') {
        buildParam += `-e `;
    } else if (projectType === 'shared') {
        buildParam += `-d `;
    } else if (projectType === 'win32') {
        buildParam += `-w `;
    }
    // 输出文件名
    buildParam += `-o ${buildDir}/${outputFileName} `;

    const command = `${compilerPath} ${linkParam} ${buildParam} ${main}`;
    try {
        // 设置工作路径
        process.chdir(projectPath);
        // 显示编译命令
        console.log(command);
        // 执行编译命令
        exec(command, (error, stdout, stderr) => {
            if (error) {
                vscode.window.showErrorMessage(`编译失败: ${error.message}`);
                outputChannel.appendLine(stderr);
                return;
            }
            if (stderr) {
                vscode.window.showWarningMessage(`编译警告: ${stderr}`);
                outputChannel.appendLine(stderr);
            }

            // 然后执行该文件，并且将程序输出指定到vscode的输出窗口
            outputChannel.appendLine(stdout);
            // 显示编译成功
            vscode.window.showInformationMessage('编译成功');
            // 切换到输出目录
            process.chdir(outputDir);
            // 执行该文件
            const execCommand = `${outputFileName}`;
            // const execCommand = `cmd.exe`;
            // 判断文件是否存在
            if (!fs.existsSync(execCommand)) {
                vscode.window.showErrorMessage('项目生成失败，未找到可执行文件');
                outputChannel.appendLine(`项目生成失败，未找到可执行文件: ${execCommand}`);
                return;
            }
            // 创建伪终端
            const writeEmitter = new vscode.EventEmitter<string>();
            const pty: vscode.Pseudoterminal = {
                onDidWrite: writeEmitter.event,
                open: () => {
                    writeEmitter.fire('开始执行程序...\r\n');
                    // 在终端打开后执行程序
                    const { spawn } = require('child_process');
                    // 在spawn之前添加路径验证
                    outputChannel.appendLine(`执行路径: ${outputDir}\\${execCommand}`);
                    if (!fs.existsSync(`${outputDir}/${execCommand}`)) {
                        writeEmitter.fire(`\r\n错误: 可执行文件不存在\r\n`);
                        return;
                    }
                    const child = spawn('cmd.exe', ['/c', 'start', '/wait', 'cmd.exe', '/c', execCommand], {  // 改为通过cmd执行
                        cwd: outputDir,
                        windowsVerbatimArguments: true,
                        stdio: ['ignore', 'pipe', 'pipe'],
                        shell: false
                    });

                    // 添加错误事件监听
                    child.on('error', (err: { message: any; }) => {
                        const errMsg = `\r\n[进程错误] ${err.message}\r\n`;
                        writeEmitter.fire(errMsg);
                        outputChannel.append(errMsg);
                    });

                    // 添加关闭事件监听
                    child.on('close', (code: any) => {
                        const endMsg = `\r\n进程已退出，代码 ${code}\r\n`;
                        writeEmitter.fire(endMsg);
                        outputChannel.append(endMsg);
                    });

                    child.stdout.on('data', (data: Buffer) => {  // 使用Buffer类型
                        const rawOutput = data.toString('utf8');
                        // 添加ANSI转义字符处理
                        const formatted = rawOutput
                            .replace(/\n/g, '\r\n')
                            .replace(/(\r\n|\r|\n)/g, '\r\n');
                        writeEmitter.fire(`\r\n${formatted}`);
                        outputChannel.append(formatted);
                    });
                    writeEmitter.fire('\r\n程序执行完毕，按任意键退出...\r\n');

                },
                close: () => writeEmitter.dispose(),
                handleInput: (data: string) => {
                    // 允许任意键退出
                    terminal.dispose();
                }
            };

            const terminal = vscode.window.createTerminal({
                name: 'GMC程序输出',
                pty
            });
            terminal.show();
        });
    } catch (err) {
        vscode.window.showErrorMessage(`编译异常: ${err}`);
    }
}
