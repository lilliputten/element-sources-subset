/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 * @module uri__querystring
 * @description A set of helpers to work with query strings
 *
 * $Id: uri__querystring.js 8762 2017-07-17 11:16:38Z miheev $
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 *
 */

modules.define('uri__querystring', [
    'uri',
],
function(provide,
    uri,
__BASE) {

// var hasOwnProperty = Object.prototype.hasOwnProperty;

var querystring = Object.assign({}, __BASE, /** @exports */ /** @lends querystring.prototype */  {

    /**
     * Дополняем станадртную ф-цию parse
     * @param {string} str
     * @returns {object}
     */
    parse : function (str) {

        // Удаляем символ '?' в начале строки
        var p;
        if ( typeof str === 'string' && ( p = str.indexOf('?') ) !== -1 ) {
            str = str.substr(p + 1);
        }

        return __BASE.parse(str);

    },

});

provide(querystring);

});
