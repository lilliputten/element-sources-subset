/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 * @module i-bem-dom
 * @description A helper block for creating other blocks that have a DOM representation
 *
 * $Id: i-bem-dom.js 8733 2017-07-11 16:47:15Z miheev $
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 *
 */

modules.define(
    'i-bem-dom',
    [
        'i-bem',
        'objects',
    ],
    function(
        provide,
        BEM,
        objects,
        BEMDOM) {

provide(objects.extend({}, BEMDOM, {

    /** entity ** {{{ Получить описание bem-сущности (блока или элемента) или сформировать эмуляцию описания
     * @param {String} block - Имя блока
     * @param {String} [elem] - Имя элемента
     * @returns {Object} - Описание сущности
     * TODO: this.entities - ?
     * Сформированные описания кешируются в `this._entityLookups`.
     */
    entity : function (block, elem) {

        // Идентификатор
        var id = block;

        // Если элемент...
        if ( elem ) {
            id += '__' + elem;
        }

        // Используем существующее реальное описание, если найдено
        if ( BEM.entities && BEM.entities[id] ) {
            return BEM.entities[id];
        }

        // Иначе создаём собственное описание (или берём закэшированное)

        // Проверяем наличие объекта кэша
        if ( !this._entityLookups ) {
            this._entityLookups = {};
        }

        // Если сущность в кэше не обнаруженаЮ, создаём её
        if ( !this._entityLookups[id] ) {
            var
                idFunc = function () { return id; },
                obj = { getEntityName : idFunc },
                // __bemEntity : true,
                // _blockName : block,
                // _name = elem || block,
                propId = elem ? 'elem' : 'block'
            ;
            obj[propId] = obj;
            this._entityLookups[id] = obj;
        }

        // Возвращаем созданное или кэшированное значение
        return this._entityLookups[id];

    },/*}}}*/

})); // provide end

}); // module end
