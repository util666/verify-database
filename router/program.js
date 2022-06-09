const express = require('express')
const router = express.Router()

// 导入用户路由处理函数模块
const programHandler = require('../router_handler/program')

// 获取程序
router.post('/getProgram', programHandler.getProgram)

// 新建程序
router.post('/addProgram', programHandler.addProgram)

// 修改程序
router.post('/reviseProgram', programHandler.reviseProgram)

// 删除程序
router.post('/deleteProgram', programHandler.deleteProgram)



module.exports = router
