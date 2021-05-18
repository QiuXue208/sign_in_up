const http = require('http');
const fs = require('fs');
const url = require('url');
//process.argv返回命令参数
const port = process.argv[2];

if (!port) {
  console.log('请指定端口号\n 如node server.js 8888');
  process.exit(1);
}

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
        if (splitCookie[0] === 'sign_in_email') {
          cookieValue = splitCookie[1];
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
          response.setHeader('Set-Cookie', [`sign_in_email=${email}`]);
          response.end();
        }
      }
    });
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
