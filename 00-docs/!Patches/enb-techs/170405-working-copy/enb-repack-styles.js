// ex: set commentstring=/*%s*/ :
/*
 * $Date: 2017-04-07 16:27:32 +0300 (Fri, 07 Apr 2017) $
 * $Id: enb-repack-styles.js 8093 2017-04-07 13:27:32Z miheev $
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
        var isRootPageReg = new RegExp('[/]'+rootPage+'\\.[^/]*$')
        var isRootPage = isRootPageReg.test(posixStylesFileName);

        // Параметр: блоки для обычных страниц
        var customBlocks = this._customBlocks;
        var customBlocksReg = new RegExp('^[/\\.]*blocks/('+customBlocks.join('|')+')');

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
                        // url("../../libs/bem-components/design/common.blocks/spin/_theme/spin_theme_islands.gif")
                        // url("/libs/bem-components/design/common.blocks/theme/_islands/arrow.svg")
                        // TODO 2017.03.07, 08:32 -- Описание замен через конфигурацию
                        // или передача колбека для осуществления замен?
                        match = match
                            // TODO: Вытащить в конфигурацию
                            .replace(/(url\(["']*)((?:\.\.\/)+|\/)((blocks|deps|root|libs|core)\/)([^"'\(\)]*)(["']*\))/g,
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
                                // Возможно лучше получать параметры замены из make?
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
