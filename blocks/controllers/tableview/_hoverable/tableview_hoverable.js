/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module tableview_hoverable
 * @overview tableview_hoverable
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.11.21, 16:00
 * @version 2016.12.20, 15:35
 *
*/

modules.define('tableview', [
    // 'tableview__bodyrow',
    'i-bem-dom',
    // 'next-tick',
    // 'events__channels',
    // 'store',
    'project',
    'jquery',
],
function(provide,
    // tableview__bodyrow,
    BEMDOM,
    // nextTick,
    // channels,
    // store,
    project,
    $,
tableview) {

/*
 *  @exports
 *  @class tableview_hoverable
 *  @bem
 */

/**
 *
 * @class tableview_hoverable
 * @classdesc Выбор строк в таблице.
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * События
 * =======
 *
 * row_selected - Выбрана строка (элемент). Параметры:
 *  - {number} row_no - Номер строки
 *  - {DOM,BEM-element} row_elem - Элемент строки
 *
 *
 */

provide(tableview.declMod({ modName : 'hoverable', modVal : true }, /** @lends tableview_hoverable.prototype */{

    /** _init_body_actions() ** {{{ События не теле таблицы */
    _init_body_actions : function () {

        var tableview_hoverable = this,
            params = this.params,
            that = this,

            // NOTE: Вызываем метод базового блока
            __base = this.__base.apply(this, arguments),

            rows = this.findChildElems('bodyrow'),

            undef
        ;

        try {

            // Реакция на курсор мыши...
            this._domEvents(rows).on('mouseover', function(e){
                var row = e.bemTarget;
                row.setMod('hovered');
            });
            this._domEvents(rows).on('mouseout', function(e){
                var row = e.bemTarget;
                row.delMod('hovered');
            });

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    // /** _update_data() ** {{{ Обновить данные в таблице
    //  * @param {object} data - Данные для показа колонок
    //  * @param {boolean} append_mode - Режим добавления данных
    //  */
    // _update_data : function (data, append_mode) {
    //
    //     var tableview_hoverable = this,
    //         params = this.params,
    //         that = this,
    //
    //         // NOTE: Вызываем метод базового блока
    //         __base = this.__base.apply(this, arguments),
    //
    //         undef
    //     ;
    //
    //     try {
    //
    //         // // События на теле таблицы
    //         // this._init_body_actions();
    //
    //     }
    //     catch (e) {
    //         console.error(e);
    //         /*DEBUG*//*jshint -W087*/debugger;
    //     }
    //
    // },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок.
     */
    onInited : function() {

        var tableview_hoverable = this,
            that = this,
            params = this.params,
            undef
        ;

        this.__base.apply(this, arguments);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой.
         */
        js : {
            inited : function() {

                // var tableview_hoverable = this,
                //     that = this,
                //     params = this.params,
                //     undef
                // ;

                // NOTE: Если onInited определён в базовом блоке, то он будет вызван помимо js:inited
                // из onInited, если там есть вызов __base_apply
                // (Если из базового js:inited будет вызван
                // onInited, то сначала будет вызван модицированный метод.)
                //
                // this.__base.apply(this, arguments);

                this.onInited();

            }
        },/*}}}*/

    },/*}}}*/

}, /** @lends tableview_hoverable */{

    // /** live() {{{ Lazy-инициализация.
    //  */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //
    //     return this.__base.apply(this, arguments);
    // }/*}}}*/

})); // provide

}); // module


