// 导入 mysql 模块
const mysql = require('mysql')
const {query} = require("express");

// 创建数据库连接对象
const db = mysql.createPool({
    host:"http://localhost:3000",//主机名（服务器地址）
    user:"root",//用户名
    password:"root",//密码
    database:"database", //数据库名字
    port: '3306'
})

// 向外共享 db 数据库连接对象
module.exports = db
