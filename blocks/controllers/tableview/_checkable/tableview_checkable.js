/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module tableview_checkable
 * @overview tableview_checkable
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.11.22, 17:16
 * @version 2016.11.22, 17:16
 *
*/

modules.define('tableview', [
        'i-bem-dom',
        'next-tick',
        'events__channels',
        'store',
        'project',
        'checkbox',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        nextTick,
        channels,
        store,
        project,
        Checkbox,
        $,
        tableview
    ) {

/*
 *  @exports
 *  @class tableview_checkable
 *  @bem
 */

/**
 *
 * @class tableview_checkable
 * @classdesc Выделение строк в таблице.
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
 * row_checked - Выбрана/удалена из выбранных строка (элемент). Параметры:
 *  - {boolean} checked - Флаг: выбрана ли строка
 *  - {number} row_no - Номер строки
 *  - {DOM,BEM-element} row_elem - Элемент строки
 *  - {number[]} checked_rows - Список номеров выбранных строк (см. params.checked_rows)
 *
 */

provide(tableview.declMod({ modName : 'checkable', modVal : true }, /** @lends tableview_checkable.prototype */{

    // Данные...

    // Методы...

    /** _update_checked_status() ** {{{ Обновить статус отмеченного
     */
    _update_checked_status : function () {

        var tableview = this,
            params = this.params,
            that = this,

            checked_rows_count = params.checked_rows_count = this.get_checked_rows_count(),

            __base = this.__base.apply(this, arguments),

            undef
        ;

        this.setMod('checked_all', checked_rows_count >= params.filtered_items_count);
        this.setMod('checked_none', !checked_rows_count);

        this._update_info();

    },/*}}}*/

    /** get_checked_rows_list() ** {{{ Массив (позиций) выбранных элементов
     * @return {number[]}
     */
    get_checked_rows_list : function () {

        return $.extend([], this.params.checked_rows);
        // return this.params.checked_rows;

    },/*}}}*/
    /** get_checked_rows_count() ** {{{ Количество выбранных строк
     * @return {number}
     */
    get_checked_rows_count : function () {

        return this.params.checked_rows && this.params.checked_rows.length || 0;

    },/*}}}*/
    /** is_row_checked() ** {{{ Выбрана ли строка
     * @return {boolean}
     */
    is_row_checked : function (row_no) {

        return Array.isArray(this.params.checked_rows) && this.params.checked_rows.indexOf(row_no) !== -1 || false;

    },/*}}}*/

    /** _init_body_actions() ** {{{ Действия на строках таблицы
     */
    _init_body_actions : function () {

        var tableview_checkable = this,
            that = this,
            params = this.params,

            __base = this.__base.apply(this, arguments),

            body_container = this._elem('body'),

            // check = this.findChildBlock(body_container, 'checkbox'),
            checkboxes = $(body_container).find('.checkbox'),

            /*{{{*/capture_click_event = function (e) {

                Array.isArray(params.checked_rows) || ( params.checked_rows = [] );

                var
                    checkbox_dom = $(this),
                    checkbox = checkbox_dom.bem(BEMDOM.entity('checkbox')),
                    row_dom = checkbox_dom.closest('.tableview__bodyrow'),
                    row_elem = that.elemify(row_dom, 'bodyrow'),
                    row_no = Number(row_dom.attr('id')),
                    checked_index = params.checked_rows.indexOf(row_no),
                    set_checked = ( checked_index === -1 ), // Устанавливаем, если не найден
                    undef
                ;

                // Устанавливаем статус строки...
                that.setMod(row_elem, 'checked', set_checked);
                // ...и чекбокса (через next-tick)
                nextTick(function(){
                    checkbox.setMod('checked', set_checked);
                });

                // Изменяем содержимое списка выделнных строк
                if ( set_checked ) {
                    if ( checked_index === -1 ) {
                        params.checked_rows.push(row_no);
                        params.checked_rows.sort();
                    }
                }
                else {
                    if ( checked_index !== -1 ) {
                        params.checked_rows.splice(checked_index, 1);
                    }
                }

                // Дёргаем событие
                that._emit('row_checked', {
                    row_no : row_no,
                    checked : set_checked,
                    row_elem : row_elem,
                    checked_rows : params.checked_rows,
                });

                that._update_checked_status();

                // ??? Надо ли сохранять список выбранных элементов?

            },/*}}}*/

            capture_saved_disable_click = null,

            /*{{{*/capture_end_event = function (e) {

                that.disable_click = capture_saved_disable_click;

            },/*}}}*/
            /*{{{*/capture_start_event = function (e) {

                capture_saved_disable_click = that.disable_click;
                that.disable_click = true;

            },/*}}}*/

            /*{{{*/capture_dumb_event = function (e) {
                return false;
            },/*}}}*/

            undef
        ;

        checkboxes.on('pointerenter', capture_start_event);
        checkboxes.on('pointerleave', capture_end_event);
        checkboxes.on('pointerup', capture_click_event);

        // Предохраняемся от передёргивания nicescroll
        checkboxes.on('pointerdown', capture_dumb_event);

    },/*}}}*/

    /** _check_all() ** {{{ Установить или сбросить все элементы
     * @param {boolean} set_or_clear - Флаг: установить или сбросить все элементы
     */_check_all : function (set_or_clear) {

        var tableview_checkable = this,
            that = this,
            params = this.params,

            undef
        ;

        Array.isArray(params.checked_rows) || ( params.checked_rows = [] );

        // Очистить массив
        params.checked_rows.length && params.checked_rows.splice(0,params.checked_rows.length);

        // Если устанавливаем все элементы...
        if ( set_or_clear ) {

            // Если установлен фильтр...
            if ( this._filter_controller ) {
                // ...то копируем список отфильтрованных элементов
                $.extend(params.checked_rows, this._filter_controller.get_filtered_rows_list());
            }
            // Иначе устанавливаем все элементы подряд...
            else {
                for ( var n=0; n<this._dataloader.get_total_items_count; n++ ) {
                    params.checked_rows.push(n);
                }
            }
        }

        this._update_checked_status();

        this._update_data();

    },/*}}}*/

    /** _init_header_actions() ** {{{ Действия на шапке
     */
    _init_header_actions : function () {

        var tableview_checkable = this,
            that = this,
            params = this.params,

            __base = this.__base.apply(this, arguments),

            // checkbox = this.findChildElem('head').findChildBlock(BEMDOM.entity('checkbox')),
            checkboxes = $(this._elem('head')).find('.checkbox'),

            undef
        ;

        // nicescroll hack: Избегаем прокручивания списка при клике не чекбокс в заголовке таблицы
        checkboxes && checkboxes.on('pointerdown', function(e,data){
            return false;
        });
        // Обработка клика после его завершения
        checkboxes && checkboxes.on('pointerup', function(e,data){
            var checkbox = $(this).bem(BEMDOM.entity('checkbox'));
            nextTick(function(){
                var set_check_all = checkbox.hasMod('checked');
                that._check_all( set_check_all );
            });
            return false;
        });

    },/*}}}*/

    /** _get_header_row_items_bemjson() ** {{{ Получаем список элементов заголовка таблицы
     * (Доопределяется в `_checkable`.)
     * @returns {BEMJSON}
     */
    _get_header_row_items_bemjson : function () {

        var tableview_checkable = this,
            that = this,
            params = this.params,

            // Список всех колонок
            columns = this._dataloader.displayable_columns_list(),

            // Получаем XJST из базового метода
            items_bemjson = this.__base.apply(this, arguments),

            check_item = {
                // elem : 'headcheck',
                elem : 'headcell',
                check : true,
                n : -1,
                id : 'check',
            },

            undef
        ;

        items_bemjson.unshift(check_item);

        return items_bemjson;
    },/*}}}*/

    /** _get_bodyrow_items_bemjson() ** {{{ Список элементов строки таблицы
     * row_no {number} - Номер (позиция) строки
     * (Доопределяется в `_checkable`.)
     * @returns {BEMJSON}
     */
    _get_bodyrow_items_bemjson : function (row_no) {

        var tableview_checkable = this,
            that = this,
            params = this.params,

            // Получаем XJST из базового метода
            items_bemjson = this.__base.apply(this, arguments),

            check_item = {
                elem : 'bodycell',
                check : true,
                row_no : row_no,
                n : -1,
                id : 'check',
                checked : this.is_row_checked(row_no),
            },

            undef
        ;

        items_bemjson.unshift(check_item);

        return items_bemjson;
    },/*}}}*/

    /** _get_row_bemjson() ** {{{ Создаём bemjson для строки данных
     * row_no {number} - Номер (позиция) строки
     */
    _get_row_bemjson : function (row_no) {

        var tableview_checkable = this,
            params = this.params,
            that = this,

            // XJST для всей строки
            row_bemjson = this.__base.apply(this, arguments),

            undef
        ;

        if ( this.is_row_checked(row_no) ) {
            row_bemjson.elemMods = $.extend({}, row_bemjson.elemMods, { checked : true });
            row_bemjson.checked = true;
        }

        return row_bemjson;

    },/*}}}*/

    /** _load_stored_params() ** {{{ Восстановить сохранённые значения
     */
    _load_stored_params : function () {

        var tableview_checkable = this,
            that = this,
            params = this.params
        ;

        // NOTE: Вызываем метод базового блока
        this.__base.apply(this, arguments);

        // Получаем сохранённый элемент
        params.checked_rows = store.get(this._store_id+'checked', []);

    },/*}}}*/

    /** initialize() ** {{{ Инициализация блока
     */
    initialize : function (options) {

        var tableview_checkable = this,
            that = this,
            params = this.params
        ;

        // NOTE: Вызываем метод базового блока
        this.__base.apply(this, arguments);

        this._update_checked_status();

    },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок.
     */
    onInited : function() {

        var tableview_checkable = this,
            that = this,
            params = this.params,
            undef
        ;

        // NOTE: Если onInited определён в базовом блоке, то он будет вызван первым помимо js:inited,
        // тогда необходимо вызывать __base.apply, иначе должен быть вызов из js:inited
        // (и __base:apply необходимо вызывать оттуда).

        this.__base.apply(this, arguments);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:checked_all) ** {{{
         */
        checked_all : {
            true : function () {
            },
            '' : function () {
            },
        },/*}}}*/
        /** (js:checked_none) ** {{{
         */
        checked_none : {
            true : function () {
            },
            '' : function () {
            },
        },/*}}}*/

        /** (js:inited) ** {{{ Инициализация системой.
         */
        js : {
            inited : function() {

                // var tableview_checkable = this,
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

}, /** @lends tableview_checkable */{

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


