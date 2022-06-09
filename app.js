// 导入 express 模块
const express = require('express')
// 导入 cors 中间件
const cors = require('cors')

const joi = require('joi')

// 解析 token 的中间件
const expressJWT = require('express-jwt')

// 创建 express 的服务器实例
const app = express()

// 将 cors 注册为全局中间件
app.use(cors())

app.use(express.json())

app.use(express.urlencoded({extended: false}))


// 响应数据的中间件
app.use(function (req, res, next) {
    // status = 0 为成功； status = 1 为失败； 默认将 status 的值设置为 1，方便处理失败的情况
    res.cc = function (err, status = 1) {
        res.send({
            // 状态
            status,
            // 状态描述，判断 err 是 错误对象 还是 字符串
            message: err instanceof Error ? err.message : err,
        })
    }
    next()
})


// 导入配置文件
const config = require('./config')

// 使用 .unless({ path: [/^\/api\//] }) 指定哪些接口不需要进行 Token 的身份认证
app.use(expressJWT({secret: config.jwtSecretKey}).unless({path: [/^\/api\//]}))


// 用户
const userRouter = require('./router/user')
app.use('/api', userRouter)

// 程序
const programRouter = require('./router/program')
app.use('/program', programRouter)

// 卡密
const userinfoRouter = require('./router/userinfo')
// 以 /account 开头的接口，都是有权限的接口，需要进行 Token 身份认证
app.use('/account', userinfoRouter)


// 错误中间件
app.use((err, req, res, next) => {
    res.cc(err)
})

app.use((req, res) => {
    res.cc('路径错误')
})
// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(3000, function () {
    console.log('api server running at http://127.0.0.1:3000')
})
