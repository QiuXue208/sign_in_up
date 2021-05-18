# sign_in_up 登录注册及 cookie 的实现

1. 写好首页

2. 写好注册页面

3. 写好登录页面

4. 写一个服务器来处理注册登录逻辑

- 注册：当提交表单后，先在前端进行表单验证，然后提交到服务器。如果注册过，就给出相应提示，否则，将注册信息写入数据库。
- 登录：当提交表单后，同样先在前端进行表单验证，通过后提交数据至服务端。在服务端，先拿到用户提交的数据，看数据库里是否注册过，如果注册过，就成功登录并跳转至首页

5. cookie 设置

- 处理登录逻辑时，如果前后端都通过校验，那么使用 Set-Cookie 将用户信息存到 cookie 里
- 页面跳转到首页之后，服务器会读取页面的 cookie，然后展示用户信息到页面
