/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals debugger, DBG, project */
/**
 * enb-process-html
 * =================
 *
 * Форматирует *html*-файл в удобочитаемый вид с помощью `js-beautify`
 *
 */

var

    extend = require('extend'),
    vfs = require('enb/lib/fs/async-fs'),
    beautifyHtml = require('js-beautify').html

;

module.exports = require('enb/lib/build-flow').create()
    .name('enb-process-html')
    .target('target', '?.processed.html')

    .useSourceFilename('htmlFile', '?.html')
    .optionAlias('htmlFile', 'htmlFileTarget')

    .defineOption('urlPrefixes', [ 'root', 'libs', 'core', 'static' ]) // Префиксы адресов для замены из project.config[prefix+'Url']
    .defineOption('beautifyOptions', {}) // Параметры для beautifyHtml

    .optionAlias('target', 'destTarget')

    .builder(function(htmlFileName) {

        var beautifyOptions = extend({
            indent_handlebars: true,
            indent_inner_html: true,
            preserve_newlines: false,
            max_preserve_newlines: 1,
            brace_style: 'expand',
            indent_char: ' ',
            indent_size: 1,
            wrap_line_length: 0,
        }, this._beautifyOptions);

        var urlPrefixes = this._urlPrefixes || [];
        var urlRegex = new RegExp('\\b((?:url\\(|src=|href=)["\'])((?:\\.\\.\\/)+|\\/)((' + urlPrefixes.join('|') + ')\\/)([^"\'\\(\\)]*)(["\'])','g');

        return vfs.read(htmlFileName, 'utf-8')
            .then(function(html) {
                return beautifyHtml(html, beautifyOptions);
            })
            .then(function(html) {
                return html
                    .replace(urlRegex,
                      function(
                        match,       // Вся найденная строка
                        prefix,      // Начало строки: 'href="'
                        oldRoot,     // Старый корень адреса: '/', '../'
                        pathStart,   // Начало адреса: 'libs/'
                        firstFolder, // Папка верхнего уровня: 'libs'
                        url,         // Адрес ресурса: 'bem-components/...'
                        postfix      // Конец строки: '"'
                      ) {

                        // Если найден адрес для замены (по 'firstFolder': напр., 'libsUrl' для 'libs')
                        // в конфигурации, то заменяем oldRoot + pathStart + firstFolder на
                        // значение из конфигурации.

                        var newFirstFolder = project.config[firstFolder+'Url'];

                        // var oldUrl = oldRoot + pathStart + url;
                        // var oldBareUrl = pathStart + url;
                        // var newUrl = newFirstFolder + url;
                        // var newBarePrefix = newFirstFolder.replace(/^(\.\.\/|\/)+/, '');
                        // var newBareUrl = ( newFirstFolder + url ).replace(/^(\.\.\/|\/)+/, '');

                        // ( url.indexOf('jquery') !== -1 ) && console.info(':: url ::',
                        //     'oldBareUrl:', oldBareUrl,
                        //     'newBareUrl:', newBareUrl,
                        //     // 'prefix:', prefix,
                        //     // 'oldRoot:', oldRoot,
                        //     // 'pathStart:', pathStart,
                        //     // 'firstFolder:', firstFolder,
                        //     // 'url:', url,
                        //     // 'postfix:', postfix,
                        //     '::',
                        //     '('+firstFolder+')', oldUrl, '->', newUrl
                        // );
                        // DBG( 'url', firstFolder, oldRoot+pathStart+url, '->', newFirstFolder, '|', url );

                        if ( newFirstFolder ) {
                            return prefix + newFirstFolder + url + postfix;
                        }
                        return match;
                    })
                ;
            })

            .fail(function(data) {
                console.log('Fail with: ', data);
            })
        ;
    })
    .createTech();
