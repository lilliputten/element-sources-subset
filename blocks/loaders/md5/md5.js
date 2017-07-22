/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @overview Загрузчик плагина `jquery.md5`.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.20, 13:57
 * @version 2016.09.20, 13:57
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: md5.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * @see project/libs/jquery.md5/jquery.md5.js
 * @see project/blocks/root/select/_md5/select_md5.js
 *
 */

modules.define('md5', [
        'i-bem-dom',
        'project__config',
        'project__helpers',
        'loader_type_js',
        'jquery'
    ], function(provide,
        BEMDOM,
        config,
        helpers,
        loader,
        $,
    __BASE) {

var jsUrl = helpers.expand_path( config.libs.md5.js );

loader(
    jsUrl,
    function() {
        provide($.md5);
    }
);

});
