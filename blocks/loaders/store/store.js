/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: store.js 8762 2017-07-17 11:16:38Z miheev $
 *
 */
modules.define('store', [
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

var jsUrl = helpers.expand_path( config.libs.store.js );

loader(
    jsUrl,
    function() {
        provide(window.store);
    }
);

});
