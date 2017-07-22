/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module dataloader_src_local
 * @overview dataloader_src_local
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.11.30
 * @version 2016.12.01, 13:50
 *
*/

modules.define('dataloader', [
        'jquery',
    ],
    function(provide,
        $,
    dataloader) {

/*
 * @exports
 * @class dataloader_src_local
 * @bem
 */

/**
 *
 * @class dataloader_src_local
 * @classdesc __INFO__
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

provide(dataloader.declMod({ modName : 'src', modVal : 'local' }, /** @lends dataloader_src_local.prototype */{

    /** is_column_loaded() ** {{{ Статус -- загружены ли данные для колонки
     */
    is_column_loaded : function (column_id) {

        return true; // Данные статические. Считаем, что загружено всё.

    },/*}}}*/

    /** column_data() ** {{{ Данные колонки по идентификатору
     * @param {string} column_id - Идентификатор колонки данных
     * @return {array}
     */
    column_data : function (column_id) {

        var dataloader_src_local = this,
            params = this.params,
            that = this,
            undef
        ;

        // TODO: Кэшировать получаемые колонки?
        return params.data.map(function(row_data,n){
            return row_data[column_id];
        });

    },/*}}}*/

    /** get_row_data(row_no) ** {{{ Собрать данные (предварительно загруженные) для одной строки
     * @param {number} row_no - Номер строки
     */
    get_row_data : function (row_no) {

        var dataloader_src_local = this,
            params = this.params,
            that = this,
            undef
        ;

        return params.data[row_no] || {};

    },/*}}}*/

    /** get_raw_data_by_row_no() ** {{{ Значение ячейки данных
     * @param {string} column_id - Идентификатор колонки данных
     * @param {number} row_no - Номер "строки" данных.
     */
    get_raw_data_by_row_no : function (column_id, row_no) {

        var dataloader_src_local = this;

        try {

            var column_info = this.column_info(column_id);

            var val = column_info.back_filter_key ? row_no : this.params.data[row_no][column_id];

            return ( val !== null && val !== undefined ) ? val : '';

        }
        catch(error) {
            throw new Error(error);
        }

    },/*}}}*/

    /** get_total_items_count() ** {{{ Количество записей в колонках
     */
    get_total_items_count : function () {

        var dataloader_src_local = this,
            that = this,
            params = this.params,
            undef
        ;

        return params.data && params.data.length || 0;

    },/*}}}*/

    /** set_local_data() ** {{{ Устанавливаем набор данных
     * @param {object[]} data - Данные
     */
    set_local_data : function (data) {

        var dataloader_src_local = this,
            that = this,
            params = this.params,
            undef
        ;

        // Сохраняем данные
        params.data = data;

    },/*}}}*/

    /** initialize() ** {{{ Инициализируем объект контроллера данных
     * @param {Object} options
     */
    initialize : function (options) {

        var dataloader_src_local = this,
            that = this,
            params = this.params,
            undef
        ;

        options.data && this.set_local_data(options.data);

        this.__base.apply(this, arguments);

    },/*}}}*/

    /** _on_inited() ** {{{ Инициализируем блок.
     */
    _on_inited : function() {

        var dataloader_src_local = this,
            that = this,
            params = this.params,
            undef
        ;

        params.data = [];

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой.
         */
        js : {
            inited : function() {

                var dataloader_src_local = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                // NOTE: Если _on_inited определён в базовом блоке, то он будет вызван помимо js:inited
                //
                this.__base.apply(this, arguments);

                this._on_inited();

            }
        },/*}}}*/

    },/*}}}*/

})); // provide

}); // module


