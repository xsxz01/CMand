export type PinyinMapping = {
    py: string;
    word: string;
    snippet: string;
    /** 新增可选的排序权重 */
    priority?: number;
    /** 新增可选的关联关键字 */
    relatedKeywords?: string[];
};

export const pinyinMappings: PinyinMapping[] = [
    {
        py: 'l',
        word: '类',
        snippet: '类 ${1:类名} {\n\t$2\n}',
    },
    {
        py: 'zcx',
        word: '主函数',
        snippet: '类 主程序\n {\n\t公有 静态 整数 _启动子程序(文本数组 命令行){\n\t\t${1:代码}\n\t}\n}',
        priority: 1
    },
    {
        py: 'tjpd',
        word: '条件判断',
        snippet: '条件判断 (${1:条件}) {\n\t分支 ${2:条件}:\n\t\t跳出循环\n}',
        priority: 1
    },
    {
        py: 'qtj',
        word: '取体积',
        snippet: '取体积 (${1:任意值})',
        priority: 1
    },
    {
        py: 'dr',
        word: '导入',
        snippet: '导入 (${1:模块位置})',
    },
    {
        py: 'zck',
        word: '支持库',
        snippet: '支持库(${1:库名})',
        priority: 1
    },
    {
        py: 'rg',
        word: '如果',
        snippet: '如果 (${1:条件}) {\n\t$2\n}',
        priority: 1,
        relatedKeywords: ['否则', '否则如果', '如果真', '如果假', '如果~否则如果']
    },
    {
        py: 'rgfz',
        word: '如果~否则',
        snippet: '如果 (${1:条件}) {\n\t$2\n} 否则 {\n\t$3\n}',
        priority: 1,
        relatedKeywords: ['如果', '否则', '否则如果', '如果真', '如果假', '如果~否则如果']
    },
    {
        py: 'rgfzrg',
        word: '如果~否则如果',
        snippet: '如果 (${1:条件}) {\n\t$2\n} 否则如果(${3:条件}) {\n\t$4\n}',
        priority: 1,
        relatedKeywords: ['如果', '否则', '否则如果', '如果真', '如果假', '如果~否则']
    },
    {
        py: 'jcxh',
        word: '计次循环',
        snippet: '计次循环 (${1:循环次数}, ${2:变量名}) {\n\t$3\n}',
        priority: 1,
        relatedKeywords: ['首循环', '判断循环', '跳转标签', '跳转', '遍历数组']
    },
    {
        py: 'blsz',
        word: '遍历数组',
        snippet: '遍历数组 (${1:数组名}, ${2:变量名}) {\n\t$3\n}',
        priority: 1,
        relatedKeywords: ['首循环', '判断循环', '跳转标签', '跳转', '计次循环']
    },
    {
        py: 'ff',
        word: '方法',
        snippet: '${1:返回值} ${2:方法名}(){\n\t$3\n}',
        priority: 1
    },
    {
        py: 'gyff',
        word: '公有方法',
        snippet: '公有 ${1:返回值} ${2:方法名}(){\n\t$3\n}',
        priority: 1
    },
    {
        py: 'gyjtff',
        word: '公有静态方法',
        snippet: '公有 静态 ${1:返回值} ${2:方法名}(){\n\t$3\n}',
        priority: 1
    }
];
