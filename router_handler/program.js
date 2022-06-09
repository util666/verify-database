// 导入数据库操作模块
const db = require('../db/index')
const config = require("../config");

// 获取用户程序
exports.getProgram = (req, res) => {
    let page = config.getPage(req)
    // 根据用户的 id，查询用户的基本信息
    const sql = `select * from program where account=? order by program limit ?,?`

    db.query(sql, [req.user.account, page.pageNum, page.pageSize], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        let sqlTotal = 'select count(*) as total from program where account=?'
        db.query(sqlTotal, req.user.account, async (err, among) => {
            // 执行 SQL 语句失败
            if (err) return res.cc(err)
            //用户程序总数
            page.total = among[0]['total'] || 0
            await Promise.all(results.map(async (item) => {
                let sqlUserTotal = 'select count(*) as total from user where account=? and program=?'
                let userNum = await config.query(sqlUserTotal, [req.user.account, item.program])
                item.userNum = userNum[0]['total'] || 0
                return item
            }))
            res.send({
                status: 0,
                message: '获取程序列表成功！',
                data: results,
                page,
            })
        })

    })
}

// 修改程序信息
exports.reviseProgram = (req, res) => {
    let body = {
        version: req.body.version,
        message: req.body.message,
        program: req.body.program,
        programName: req.body.programName,
    }
    const sql = `update program set ? where account=? and program=?`
    db.query(sql, [body, req.user.account, body.program], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        // 执行 SQL 语句成功，但影响行数不为 1
        if (results.affectedRows !== 1) return res.cc('修改程序信息失败！')

        // 修改用户信息成功
        return res.cc('修改程序信息成功！', 0)
    })
}

// 添加程序
exports.addProgram = (req, res) => {
    let body = {
        version: req.body.version,
        message: req.body.message,
        programName: req.body.programName,
        account: req.user.account,
    }
    const sql = `insert into program set ?`
    db.query(sql, body, (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但影响行数不为 1
        if (results.affectedRows !== 1) return res.cc('添加程序失败！')
        // 修改用户信息成功
        return res.cc('添加程序成功！', 0)
    })
}

// 删除程序
exports.deleteProgram = (req, res) => {
    //删除程序前先删除该程序下的用户
    const sql = `delete from user where account=? and program=?`
    db.query(sql, [req.user.account, req.body.program], (err, results) => {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)

        const sql = `delete from program where account=? and program=?`
        db.query(sql, [req.user.account, req.body.program], (err, results) => {
            // 执行 SQL 语句失败
            if (err) return res.cc(err)
            // 执行 SQL 语句成功，但影响行数不为 1
            if (results.affectedRows !== 1) return res.cc('删除程序失败！')
            // 修改用户信息成功
            return res.cc('删除程序成功！', 0)
        })
    })

}