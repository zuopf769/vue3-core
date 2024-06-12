import esbuild from "esbuild"; // 打包工具
import minimist from "minimist"; // 命令行参数解析
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url); // 可以在es6中使用require语法
const args = minimist(process.argv.slice(2)); // 解析打包格式和打包模块
const format = args.f || "iife";
const target = args._[0] || "reactivity";

// __dirname在es6模块中不存在需要自行解析
const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = require(`../packages/${target}/package.json`);

esbuild
  .context({
    entryPoints: [resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile: resolve(
      // 输出的文件
      __dirname,
      `../packages/${target}/dist/${target}.js`
    ),
    bundle: true, // 全部打包
    sourcemap: true, // sourcemap源码映射
    format, // 打包格式 esm , cjs, iife
    globalName: pkg.buildOptions?.name, // 全局名配置
    platform: "browser", // 平台
  })
  .then((ctx) => {
    console.log("watching~~~");
    return ctx.watch(); // 监控文件变化
  });
