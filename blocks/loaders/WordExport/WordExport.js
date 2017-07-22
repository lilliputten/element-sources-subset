/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @overview Загрузчик плагина `jquery.WordExport`.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.20, 13:57
 * @version 2016.09.20, 13:57
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: WordExport.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * @see project/libs/jquery.WordExport/jquery.WordExport.js
 * @see project/blocks/root/select/_WordExport/select_WordExport.js
 *
 */

modules.define('WordExport', [
        'project__config',
        'project__helpers',
        'i-bem-dom',
        'loader_type_js',
        'FileSaver',
        'jquery'
    ], function(provide,
        config,
        helpers,
        BEMDOM,
        loader,
        FileSaver,
        $,
    __BASE) {

var jsUrl = helpers.expand_path( config.libs.WordExport.js );

loader(
    jsUrl,
    function() {
        provide($.fn.wordExport);
    }
);

});
