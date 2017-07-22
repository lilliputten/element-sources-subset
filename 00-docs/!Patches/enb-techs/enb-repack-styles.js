/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals debugger, DBG, project */
/*
 * $Date: 2017-04-16 18:28:53 +0300 (Sun, 16 Apr 2017) $
 * $Id: enb-repack-styles.js 8150 2017-04-16 15:28:53Z miheev $
 *
 * enb-repack-styles
 * ==================
 *
 */
var vfs = require('enb/lib/fs/async-fs');

module.exports = require('enb/lib/build-flow').create()
    .name('enb-repack-styles')
    .target('target', '?.stylesx.css')
    .useSourceFilename('sourceFile', '?.styles.css')
    .optionAlias('stylesFile', 'stylesFileTarget')
    .optionAlias('target', 'destTarget')

    .defineOption('rootPage', 'root') // Страница-приложение, для которой не надо фильтровать блоки
    .defineOption('customBlocks', [ 'custom' ]) // Блоки, которые включаются для обычных страниц

    .defineOption('urlPrefixes', [ 'root', 'libs', 'core', 'static' ]) // Префиксы адресов для замены из project.config[prefix+'CssUrl']

    .builder(function(stylesFileName) {

        // console.info('System', System);
        // console.info('project', project);
        // console.info('project.config', project.config);
        // console.info('libsUrl', project.config.libsUrl);

        // Базовая директория проекта
        var rootDir = __dirname.replace(/[\\]/g, '/').replace(/(([\/])[^\/]*){2}$/,'$2');

        // posix
        var posixStylesFileName = stylesFileName.replace(/[\\]/g, '/');
        var pageId = posixStylesFileName.replace(/^.*\/([^\/\.]*)\..*$/, '$1');

        // Параметр: страница-приложение
        var rootPage = this._rootPage;
        var isRootPageReg = new RegExp('[/]'+rootPage+'\\.[^/]*$');
        var isRootPage = isRootPageReg.test(posixStylesFileName);

        // Параметр: блоки для обычных страниц
        var customBlocks = this._customBlocks;
        var customBlocksReg = new RegExp('^[/\\.]*blocks/('+customBlocks.join('|')+')');

        var urlPrefixes = this._urlPrefixes;
        var urlRegex = new RegExp('(url\\(["\']*)((?:\\.\\.\\/)+|\\/)((' + urlPrefixes.join('|') + ')\\/)([^"\'\\(\\)]*)(["\']*\\))','g');

        // Можно передавать из параметров make...
        // var replaceUrls = {
        //     'core' : '../../',
        // };

        return vfs.read(stylesFileName, 'utf-8')
            .then(function(styles) {

                var result = '';

                styles = styles
                    // Убираем sourcemap
                    .replace(/[ \t\s\r\n]*\/\*# sourceMappingURL=.*?\*\/[ \t\s\r\n]*/gm, '\n')
                    // Преобразовываем имена файлов в метках
                    .replace(/(\/\*\s+)(\S*?)(\s*:(?:begin|end))/g,
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
                    // Фильтруем блоки
                    .replace(/\/\* (.*?)\s*:begin \*\/\s*([\S\s]*?)\s*\* \1:\s*end \*\/[\n\r\s]*/gm,
                      function (match, url, contents) {

                        // Включаем только кастомные блоки
                        var includeBlock = customBlocksReg.test(url);

                        // // Для корневой страницы включаем наоборот, только общие блоки
                        // if ( isRootPage ) { includeBlock = !includeBlock; }

                        // Заменяем ссылки...
                        match = match
                            // TODO: Вытащить в конфигурацию
                            // .replace(/(url\(["']*)((?:\.\.\/)+|\/)((blocks|deps|root|libs|core|static)\/)([^"'\(\)]*)(["']*\))/g,
                            .replace(urlRegex,
                              function(
                                match,       // Вся найденная строка
                                prefix,      // Начало строки: 'url('
                                oldRoot,     // Старый корень адреса: '/', '../'
                                pathStart,   // Начало адреса: 'libs/'
                                firstFolder, // Папка верхнего уровня: 'libs'
                                url,         // Адрес ресурса: 'bem-components/...'
                                postfix      // Конец строки: ')'
                              ) {

                                // console.info('url ::',
                                //     'prefix:', prefix,
                                //     'oldRoot:', oldRoot,
                                //     'pathStart:', pathStart,
                                //     'firstFolder:', firstFolder,
                                //     'url:', url,
                                //     'postfix:', postfix,
                                //     ''
                                // );

                                // Если найден адрес для замены (по 'firstFolder': напр., 'libsUrl' для 'libs')
                                // в конфигурации, то заменяем oldRoot + pathStart + firstFolder на
                                // значение из конфигурации.
                                var newFirstFolder = project.config[firstFolder+'CssUrl'] || project.config[firstFolder+'Url'];
                                if ( newFirstFolder ) {
                                    return prefix + newFirstFolder + url + postfix + ' /* ' + match + ' */';
                                }
                                return match;
                            })
                        ;

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

                return '/* '+pageId+'.stylesx.css */\n'
                    + ( ( isRootPage ) ? styles : result )
                ;

            })
            .fail(function(data) {
                console.log('Fail with: ', data);
            });
    })
    .createTech();
