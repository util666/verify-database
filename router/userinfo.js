const express = require('express')
const router = express.Router()

// 导入验证数据合法性的中间件
const expressJoi = require('@escook/express-joi')

// 导入卡密信息的处理函数模块
const userinfo_handler = require('../router_handler/userinfo')

// 导入需要的验证规则对象
const { update_password_schema } = require('../schema/user')

// 获取用户的基本信息
router.post('/userinfo', userinfo_handler.getUserInfo)

// 更新用户的基本信息
router.post('/updateUserInfo', userinfo_handler.updateUserInfo)

// 用户重置密码
router.post('/updatePwd', expressJoi(update_password_schema), userinfo_handler.updatePassword)

// 用户查询卡密
router.post('/queryChild', userinfo_handler.queryChild)

// 用户添加卡密
router.post('/addChild', userinfo_handler.addChild)

// 用户修改卡密
router.post('/reviseChild', userinfo_handler.reviseChild)

// 用户删除卡密
router.post('/deleteChild', userinfo_handler.deleteChild)


module.exports = router
