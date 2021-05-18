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
        hash[parts[0]] = parts[1];
      });
      let { email, password } = hash;
      if (email.indexOf('@') === -1) {
        response.statusCode = 400;
        response.setHeader('Content-Type', 'application/json;charset=utf-8');
        response.write('请填写正确的邮箱格式');
      } else {
        response.statusCode = 200;
      }
      response.end();
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
