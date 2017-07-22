/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals debugger, DBG, project */
/*
 * $Date: 2017-04-16 18:28:53 +0300 (Sun, 16 Apr 2017) $
 * $Id: enb-repack-browser.js 8150 2017-04-16 15:28:53Z miheev $
 *
 * enb-repack-browser
 * ==================
 *
 */
var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('enb-repack-browser')
    .target('target', '?.browserx.js')
    .useSourceFilename('sourceFile', '?.browser.js')
    .optionAlias('browserFile', 'browserFileTarget')
    .optionAlias('target', 'destTarget')

    .defineOption('rootPage', 'root') // Страница-приложение, для которой не надо фильтровать блоки
    .defineOption('customBlocks', [ 'custom' ]) // Блоки, которые включаются для обычных страниц

    .builder(function(browserFileName) {

        // Базовая директория проекта
        var rootDir = __dirname.replace(/[\\]/g, '/').replace(/(([\/])[^\/]*){2}$/,'$2');

        // posix
        var posixBrowserFileName = browserFileName.replace(/[\\]/g, '/');
        var pageId = posixBrowserFileName.replace(/^.*\/([^\/\.]*)\..*$/, '$1');

        // Параметр: страница-приложение
        var rootPage = this._rootPage;
        var isRootPageReg = new RegExp('[/]'+rootPage+'\\.[^/]*$')
        var isRootPage = isRootPageReg.test(posixBrowserFileName);

        // Параметр: блоки для обычных страниц
        var customBlocks = this._customBlocks;
        var customBlocksReg = new RegExp('^[/\\.]*blocks/('+customBlocks.join('|')+')');

        return vfs.read(browserFileName, 'utf-8')
            .then(function(browser) {

                var result = '';

                browser = browser
                    // Убираем sourcemap
                    .replace(/[ \t\s\n\r]*\/\/# sourceMappingURL=.*?([\n\r]|$)/gm, '\n')
                    // Преобразовываем имена файлов в метках
                    .replace(/(\/\* (?:begin|end): )(.*)(\s+)/g,
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

                browser = browser
                    .replace(/\/\* begin: (\S*?) \*\/\s*([\S\s]*?)\s*\* end: \1 \*\/[\n\r\s]*/gm,
                      function (match, url, contents) {

                        // Включаем только кастомные блоки
                        var includeBlock = customBlocksReg.test(url);

                        // // Для корневой страницы включаем наоборот, только общие блоки
                        // if ( isRootPage ) { includeBlock = !includeBlock; }

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

                return '// '+pageId+'.browserx.js\n'
                    + ( ( isRootPage ) ? browser : result )
                ;

            })
            .fail(function(data) {
                console.log('Fail with: ', data);
            });
    })
    .createTech();
