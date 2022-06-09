/**
 * 在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
 */
const db = require('../db/index')
const bcrypt = require('bcryptjs')
// 用这个包来生成 Token 字符串
const jwt = require('jsonwebtoken')
// 导入配置文件
const config = require('../config')

// 用户注册
exports.register = (req, res) => {
    // 接收表单数据
    const userinfo = req.body
    // 判断数据是否合法
    if (!userinfo.account || !userinfo.password) {
        return res.send({status: 1, message: '账号或密码不能为空！'})
    }
    const sql = `select * from agency where account=?`
    db.query(sql, userinfo.account, function (err, results) {
        // 执行 SQL 语句失败
        if (err) {
            return res.send({status: 1, message: err.message})
        }
        // 账户已存在
        if (results.length > 0) {
            return res.send({status: 1, message: '账号已存在!'})
        }
        // TODO: 账户可用，继续后续流程...
        // 对用户的密码,进行 bcrypt 加密，返回值是加密之后的密码字符串
        userinfo.password = bcrypt.hashSync(userinfo.password, 10)
        // 账号创建时间
        let creation_time = config.dateTimeFormat(new Date())
        // vip到期时间(默认7天后)
        let vip_time = config.dateTimeFormat((new Date).valueOf() + 1000 * 60 * 60 * 24 * 7)

        const sql = 'insert into agency set ?'

        let data = {
            account: userinfo.account,
            password: userinfo.password,
            creation_time,
            vip_time,
        }

        db.query(sql, data, function (err, results) {
            // 执行 SQL 语句失败
            if (err) return res.send({status: 1, message: err.message})
            // SQL 语句执行成功，但影响行数不为 1
            if (results.affectedRows !== 1) {
                return res.send({status: 1, message: '注册用户失败，请稍后再试！'})
            }
            // 注册成功
            res.send({status: 0, message: '注册成功！'})
        })

    })
}

// 登录的处理函数
exports.login = (req, res) => {
    const userinfo = req.body
    const sql = `select * from agency where account=?`
    db.query(sql, userinfo.account, function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('用户未注册!')
        // TODO：判断用户输入的登录密码是否和数据库中的密码一致
        // 拿着用户输入的密码,和数据库中存储的密码进行对比
        const compareResult = bcrypt.compareSync(userinfo.password + '', results[0].password)
        // 如果对比的结果等于 false, 则证明用户输入的密码错误
        if (!compareResult) {
            return res.cc('密码错误！')
        }
        // TODO：登录成功，生成 Token 字符串
        // 只保留账号和id
        const user = {account: results[0].account, id: results[0].id, permission: results[0].permission}
        // 生成 Token 字符串
        const tokenStr = jwt.sign(user, config.jwtSecretKey, {
            expiresIn: '10h', // token 有效期为 10 个小时
        })
        res.send({
            status: 0,
            message: '登录成功！',
            // data:user,
            // 为了方便客户端使用 Token，在服务器端直接拼接上 Bearer 的前缀
            token: 'Bearer ' + tokenStr,
        })
    })
}


//卡密登录
exports.loginUser = (req, res) => {
    const id = req.query.id
    const account = req.query.account
    const program = req.query.program
    const device_code = req.query.device_code

    if (!id || !account || !device_code || !program) return res.cc('参数不能为空!')

    const sql = `select * from user where id=? and account=? and program=?`

    db.query(sql, [id, account, program], function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('登录失败！')

        // TODO：查询成功
        results = config.formatData(results)

        if (!results.device_code) {
            const sql = `update user set device_code = ? where id = ? and account = ? `
            db.query(sql, [device_code, id, account], function (err, data) {
                // SQL 语句执行失败
                if (err) return res.cc(err)
                // SQL 语句执行成功，但是影响行数不等于 1
                if (data.affectedRows !== 1) return res.cc('绑定失败!')
                // 移除设备码
                results.device_code = undefined
                res.send({
                    status: 0,
                    message: '登录成功！',
                    data: results,
                })
            })
        } else if (results.device_code != device_code) {
            return res.cc('设备码异常')
        } else {
            //移除设备码
            results.device_code = undefined
            res.send({
                status: 0,
                message: '登录成功！',
                data: results,
            })
        }
    })
}

//查询卡密是否存在
exports.queryUser = (req, res) => {
    const id = req.body.id
    const account = req.body.account

    if (!id || !account) return res.cc('参数不能为空!')

    const sql = `select * from user where id=? and account=?`

    db.query(sql, [id, account], function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('查询失败！')

        // TODO：查询成功
        results = config.formatData(results)
        //查询时移除设备码
        results.device_code = undefined
        res.send({
            status: 0,
            message: '查询成功！',
            data: results,
        })
    })
}

//卡密解绑设备
exports.unbindDevice = (req, res) => {
    const id = req.body.id
    const account = req.body.account

    if (!id || !account) return res.cc('参数不能为空!')

    const sql = `select * from user where id=? and account=?`

    db.query(sql, [id, account], function (err, results) {
        // 执行 SQL 语句失败
        if (err) return res.cc(err)
        // 执行 SQL 语句成功，但是查询到数据条数不等于 1
        if (results.length !== 1) return res.cc('查询失败!')

        // TODO：查询成功
        results = config.formatData(results)

        // 已解绑次数
        let unbindNum = results.unbindNum

        if (unbindNum == 10) return res.cc('解绑次数上限,请联系管理员或上级解绑!')
        if (results.device_code == '') return res.cc('您未绑定设备码,无需解绑!')

        const sql = `update user set device_code ='',unbindNum=? where id = ? and account = ? `
        db.query(sql, [++unbindNum, id, account], function (err, results) {

            // SQL 语句执行失败
            if (err) return res.cc(err)

            // SQL 语句执行成功，但是影响行数不等于 1
            if (results.affectedRows !== 1) return res.cc('解绑失败!')

            // 更新密码成功
            res.cc('解绑成功!', 0)

        })

    })
}