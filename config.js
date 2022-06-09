const moment = require('moment')
const db = require('./db/index')

//封装请求,以便同步使用
const query = (sql, values) => {
    return new Promise((resolve, reject) => {
        db.query(sql, values, (err, rows) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        })
    })
}


const dateTimeFormat = (date) => {
    try {
        return moment(date).format("YYYY-MM-DD HH:mm:ss");
    } catch (error) {
        return "";
    }
};

const formatData = ([data = {}]) => {
    //时间格式化
    data.creation_time = data.creation_time ? dateTimeFormat(data.creation_time) : undefined
    data.vip_time = data.vip_time ? dateTimeFormat(data.vip_time) : undefined
    //去除密码
    data.password = undefined
    return data
}

const formatDataList = (data = []) => {
    data.map(item => {
        //时间格式化
        item.creation_time = item.creation_time ? dateTimeFormat(item.creation_time) : undefined
        item.vip_time = item.vip_time ? dateTimeFormat(item.vip_time) : undefined
    })
    return data
}

const getPage = (req) => {
    let pageNum = (parseInt(req.body.pageNum) - 1) * parseInt(req.body.pageSize) || 0
    let pageSize = parseInt(req.body.pageSize) || 10
    return {
        pageNum,
        pageSize,
    }
}

module.exports = {
    jwtSecretKey: 'LongTao',
    dateTimeFormat,
    formatData,
    formatDataList,
    getPage,
    query,
}


