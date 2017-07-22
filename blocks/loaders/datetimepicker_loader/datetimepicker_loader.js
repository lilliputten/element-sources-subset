/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: datetimepicker_loader.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */
modules.define('datetimepicker_loader', [
        'project__config',
        'project__helpers',
        'i-bem-dom',
        'loader_type_js',
        'jquery'
    ], function(provide,
        config,
        helpers,
        BEMDOM,
        loader,
        $
    ) {

var jsUrl = config.libs.datetimepicker.js,
    cssUrl = config.libs.datetimepicker.css;

BEMDOM.append($('head'), '<link rel="stylesheet" href="' + helpers.expand_path(cssUrl) + '" />');

loader(
    helpers.expand_path(jsUrl),
    function() {

        $.datetimepicker.setLocale('ru');

        provide($.datetimepicker);

    }
);

});
