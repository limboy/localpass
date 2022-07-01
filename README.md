### 简介

`LocalPass` 是一个运行在本地的密码管理工具，使用者只需记住 1 个密码（Master Password），就能生成其他网站所需的密码。

> **Warning**
>
> **此项目仅为演示用。**

### 原理

第一次使用时，需要输入 1 个密码（Master Password），之后只有输入这个密码才能执行后续的操作，密码被 `sha256` 哈希后保存在数据库。

如果要增加密码，输入网站名（或其他自定义名字）后，新密码会通过以下方式生成（只是作为演示，可以生成更复杂的）

```js
base64(sha256(masterPassword + siteName)).substring(0, 12);
```

生成的密码不会保存到数据库，而是运行时计算，所以其他人拿到数据库，如果不知道 Master Password，则无法生成对应的密码。

### 使用方式

确保 `deno` 已经安装（如果没有，可以在[官网](https://deno.land/)找到安装方式），切换到项目所在目录，在终端执行以下命令即可。

```bash
deno run -A LocalPass.js
```

正常运行的话会看到终端输出 `Web server is available at http://127.0.0.1:5555`，然后在浏览器中输入 URL：`http://127.0.0.1:5555` 就能看到页面了。

> **Note**
>
> 选择 `deno` 而不是 `node` 最主要的一个原因是不用跟包管理工具打交道，不用看到 `node_modules`。而且 `deno` 给我的感觉更加 `morden`, 同时也是 `batteries-included`，对一些小项目，周边生态（三方 Library）基本能 cover 住。
