// ex: set commentstring=/*%s*/ :
/*
 * $Date: 2017-04-05 13:34:21 +0300 (Wed, 05 Apr 2017) $
 * $Id: enb-repack-bemhtml.js 8070 2017-04-05 10:34:21Z miheev $
 *
 * enb-repack-bemhtml
 * ==================
 *
 */
var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('enb-repack-bemhtml')
    .target('target', '?.bemhtmlx.js')
    .useSourceFilename('sourceFile', '?.bemhtml.js')
    .optionAlias('bemhtmlFile', 'bemhtmlFileTarget')
    .optionAlias('target', 'destTarget')

    .defineOption('rootPage', 'root') // Страница-приложение, для которой не надо фильтровать блоки
    .defineOption('customBlocks', [ 'custom' ]) // Блоки, которые включаются для обычных страниц

    .builder(function(bemhtmlFileName) {

        // Базовая директория проекта
        var rootDir = __dirname.replace(/[\\]/g, '/').replace(/(([\/])[^\/]*){2}$/,'$2');

        // posix
        var posixBemhtmlFileName = bemhtmlFileName.replace(/[\\]/g, '/');
        var pageId = posixBemhtmlFileName.replace(/^.*\/([^\/\.]*)\..*$/, '$1');

        // Параметр: страница-приложение
        var rootPage = this._rootPage;
        var isRootPageReg = new RegExp('[/]'+rootPage+'\\.[^/]*$')
        var isRootPage = isRootPageReg.test(posixBemhtmlFileName);

        // Параметр: блоки для обычных страниц
        var customBlocks = this._customBlocks;
        var customBlocksReg = new RegExp('^[/\\.]*blocks/('+customBlocks.join('|')+')');

        return vfs.read(bemhtmlFileName, 'utf-8')
            .then(function(bemhtml) {

                var result = '';

                // Преобразовываем имена файлов в метках
                bemhtml = bemhtml
                    .replace(/((?:begin|end): )(.*)(\s+)/g,
                      function (match, begin, url, end) {

                        // posix
                        url = url.replace(/[\\]/g,'/');

                        // Откусываем базовый путь проекта
                        if ( url.indexOf(rootDir) === 0 ) {
                            url = url.substr(rootDir.length);
                        }
                        // ...или относительную адресацию
                        else {
                            url = url.replace(/^(\.\.\/)+/, '');
                        }

                        return begin + url + end;
                    })
                ;

                // Фильтруем блоки
                bemhtml = bemhtml
                    .replace(/\/\* begin: (.*?) \*\/\s*([\S\s]*?)\s*\* end: \1 \*\/[\n\r\s]*/gm,
                      function (match, url, contents) {

                        // Включаем только кастомные блоки
                        var includeBlock = customBlocksReg.test(url);

                        // Для корневой страницы включаем наоборот, только общие блоки
                        if ( isRootPage ) { includeBlock = !includeBlock; }

                        // Добавляем блок в результат, убираем из исходного кода (пока не используется)
                        if ( includeBlock ) {
                            result += match;
                            return '';
                        }
                        else {
                            return match;
                        }
                    })
                ;

                // Оборачиваем в стандартный код
                return '// '+pageId+'.bemhtmlx.js\n'
                    // + 'modules.require(["BEMHTML"],\n'
                    // + ' function (BEMHTML) {\n'
                    + 'BEMHTML.compile(\n'
                    + ' function '+pageId+'Templates () {\n\n'
                    + result + '\n'
                    + ' }\n'
                    + ');\n'
                    // + ' }\n'
                    // + ');\n'
                ;

            })
            .fail(function(data) {
                console.log('Fail with: ', data);
            });
    })
    .createTech();
