/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: socketio.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */
modules.define('socketio', [
        'project__config',
        'project__helpers',
        'i-bem-dom',
        'loader_type_js',
        'jquery',
    ], function(provide,
        config,
        helpers,
        BEMDOM,
        loader,
        $,
    __BASE) {

var jsUrl = helpers.expand_path( config.libs.socketio.js );

loader(
    jsUrl,
    function() {
        provide(window.io);
    }
);

});
