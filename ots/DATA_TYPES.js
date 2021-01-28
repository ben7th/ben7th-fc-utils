// String	string	JavaScript语言中的基本数据类型
// Integer	int64	NodeJs SDK封装的数据类型
// Dobule	number	JavaScript语言中的基本数据类型
// Boolean	boolean	JavaScript语言中的基本数据类型
// Binary	Buffer	NodeJS的Buffer对象

const DATA_TYPES = {
  STRING: 'STRING',
  INTEGER: 'INTEGER',
  DOUBLE: 'DOUBLE',
  BOOLEAN: 'BOOLEAN',
  BINARY: 'BINARY',

  JSON: 'JSON', // 自己封装的类型，存储时转换成字符串
  DATE: 'DATE' // 自己封装的类型，存储时转换成整形
}

module.exports = DATA_TYPES