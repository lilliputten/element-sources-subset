/**
 * enb-beautify-html
 * =================
 *
 * Форматирует *html*-файл в удобочитаемый вид с помощью `js-beautify`
 *
 */
var vfs          = require('enb/lib/fs/async-fs'),
    beautifyHtml = require('js-beautify').html;

module.exports = require('enb/lib/build-flow').create()
    .name('enb-beautify-html')
    .target('target', '?.beauty.html')

    .useSourceFilename('htmlFile', '?.html')
    .optionAlias('htmlFile', 'htmlFileTarget')

    .optionAlias('target', 'destTarget')
    .builder(function(htmlFileName) {

        return vfs.read(htmlFileName, 'utf-8')
            .then(function(html) {
                return beautifyHtml(html, {
                    indent_handlebars: true,
                    indent_inner_html: true,
                    preserve_newlines: false,
                    max_preserve_newlines: 1,
                    brace_style: 'expand',
                    indent_char: ' ',
                    indent_size: 2,
                    wrap_line_length: 0
                } );
            })
            .fail(function(data) {
                console.log('Fail with: ', data);
            });
    })
    .createTech();
