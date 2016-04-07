fis-parser-node-sass
============================

## 安装与使用 

全局安装

```bash
npm install fis-parser-node-sass -g
```

## FIS2
开启插件

```javascript
fis.config.set('modules.parser.sass', 'node-sass');
fis.config.set('modules.parser.scss', 'node-sass');

fis.config.set('roadmap.ext.sass', 'css');
fis.config.set('roadmap.ext.scss', 'css');
```

插件配置

```javascript
fis.config.set('settings.parser.node-sass', {
    // 加入文件查找目录
    include_paths: []
});
```

## FIS3

```js
fis.match('*.scss', {
  rExt: '.css',
  parser: fis.plugin('node-sass', {
    // options...
  })
})
```


