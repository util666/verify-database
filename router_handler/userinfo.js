// 导入数据库操作模块
const db = require('../db/index')
const config = require("../config");
const {date} = require("joi");
const uuid = require('uuid');

// 获取用户基本信息的处理函数
exports.getUserInfo = (req, res) => {
    // 根据用户的 id，查询用户的基本信息
    const sql = `select * from agency where account=?`
    // 注意：req 对象上的 user 属性，是 Token 解析成功，express-jwt 中间件帮我们挂载上去的
    db.query(sql, req.user.account, (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        let sqlProgramTotal = 'select count(*) as total from program where account=?'
        //查询用户程序总数
        db.query(sqlProgramTotal, req.user.account, (err, total) => {
            // 执行 SQL 语句失败
            if (err) return res.cc(err)
            let programTotal = total[0]['total'] || 0

            let sqlUserTotal = 'select count(*) as total from user where account=?'
            //查询卡密总数
            db.query(sqlUserTotal, req.user.account, (err, total) => {
                // 执行 SQL 语句失败
                if (err) return res.cc(err)
                let userTotal = total[0]['total'] || 0

                // 执行 SQL 语句成功，但是查询到的数据条数不等于 1
                if (results.length !== 1) return res.cc('获取用户信息失败！')
                results = config.formatData(results)
                results.programTotal = programTotal
                results.userTotal = userTotal

                // 将用户信息响应给客户端
                res.send({
                    status: 0,
                    message: '获取用户基本信息成功！',
                    data: results,
                })
            })

        })

    })
}

// 更新用户基本信息的处理函数
exports.updateUserInfo = (req, res) => {
    let body = {
        version: req.body.version,
        message: req.body.message,
        sign: req.body.sign,
    }
    const sql = `update agency set ? where account=?`
    db.query(sql, [body, req.user.account], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        // 执行 SQL 语句成功，但影响行数不为 1
        if (results.affectedRows !== 1) return res.cc('修改用户基本信息失败！')

        // 修改用户信息成功
        return res.cc('修改用户基本信息成功！', 0)
    })
}

// 重置密码的处理函数
exports.updatePassword = (req, res) => {
    // 定义根据 id 查询用户数据的 SQL 语句
    const sql = `select * from agency where account=?`

    // 执行 SQL 语句查询用户是否存在
    db.query(sql, req.user.account, (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        // 检查指定 id 的用户是否存在
        if (results.length !== 1) return res.cc('用户不存在！')

        // TODO：判断提交的旧密码是否正确
        // 在头部区域导入 bcryptjs 后，
        // 即可使用 bcrypt.compareSync(提交的密码，数据库中的密码) 方法验证密码是否正确
        // compareSync() 函数的返回值为布尔值，true 表示密码正确，false 表示密码错误
        const bcrypt = require('bcryptjs')

        // 判断提交的旧密码是否正确
        const compareResult = bcrypt.compareSync(req.body.oldPwd, results[0].password)
        if (!compareResult) return res.cc('原密码错误！')
        // 定义更新用户密码的 SQL 语句
        const sql = `update agency set password=? where account=?`

        // 对新密码进行 bcrypt 加密处理
        const newPwd = bcrypt.hashSync(req.body.newPwd, 10)

        // 执行 SQL 语句，根据 account 更新用户的密码
        db.query(sql, [newPwd, req.user.account], (err, results) => {
            // SQL 语句执行失败
            if (err) return res.cc(err)

            // SQL 语句执行成功，但是影响行数不等于 1
            if (results.affectedRows !== 1) return res.cc('更新密码失败！')

            // 更新密码成功
            res.cc('更新密码成功！', 0)
        })
    })
}


// 查询卡密
exports.queryChild = (req, res) => {
    let queryConditions = [req.user.account]
    let sql = ''
    let sqlOriginal = `select * from user  where account=? `
    let sqlTotal = `select count(*) as total from user where account=? `

    //创建时间
    if (req.body.start_creation_time && req.body.end_creation_time) {
        sql = sql += `and creation_time>=? and creation_time<=? `
        queryConditions.push(req.body.start_creation_time, req.body.end_creation_time)
    }
    //vip到期时间
    if (req.body.start_vip_time && req.body.end_vip_time) {
        sql = sql += `and vip_time>=? and vip_time<=? `
        queryConditions.push(req.body.start_vip_time, req.body.end_vip_time)
    }
    //程序
    if (req.body.program) {
        sql = sql += `and program=? `
        queryConditions.push(req.body.program)
    }
    sqlTotal += sql
    sql = sql += `order by creation_time limit ?,?`
    let page = config.getPage(req)
    queryConditions.push(page.pageNum, page.pageSize)

    sqlOriginal += sql


    db.query(sqlOriginal, queryConditions, (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        db.query(sqlTotal, queryConditions, (err, among) => {
            // 执行 SQL 语句失败
            if (err) return res.cc(err)

            page.total = among[0]['total'] || 0
            //格式化
            results = config.formatDataList(results)

            res.send({
                status: 0,
                message: `查询成功!`,
                data: results,
                page
            })

        })

    })
}


// 添加卡密
exports.addChild = (req, res) => {
    if (!req.body.amount || !req.body.days || !req.body.program || !req.body.programName) return res.cc('参数错误!')
    let dataList = []
    for (let i = 0; i < req.body.amount; i++) {
        let data = [
            uuid.v4().replace(/-/g, ''),
            config.dateTimeFormat(new Date()),
            req.user.account,
            config.dateTimeFormat((new Date()).valueOf() + 1000 * 60 * 60 * 24 * req.body.days),
            req.body.program,
            req.body.programName,
            req.body.remarks || '',
        ]
        dataList.push(data)
    }
    const sql = 'insert into user(id,creation_time,account,vip_time,program,programName,remarks) values ?'
    db.query(sql, [dataList], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        res.send({
            status: 0,
            message: `成功添加${results.affectedRows}条数据!`,
            data: dataList,
        })

    })
}

// 修改卡密
exports.reviseChild = (req, res) => {

    let dataList = [];
    (req.body.dataList || []).map(item => {
        item.vip_time = config.dateTimeFormat((new Date(item.vip_time)).valueOf() + 1000 * 60 * 60 * 24 * req.body.days)
        dataList.push([item.id, item.vip_time])
    })

    const sql = 'insert into user (id,vip_time) values ? on duplicate key update vip_time = values(vip_time)'

    db.query(sql, [dataList], (err, data) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        res.send({
            status: 0,
            message: `成功修改${data.affectedRows / 2}条数据!`,
            data: req.body.dataList,
        })

    })
}


// 删除卡密
exports.deleteChild = (req, res) => {
    const sql = `delete from user where id in (?)`
    db.query(sql, [req.body.dataList], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        if (results.affectedRows == 0) return res.cc('删除失败!')
        res.send({
            status: 0,
            message: `成功删除 ${results.affectedRows} 条数据!`,
        })

    })
}

