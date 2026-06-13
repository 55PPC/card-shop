# Card Shop

一个可自部署的数字卡密商城，包含前台商城、订单创建、自动发货、EPay 兼容回调、后台登录和基础管理模块。

## 本地开发

1. 复制环境变量：

```bash
cp .env.example .env
```

2. 配置 `.env`：

```env
DATABASE_URL="postgresql://card_shop:card_shop@localhost:5432/card_shop?schema=public"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me-now"
SESSION_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

3. 安装依赖并启动：

```bash
npm install
npm run db:deploy
npm run db:seed
npm run dev
```

前台：`http://localhost:3000`

后台：`http://localhost:3000/admin`

## 功能

- 前台分类、商品、下单、收银台、订单查询、客服留言。
- 后台登录、分类管理、商品管理、库存导入、订单处理、站点设置、EPay 配置、客服消息。
- 库存按卡密行导入，下单时锁定库存，支付成功后发货。
- EPay 通知会校验签名、金额和交易状态，成功后返回 `success`。
- 未配置数据库时，前台首页会显示演示数据，方便先预览布局。

## 支付配置

后台进入 `设置`，填写 EPay：

- `PID`
- `KEY`
- `支付类型`：如 `alipay`、`wxpay`、`qqpay`
- `提交网关 URL`
- `站点名`

回调地址：

```text
异步通知: https://你的域名/api/payments/epay/notify
同步跳转: https://你的域名/api/payments/epay/callback
```

## Docker 部署

```bash
docker compose up -d --build
```

首次启动会执行：

```bash
npm run db:deploy
npm run db:seed
npm run start
```

上线前务必修改：

- `POSTGRES_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `NEXT_PUBLIC_SITE_URL`

## Nginx

参考 `nginx/default.conf.example`，将 `server_name` 改为你的域名，再反代到本机 `3000` 端口。

## 验证

```bash
npm run typecheck
npm test
npm run build
docker compose config
```
