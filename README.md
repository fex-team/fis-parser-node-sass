fis-parser-sass
============================

## 安装与使用 

全局安装

```bash
npm install fis-parser-sass -g
```

开启插件

```javascript
fis.config.merge('modules.parser', {
    sass : 'sass',
    scss: 'sass'
});

fis.config.merge('roadmap.ext', {
    sass: 'css',
    scss: 'css'
});
```

插件配置

```javascript
fis.config.set('settings.parser.sass', {
    // 加入文件查找目录
    include_paths: []
});
```




## 在项目中使用sass和compass

有了 ``fis-parser-sass`` 就可用用compass了，方法如下：

1. 安装 ``fis-parser-sass`` 插件：

    ```shell
    npm install -g fis-parser-sass
    ```

1. 下载 [compass](https://github.com/Igosuki/compass-mixins) 框架，把框架中的 ``frameworks/compass/stylesheets`` 目录下的文件放到你的项目中，得到目录结构：

    ```
    project
      ┣ compass
      ┣ _compass.scss
      ┣ _lemonade.scss
      ┗ fis-conf.js
    ```

1. 配置fis

    ```javascript
    //项目排除掉_xxx.scss，这些属于框架文件，不用关心
    fis.config.set('project.exclude', '**/_*.scss');
    //scss后缀的文件，用fis-parser-sass插件编译
    fis.config.set('modules.parser.scss', 'sass');
    //scss文件产出为css文件
    fis.config.set('roadmap.ext.scss', 'css');
    ```

1. 新建一个 scss 文件测试一下：

    ```scss
    @import "compass/layout/grid-background";
    
    a {
        background: get-baseline-gradient(rgba(255, 0, 0, 0));
        font-weight: bold;
        text-decoration: none;
        &:hover { text-decoration: underline; }
        body.firefox & { font-weight: normal; }
    }
    ```

1. fis release -d output
1. 文件编译结果

    ```css
    a {
      background: linear-gradient(bottom, #f00 5%, rgba(255, 0, 0, 0) 5%);
      font-weight: bold;
      text-decoration: none; }
      a:hover {
        text-decoration: underline; }
      body.firefox a {
        font-weight: normal; }
    ```
