const Koa           = require("koa");
const KoaRouter     = require("koa-router")();
const KoaLogger     = require("koa-logger");
const Api           = require("./lib/api.js");
//
const config        = require("config");



// движок
const app = new Koa();
app.use(KoaLogger());

// подключаем библиотеку
let api = new Api();

KoaRouter.get ("/", (ctx) => ctx.body = "main page");
KoaRouter.get ("/add", api.add);
app.use(KoaRouter.routes());


app.listen(config.api.port);