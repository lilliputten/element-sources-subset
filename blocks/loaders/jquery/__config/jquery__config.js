/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/*
 * @module jquery__config
 * @description Configuration for jQuery
 * @version 2017.03.01, 19:35
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: jquery__config.js 8762 2017-07-17 11:16:38Z miheev $
 *
 */

// Если запущен не из-под тестов...
// TODO 2017.03.01, 19:34 -- ???
if ( !window || !window.mochaPhantomJS ) {

modules.define('jquery__config',
    [
        'project__config',
    ], function(provide,
        project__config,
    prev) {

provide({
    /*
     * URL for loading jQuery if it does not exist
     * @type {String}
     */
    // url : 'https://yastatic.net/jquery/2.1.4/jquery.min.js'
    url : project__config.libsUrl + 'jquery/dist/jquery.js'

});

});

}
