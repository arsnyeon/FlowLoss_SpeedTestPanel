<div align="center">
  <img src="public/favicon.png" alt="FlowLoss_SpeedTestPanel" width="96" height="96">

  <h1>FlowLoss_SpeedTestPanel</h1>

  <p>实时感知网络质量，精准定位连接异常 · 基于 Vue 3 + Vite 构建。</p>
</div>

## 功能特性

- 实时网络测速面板
- 本地 `nodes.json` 节点选择器
- 自定义节点管理
- 单节点测速、节点联测、节点轮换
- 线程数、流量上限、带宽上限配置
- 实时速率图表
- 出口地址展示
- 用户登录、排行榜、测速提交
- 日间模式、夜间模式、跟随系统主题

## 快速开始

```bash
npm install
npm run dev
```

默认本地开发地址：

```text
http://127.0.0.1:3000/
```

## 构建

```bash
npm run build
```

构建产物输出到：

```text
dist/
```

不会构建的用户可以前往 GitHub Releases 下载已经打包好的版本：

[FlowLoss_SpeedTestPanel Releases](https://github.com/arsnyeon/FlowLoss_SpeedTestPanel/releases)

## 节点配置

节点选择器读取本地静态文件：

```text
public/nodes.json
```

示例格式：

```json
{
  "list": {
    "全球[Global]": {
      "Cloudflare Speed": {
        "link": "https://speed.cloudflare.com/__down?bytes=99614720",
        "status": true,
        "webVisible": true,
        "method": "GET",
        "httpProtocol": "AUTO",
        "enhanced": false,
        "testMode": "DOWNLOAD"
      }
    }
  }
}
```

字段说明：

- `link`：测速资源地址
- `status`：是否启用
- `webVisible`：是否在网页端显示
- `method`：请求方法，支持 `GET`、`POST`、`HEAD`
- `httpProtocol`：协议配置，通常保持 `AUTO`
- `testMode`：测速模式，当前网页端主要使用 `DOWNLOAD`

修改 `public/nodes.json` 后刷新页面即可生效。


## 项目结构

```text
frontend-homepage/
├─ public/
│  ├─ nodes.json
│  ├─ favicon.png
│  ├─ icon-fill.png
│  └─ manifest.webmanifest
├─ src/
│  ├─ api/
│  ├─ components/
│  ├─ composables/
│  ├─ router/
│  ├─ stores/
│  ├─ utils/
│  └─ views/
├─ index.html
├─ package.json
└─ vite.config.ts
```


## 合规声明

本项目仅用于合法的网络性能测试、带宽验证与稳定性检测。请勿将本项目用于刷量、恶意耗流、攻击、干扰第三方服务或其他任何违法违规用途。

使用本项目产生的一切行为及后果由使用者自行承担。项目作者不对因不当使用、违规使用或二次分发造成的任何损失、纠纷或法律责任承担责任。
