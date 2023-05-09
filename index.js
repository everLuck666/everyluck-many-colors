const path = require('path');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const morgan = require('morgan');
const https = require('https');
const { httpGet } = require('./utils/request');
const multer = require('multer');
const proxy = require('express-http-proxy');
const utils = require('./utils/utils');
const FormData = require('form-data');
const fetch = require('node-fetch')
const http = require('http');
const needle = require('needle');
const serveStatic = require('serve-static')
// const { init: initDB, Counter } = require("./db");

// 设置保存路径和文件名
const storage = multer.diskStorage({
  destination: async function (req, res, cb) {
    const token = req.get('token');
    console.error('token', token);
    await utils.exitsFolder(`../public/${token}`);
    // 设置文件存储路径
    cb(null, `./public/${token}`);
  },
  filename: function (req, file, cb) {
    // 设置文件名（可以自己定义）
    let fileData = file.originalname
    cb(null, fileData);
  },
});
const upload = multer({
  storage,
});

const logger = morgan('tiny');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());
app.use(logger);

const rootPath = path.join(__dirname, 'public')
app.use(serveStatic(rootPath))

// 单个文件上传
app.post('/upload/single', upload.single('file'), async (req, res) => {
  // const token = req.get('token');
  // const fileName = req.file.filename;

  // const form_data = new FormData();
  // form_data.append(
  //   'file',
  //   fs.createReadStream(`./public/${token}/${fileName}`),
  // );

  // const data = await fetch('http://43.139.247.92:5000/forum', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'multipart/form-data',
  //     token,
  //     ...form_data.getHeaders(),
  //   },
  //   body: form_data,
  // });

  // console.error('+++++', `./public/${token}/${fileName}`)

  // console.error('=========', data)

  res.json({
    code: 200,
    msg: '上传成功!',
    data: req.file,
  });
});

// 配置代理 /
let proxyConfig = {
  URL: '43.139.247.92',
  PORT: '5000',
};
// 访问 http://localhost:3000/hbapi 会转为  http://xx.xx.xx.xx:3000 请求
app.use(
  '/api',
  proxy('http://' + proxyConfig.URL + ':' + proxyConfig.PORT, {
    preserveHostHdr: true,
    forwardPath: function (req, res) {
      return require('url').parse(req.url).path;
    },
  }),
);

// 首页
app.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 更新计数
app.post('/api/count', async (req, res) => {
  const { action } = req.body;
  if (action === 'inc') {
    await Counter.create();
  } else if (action === 'clear') {
    await Counter.destroy({
      truncate: true,
    });
  }
  res.send({
    code: 0,
    data: await Counter.count(),
  });
});

app.get('/api/getData', async (req, res) => {
  // console.error('我请求过来了5', req);
  const { bookId, sectionId } = req.query;
  const options = {
    method: req.method,
    path: `https://golang-fkr4-1783471-1303969980.ap-shanghai.run.tcloudbase.com/milk_proxy/api/reader/book/section/get?book_id=${bookId}&section_id=${sectionId}`,
  };

  console.error('参数', options, req.query);

  httpGet((data) => {
    console.error('我是error-', data);
    res.send(data);
  }, options.path);
});

/** 书架接口 */
app.get('/api/getBooksInfo', async (req, res) => {
  // console.error('我请求过来了5', req);
  const { skip } = req.query;
  const options = {
    method: req.method,
    path: `https://golang-fkr4-1783471-1303969980.ap-shanghai.run.tcloudbase.com/milk_proxy/api/reader/book/list?skip=${skip}&limit=10`,
  };

  console.error('参数', options, req.query);

  httpGet((data) => {
    console.error('我是error-', data);
    res.send(data);
  }, options.path);
});

// 获取计数
app.get('/api/count', async (req, res) => {
  const result = await Counter.count();
  res.send({
    code: 0,
    data: result,
  });
});

// 小程序调用，获取微信 Open ID
app.get('/api/wx_openid', async (req, res) => {
  if (req.headers['x-wx-source']) {
    res.send(req.headers['x-wx-openid']);
  }
});

const port = process.env.PORT || 80;

async function bootstrap() {
  // await initDB();
  app.listen(port, () => {
    console.log('启动成功', port);
  });
}

bootstrap();
