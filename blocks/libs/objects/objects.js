/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules */
/**
 *
 * @module objects
 * @overview Расширяем методы objects.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.05.23, 12:50
 * @version 2017.05.23, 12:50
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: objects.js 8746 2017-07-13 17:12:11Z miheev $
 *
 * @see {@link objects}
 *
 *    WEB_TINTS\source\libs\bem-core\common.blocks\objects\
 *    WEB_TINTS\source\libs\bem-core\common.blocks\objects\objects.vanilla.js
 *
 */

modules.define('objects', [
], function(provide,
__BASE) {

var hasOwnProp = Object.prototype.hasOwnProperty;

var objects = __BASE.extend({}, __BASE, /** @exports */ /** @lends objects.prototype */  {

    /** isComprised ** {{{ Проверяем, включается ли один объект в другой, как подмножество (с равными значениями ключей)
     * @param {Object} src - Исходный (включаемый) объект
     * @param {Object} [tgt] - Объект для сравнения (включающий)
     */
    isComprised : function (src, tgt) {
        var isComprised = true;
        src && Object.keys(src).map(function(key){
            if ( !tgt || tgt[key] === undefined || src[key] !== tgt[key] ) {
                isComprised = false;
            }
        });
        return isComprised;
    },/*}}}*/

    /** walkComprisedInContainer * {{{
     * @param {Object|Array} container - Контейнер, в котором ищем объекты
     * @param {Object} tgt - Контейнер, в котором ищем объекты
     * @param {Function} fn callback
     * @param {Object} [ctx] callbacks's context
     */
    walkComprisedInContainer : function (container, tgt, fn, ctx) {
        for ( var key in container ) {
            if ( hasOwnProp.call(container, key) && this.isComprised(tgt, container[key]) ) {
                ctx ? fn.call(ctx, container[key], key) : fn(container[key], key);
                return key;
            }
        }
    },/*}}}*/

});

provide(objects);

});

