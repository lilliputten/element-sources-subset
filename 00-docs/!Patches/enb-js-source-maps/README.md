>
> $Id: README.md 7594 2017-03-13 10:27:54Z miheev $
>
> $Date: 2017-03-13 13:27:54 +0300 (Mon, 13 Mar 2017) $
>

Патчинг модулей технологий генерации клиентского js для enb
===========================================================

Модифицируемые модули
---------------------

enb-source-map@1.9.0

    node_modules/enb-source-map/lib/
    node_modules/enb-source-map/lib/file.js
    node_modules/enb-source-map/lib/utils.js

source-map@0.5.3

    node_modules/source-map/lib/
    node_modules/source-map/lib/source-map-generator.js

**Внимание!** Модифицируемые модули могут включаться как зависимости в `node_modules/enb-js`:

    node_modules/enb-js/node_modules/
    node_modules/enb-js/node_modules/enb-source-map
    node_modules/enb-js/node_modules/source-map

Т.е., надо патчить либо эти модули, либо удалять их, чтобы использовались общие инсталляции.

В `.enb/make.js` технология `enb-js/techs/browser-js` вызвается следующим образом:
```javascript
    // ...
    sourceRoot = process.cwd().replace(/\\/g, '/'),
    // ...
    [techs.browserJs, {
        includeYM: true,
        sourcemap : {
            // Параметр для модифицированной версии `node_modules/enb-source-map/lib/file.js` (см. docs:Patched)
            sourceRoot : sourceRoot, // Базовый путь файлов проекта
            outputSourceRoot : '/', // Подстановка sourceRoot для `sourceMappingURL` в `enb-source-map/lib/utils.js:joinContentAndSourceMap`
            // unpackedData : false, // Упаковывать ли данные для `sourceMappingURL` в `enb-source-map/lib/utils.js:joinContentAndSourceMap`
        },
        compress : false,
        target: '?.browser.pre.js', // Для передачи в препроцессинг технологией borschik (см. ниже)
    }],
    // ...
```

См. также технологию `browser-js`:

    node_modules/enb-js/techs/browser-js.js

