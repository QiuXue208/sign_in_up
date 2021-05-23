const http = require('http');
const fs = require('fs');
const url = require('url');
const md5 = require('md5');
//process.argv返回命令参数
const port = process.argv[2];

if (!port) {
  console.log('请指定端口号\n 如node server.js 8888');
  process.exit(1);
}

let sessions = {};

const server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = '';
  if (pathWithQuery.indexOf('?') >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf('?'));
  }

  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;

  if (path === '/') {
    let string = fs.readFileSync('./index.html', 'utf8');
    let users = fs.readFileSync('./db/users', 'utf8');
    try {
      users = JSON.parse(users);
    } catch (e) {
      users = [];
    }

    // 先拿到请求头的cookie
    // 可能会存在多个cookie sign_in_email=1@qq.com;a=1;b=2
    let cookies = request.headers.cookie;
    let splitCookies = cookies && cookies.split(';');
    let cookieValue;
    splitCookies &&
      splitCookies.some((cookie) => {
        let splitCookie = cookie.split('=');
        if ((splitCookie[0] && splitCookie[0].trim()) === 'sessionId') {
          let ss = sessions[splitCookie[1]];
          if (ss) {
            cookieValue = ss.email;
          }
          return true;
        }
      });
    let foundUser = users.find((user) => user.email === cookieValue);
    if (foundUser) {
      string = string.replace('__password__', foundUser.password);
    } else {
      string = string.replace('__password__', '请先登录');
    }
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html;charset=utf-8');
    response.write(string);
    response.end();
  } else if (path === '/sign_up' && method === 'GET') {
    let string = fs.readFileSync('./sign_up.html', 'utf8');
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/html;charset=utf-8');
    response.write(string);
    response.end();
  } else if (path === '/sign_up' && method === 'POST') {
    readBody(request).then((bodyData) => {
      let hash = {};
      let strings = bodyData.split('&');
      strings.forEach((string) => {
        let parts = string.split('=');
        hash[parts[0]] = decodeURIComponent(parts[1]);
      });
      let { email, password, password_confirmation } = hash;
      // 从库中读取已有的用户信息
      let users = fs.readFileSync('./db/users', 'utf8');
      let emails = [];
      try {
        users = JSON.parse(users);
      } catch (e) {
        users = [];
      }
      users.map((item) => emails.push(item.email));

      if (email.indexOf('@') === -1) {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'text/plain;charset=utf-8');
        response.write('邮箱格式错误');
      } else if (password !== password_confirmation) {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'text/plain;charset=utf-8');
        response.write('密码不匹配');
      } else if (emails.indexOf(email) !== -1) {
        // 如果注册信息重复
        response.statusCode = 400;
        response.setHeader('Content-Type', 'text/plain;charset=utf-8');
        response.write('该用户已存在');
      } else {
        users.push({ email: email, password: password });
        fs.writeFileSync('./db/users', JSON.stringify(users));
        response.statusCode = 200;
      }
      response.end();
    });
  } else if (path === '/sign_in' && method === 'GET') {
    let string = fs.readFileSync('./sign_in.html', 'utf-8');
    response.statusCode === 400;
    response.setHeader('Content-Type', 'text/html;charset=utf8');
    response.write(string);
    response.end();
  } else if (path === '/sign_in' && method === 'POST') {
    readBody(request).then((bodyData) => {
      let hash = {};
      let strings = bodyData.split('&');
      strings.forEach((str) => {
        let parts = str.split('=');
        hash[parts[0]] = decodeURIComponent(parts[1]);
      });
      let { email, password } = hash;
      let users = fs.readFileSync('./db/users', 'utf8');
      try {
        users = JSON.parse(users);
      } catch (e) {
        users = [];
      }

      let signInUser = users.find((user) => user.email === email);
      if (!signInUser.email) {
        // 认证失败
        response.statusCode = 401;
        response.setHeader('Content-Type', 'text/plain;charset=utf-8');
        response.write('无此用户');
        response.end();
      } else {
        if (signInUser.password !== password) {
          response.statusCode = 401;
          response.setHeader('Content-Type', 'text/plain;charset=utf-8');
          response.write('密码错误');
          response.end();
        } else {
          // 成功登录
          response.statusCode = 200;
          // Set-Cookie: <cookie-name>=<cookie-value>
          let sessionId = Math.random() * 100000;
          sessions[sessionId] = { email: email };
          response.setHeader('Set-Cookie', [`sessionId=${sessionId}`]);
          response.end();
        }
      }
    });
  } else if (path === '/css/default.css') {
    let string = fs.readFileSync('./css/default.css', 'utf8');
    response.statusCode = 200;
    response.setHeader('Content-Type', 'text/css;charset=utf-8');
    response.setHeader('Cache-Control', 'max-age=300000');
    response.setHeader('Expires', 'Sat, 22 May 2021 14:17:38 GMT');
    response.write(string);
    response.end();
  } else if (path === '/js/main.js') {
    let string = fs.readFileSync('./js/main.js', 'utf8');
    let fileMd5 = md5(string);
    // response.setHeader('Cache-Control', 'max-age=30000');
    // response.setHeader('Expires', 'Sat, 22 May 2021 14:17:38 GMT');

    if (request.headers['if-none-match'] === fileMd5) {
      // 没有响应体
      // 304 not modified
      response.statusCode = 304;
    } else {
      // 有响应体，需要下载
      response.statusCode = 200;
      response.setHeader(
        'Content-Type',
        'application/javascript;charset=utf-8',
      );
      response.setHeader('ETag', fileMd5);
      response.write(string);
    }
    response.end();
  } else {
    response.statusCode = 404;
    response.setHeader('Content-Type', 'text/html;charset=utf-8');
    response.write(`{error: 'not found'}`);
    response.end();
  }
});

// node http get post data
function readBody(request) {
  return new Promise(function (resolve, reject) {
    let body = []; // 请求体
    request
      .on('data', (chunk) => {
        body.push(chunk);
      })
      .on('end', () => {
        body = Buffer.concat(body).toString();
        resolve(body);
      });
  });
}

server.listen(port);
console.log('监听' + port + '成功\n请访问 http://localhost:' + port);
