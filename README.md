# 吉象 PC 后台原型

店主管理 PC 后台的静态交互原型，包含经营总览、店主与开店、等级与权益、状态管理、内容管理和任务中心。

## 本地预览

```bash
python3 -m http.server 8011
```

启动后访问 `http://127.0.0.1:8011/`。

## 验收测试

```bash
node --test acceptance.test.mjs
```
