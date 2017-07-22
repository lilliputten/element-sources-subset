/* jshint camelcase: false, unused: false */
/* globals modules, project */
/**
 *
 * @module querystring
 * @overview Расширяем методы querystring.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.22, 12:51
 * @version 2017.04.13, 14:05
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: querystring.js 8746 2017-07-13 17:12:11Z miheev $
 *
 * @see {@link querystring}
 *
 *    WEB_TINTS\source\libs\bem-core\common.blocks\querystring\
 *    WEB_TINTS\source\libs\bem-core\common.blocks\querystring\querystring.vanilla.js
 *
 */

modules.define('querystring', [
    'objects'
], function(provide,
    objects,
__BASE) {

var querystring = Object.assign({}, __BASE, /** @exports */ /** @lends querystring.prototype */  {

    /**
     * Дополняем станадртную ф-цию parse
     * @param {string} str
     * @returns {object}
     */
    parse : function (str) {

        // Удаляем символ '?' в начале строки
        if ( typeof str === 'string' && str.indexOf('?') === 0 ) {
            str = str.substr(1);
        }

        return __BASE.parse(str);

    },

});

provide(querystring);

});

