/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module tableview_selectable
 * @overview tableview_selectable
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.11.21, 16:00
 * @version 2016.12.20, 15:35
 *
*/

modules.define('tableview', [
        'i-bem-dom',
        // 'next-tick',
        // 'events__channels',
        'store',
        'project',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        // nextTick,
        // channels,
        store,
        project,
        $,
    tableview) {

/*
 *  @exports
 *  @class tableview_selectable
 *  @bem
 */

/**
 *
 * @class tableview_selectable
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

provide(tableview.declMod({ modName : 'selectable', modVal : true }, /** @lends tableview_selectable.prototype */{

    _rowClickAction : function (e, data) {

        var tableview_selectable = this,
            params = this.params,
            that = this,

            // NOTE: Вызываем метод базового блока
            __base = this.__base.apply(this, arguments),

            undef
        ;

        // Если не установлен флаг "не кликать"
        // (напр., курсор над вложенным чекбоксом -- см. mod:checkable).
        if ( that.disable_click ) {
            return false;
        }

        var selectedRow = that._elem({ elem : 'bodyrow', modName : 'selected' });
        selectedRow && selectedRow.delMod('selected');

        var row = e.bemTarget;//$(e.target).closest('.tableview__bodyrow ');

        row.setMod('selected');

        var row_no = Number( row.domElem.attr('id') );
        params.selected = row_no;
        store.set(that._store_id+'selected', row_no);

        that._emit('row_selected', {
            row_no : row_no,
            row_elem : row,
        });

    },

    /** _init_body_actions() ** {{{ События не теле таблицы */
    _init_body_actions : function () {

        var tableview_selectable = this,
            params = this.params,
            that = this,

            // NOTE: Вызываем метод базового блока
            __base = this.__base.apply(this, arguments),

            rows = this.findChildElems('bodyrow'),

            undef
        ;

        try {

            // Реакция на курсор мыши...
            /* OLD CODE
             * this.unbindFrom(rows, 'click', this._rowClickAction);
             * this.bindTo(rows, 'click', this._rowClickAction);
             */
            this._domEvents(rows)
                .un('click', this._rowClickAction)
                .on('click', this._rowClickAction)
            ;

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
    //     var tableview_selectable = this,
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

    /** _load_stored_params() ** {{{ Восстановить сохранённые значения
     */
    _load_stored_params : function () {

        var tableview_selectable = this,
            that = this,
            params = this.params
        ;

        // NOTE: Вызываем метод базового блока
        this.__base.apply(this, arguments);

        // Получаем сохранённый элемент
        params.selected = store.get(this._store_id+'selected');

    },/*}}}*/

    // /** initialize() ** {{{ Инициализация блока
    //  */
    // initialize : function (options) {
    //
    //     var tableview_selectable = this,
    //         that = this,
    //         params = this.params
    //     ;
    //
    //     // NOTE: Вызываем метод базового блока
    //     this.__base.apply(this, arguments);
    //
    //     // NOTE: В базовом блоке...
    //     // this._id = params.id = this._id || options.id || params.id || 'default';
    //     // this._store_id = params.id+'_tableview_';
    //
    //     // NOTE: Вызывается из базового блока
    //     // this._load_stored_params();
    //
    // },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок.
     */
    onInited : function() {

        var tableview_selectable = this,
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

                // var tableview_selectable = this,
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

}, /** @lends tableview_selectable */{

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


