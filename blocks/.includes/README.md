>
> $Date: 2017-03-07 13:52:29 +0300 (Tue, 07 Mar 2017) $
>
> $Id: README.md 7494 2017-03-07 10:52:29Z miheev $
>

.includes
=========

Файл `.includes/all.styl` подключается из **.enb/make**. См. код для технологии **stylus**:

``` javascript
[techs.stylus, {
    target: '?.css',
    sourcemap: true,
    use : function (style) {
        style.import('../../blocks/.includes/all.styl');
        style.define('ENB_MODE', 'DEV');
        style.define('ENB_EXT', '.css');
    },
    // ...
}],
```
