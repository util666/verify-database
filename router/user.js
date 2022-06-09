const express = require('express')
const router = express.Router()

// 导入用户路由处理函数模块
const userHandler = require('../router_handler/user')

// 导入验证表单数据的中间件
const expressJoi = require('@escook/express-joi')
// 导入需要的验证规则对象
const {userSchema} = require('../schema/user')

//用户注册
router.post('/register', expressJoi(userSchema), userHandler.register)

// 用户登录
router.post('/login', expressJoi(userSchema), userHandler.login)

// 查询卡密
router.post('/queryUser', userHandler.queryUser)

// 卡密解绑设备
router.post('/unbindDevice', userHandler.unbindDevice)

// 卡密登录
router.post('/loginUser', userHandler.loginUser)



module.exports = router
