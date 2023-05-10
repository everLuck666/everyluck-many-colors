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
const serveStatic = require('serve-static')
const needle = require('needle');
let axios = require('axios');
const httpclient = require('urllib');
const FormStream = require('formstream');
// const { init: initDB, Counter } = require("./db");

// 设置保存路径和文件名
const storage = multer.diskStorage({
  destination: async function (req, res, cb) {
    const token = req.get('token');
    console.error('token', token);
    // await utils.exitsFolder(`../public/${token}`);
    console.error('出发发布')
    // 设置文件存储路径
    cb(null, `./public`);
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
app.post('/upload/single2', upload.single('file'), async (req, res) => {
  const token = req.get('token');
  const fileName = req.file.filename;

  console.warn('上传token', token, fileName,`./public/${fileName}`)

  uploadFile(`./public/${fileName}`, token)
  

  res.json({
    code: 200,
    msg: '上传成功!',
    data: req.file,
  });
});


// 导入依赖
const formidable = require("formidable");
 
// 虽然 写的是 根路径，但实际访问的是 /upload 路径，如果 写了 /api ,那就是 /upload/api
app.post("/upload/single", function (req, res, next) {
  const token = req.get('token');
  // 创建 form 对象
  const form = formidable({
    multiples: true,
    // 保存上传的文件的路径
    uploadDir: __dirname + "/public",
    // 保留后缀
    keepExtensions: true,
  });
  // 解析请求报文
  form.parse(req, async (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }

    console.error('=====2323',files.file.newFilename)
    const fileName = files.file.newFilename;
    // console.log('00000=0', fileName); // 包含需要的 newFilename 新文件名
    // uploadFile(`./public/${fileName}`, token)
    const result = await uploadFile2(fileName, token)
     res.status(200).json(result.data)
  });

 
}
);

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


let uploadDir = 'static'
let uploadForOtherDir = path.join(__dirname, '/public');


app.post('/toOther', async function (req, res) {
  let formData = new FormData()
  const token = req.get('token');
  console.log('/toOther req :: ', req)
  let fileToOther = path.join(uploadForOtherDir, 'f64bf099834d47c16a1b8ce02.png')
  console.log('fileToOther>>>', fileToOther)
  let infor = fs.existsSync(fileToOther)
  console.log('infor>>', infor) // infor>> true
  formData.append('file', fs.createReadStream(fileToOther))

  console.log('formData.getHeaders()', formData.getHeaders())
  let headerHere = formData.getHeaders()
  
  try {
    let result = await axios.post(
      `http://43.139.247.92:5000/forum`,
      formData,
     
      
      {Headers: {...headerHere, token},
      headers: {...headerHere, token},}
    )
    
    res.status(200).json(result.data)
  } catch (err) {
    console.log('file/toOther err', err)
  }
})

const uploadFile2 = async (fileName, token) => {
  let formData = new FormData()
  let fileToOther = path.join(uploadForOtherDir, fileName)
  console.log('fileToOther>>>', fileToOther)
  let infor = fs.existsSync(fileToOther)
  console.log('infor>>', infor) // infor>> true
  formData.append('file', fs.createReadStream(fileToOther))

  console.log('formData.getHeaders()', formData.getHeaders())
  let headerHere = formData.getHeaders()
  
  try {
    let result = await axios.post(
      `http://43.139.247.92:5000/forum`,
      formData,
     
      
      {Headers: {...headerHere, token},
      headers: {...headerHere, token},}
    )
    setTimeout(() => {
      fs.unlink(fileToOther, (err) => {
        if (err) throw err;
        console.log('文件已删除');
      });
    }, 10000)

    console.error('触发触发88888', result.data)
    return result;

    
    // res.status(200).json(result.data)
  } catch (err) {
    console.log('file/toOther err', err)
  }
}

const port = process.env.PORT || 80;

async function bootstrap() {
  // await initDB();
  app.listen(port, () => {
    console.log('启动成功', port);
  });
}

bootstrap();


async function uploadFile(filePath, token) {
  // 构造对应的 form stream
  const form = new FormStream();
  form.field('token', token); // 设置普通的 headers
  console.error('我是token', token)
  form.headers('token', token)
  form.file('file', filePath); // 添加文件，上传当前文件本身用于测试
  // form.file('file2', __filename); // 执行多次来添加多文件


  
  // 发起请求
  const url = 'http://43.139.247.92:5000/forum';
  try {
    const result = await httpclient.request(url, {
      dataType: 'stream',
      method: 'POST',
  
      
      // 生成符合 multipart/form-data 要求的请求 headers
      headers: {...form.headers(), token},
      // 以 stream 模式提交
      stream: form,
    });

    console.error('上传成功了吗==', result)
  } catch (error) {

    console.error('我报错了00000', error)
    
  }
  

  console.error('====-----====')
  setTimeout(() => {
    fs.unlink(filePath, (err) => {
      if (err) throw err;
      console.log('文件已删除');
    });
  }, 10000)


  // 响应最终会是类似以下的结果：
  // {
  //   "file": "'use strict';\n\nconst For...."
  // }
}

// run().catch(console.error);