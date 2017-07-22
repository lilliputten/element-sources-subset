/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module dataloader_src_servercolumns
 * @overview dataloader_src_servercolumns
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.12.01
 * @version 2016.12.01, 13:50
 *
*/

modules.define('dataloader', [
        // 'i-bem-dom',
        // 'events__channels',
        // 'store',
        // 'request_controller',
        'requestor',
        'vow',
        'project',
        'jquery',
    ],
    function(provide,
        // BEMDOM,
        // channels,
        // store,
        // request_controller,
        requestor,
        vow,
        project,
        $,
    dataloader) {

/*
 *  @exports
 *  @class dataloader_src_servercolumns
 *  @bem
 */

/**
 *
 *  @class dataloader_src_servercolumns
 *  @classdesc __INFO__
 *
 *
 *  TODO
 *  ====
 *
 *  ОПИСАНИЕ
 *  ========
 *
 */

provide(dataloader.declMod({ modName : 'src', modVal : 'servercolumns' }, /** @lends dataloader_src_servercolumns.prototype */{

    /** absent_columns_from_listed() ** {{{ Список незагруженных колонок из указанных
     * @param {array} columns_list - Список колонок, среди которых надо перечислить незагруженные
     * @param {boolean} ignoreUsedStatus - Игнорировать статус 'used'
     * @returns {Array}
     */
    absent_columns_from_listed : function (columns_list, ignoreUsedStatus) {

        var result_list = this.__base.apply(this, arguments);

        return result_list
            // .filter(function(id){
            //     this.is_loadable_column
            // }, this)
            .filter(this.is_loadable_column, this)
        ;

    },/*}}}*/

    /** is_column_loaded() ** {{{ Статус -- загружены ли данные для колонки
     */
    is_column_loaded : function (column_id) {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,
            undef
        ;

        return typeof params.columns_data[column_id] === 'object';

    },/*}}}*/

    /** column_data() ** {{{ Данные колонки по идентификатору
     * @param {string} column_id - Идентификатор колонки данных
     * @return {array}
     */
    column_data : function (column_id) {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,
            undef
        ;

        return params.columns_data[column_id] || [];

    },/*}}}*/

    /** get_row_data(row_no) ** {{{ Собрать данные (предварительно загруженные с помощью `resolve_columns`) для одной строки
     * @param {number} row_no - Номер строки
     */
    get_row_data : function (row_no) {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,

            data = params.columns_data,
            row_data = [],

            undef
        ;

        // TODO: Кэшировать получаемые строки?
        for ( var id in data ) {
            if ( data[id] ) {
                row_data[id] = data[id][row_no];
            }
        }

        return row_data;

    },/*}}}*/

    /** _accept_columns() ** {{{ Принимаем загруженные данные
     * @param {String} columns
     * @param {Object} data
     * @param {Object} options
     *
     * TODO 2016.10.26, 15:05 -- Получать все колонки из `data` -- ???
     */
    _accept_columns : function (columns, data, options) {

        options = options || {};

        var dataloader_src_servercolumns = this,
            params = this.params,
            that = this
        ;

        Array.isArray(columns) && columns.map(function _accept_columns_map (column_id) {
            if ( data[column_id] ) {
                params.columns_data[column_id] = data[column_id];
                // var column_n = params.columns_indices[column_id];
            }
        });

        if ( !options.suppressEvents ) {
            this._emit('after_fetch_data', {
                columns : columns,
                data : data,
            });
        }

    },/*}}}*/
    /** _fetch_columns() ** {{{ Загрузка данных для колонок таблицы (и соотв. фильтров) КО
     *
     * @param {string[]} columns - Список колонок для загрузки.
     *
     * @return {Promise}
     *
     */
    _fetch_columns : function (columns, options) {

        options = options || {};

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,

            op_id = params.request_id || 'fetch_columns',//waiter_id || op_id, //:' + columns.join(',');
            columns_list_info = columns.join(', '),
            waiter_id = op_id + '_' + columns_list_info.replace(/\W+/g,'_') + '_' + Date.now(),
            ajax_url = this._request_url || ( this._request_id && project.helpers.get_remote_url(this._request_id) ),
            ajax_method = ( params.request_id && project.helpers.get_remote_method(params.request_id) ) || 'GET',
            ajax_data = {
                columns: columns.join(','),
            },
            waiter_title = 'Загрузка данных ('+columns_list_info+')',
            waiter_timeout = 3000,
            columns_waiter = requestor.waiterRequest({
                request_id : waiter_id,
                title : waiter_title,
                // request_timeout : waiter_timeout,
                waiter_timeout : waiter_timeout,
                method : ajax_method,
                url : project.helpers.expand_path(ajax_url),
                data : ajax_data,
            }),

            undef
        ;

        // Возвращаем Promise
        // return request_controller.do_request_promise(op_id, ajax_method, ajax_url, ajax_data)
        return columns_waiter
            .then(function _fetch_columns_finish (data) {
                that._accept_columns(columns, data, options);
                return data;
            })
            .always(function _fetch_columns_finish (promise) {
                columns_waiter.Done();
                return promise;
            })
        ;

    },/*}}}*/

    /** resolve_columns() ** {{{ Возвращаем промис с данными (если нужно загружаем нужные колонки).
     * @param {Array} columns - Список колонок данных
     * @param {Object} [options] - Параметры
     * @param {boolean} [options.ignoreUsedStatus] - Игнорировать статус 'used'
     * @returns {Promise}
     *
     */
    resolve_columns : function (columns, options) {

        options = options || {};

        if ( !this._check() ) { return null; } // ???

        var dataloader_src_servercolumns = this,
            params = this.params,
            that = this,

            __base = this.__base.apply(this, arguments), // ???

            absent_columns = this.absent_columns_from_listed(columns, options.ignoreUsedStatus), // Отсутствующие колонки

            _resolve_data = function () { // Создаём набор данных
                var data = {};
                columns.map(function(column_id) {
                    data[column_id] = params.columns_data[column_id];
                });
                return data;
            },

            undef
        ;

        // Если нечего загружать, то положительный промис...
        if ( !absent_columns.length ) {
            return new vow.Promise(function _nothing_to_load_promise (resolve) {
                return resolve(_resolve_data());
            });
        }

        // Возвращаем promise из _fetch_columns и
        return this._fetch_columns(absent_columns, options)
            .then(function _resolve_data_on_success (data) {
                return _resolve_data();
            })
        ;

    },/*}}}*/

    /** _collect_columns_to_load() ** {{{ Собираем список колонок для загрузки со всех связанных контроллеров
     * @return {array}
     */
    _collect_columns_to_load : function () {

        var dataloader_src_servercolumns = this,
            params = this.params,
            that = this,

            ctx_to_poll = [
                this,
                this._view_controller,
                this._filter_controller,
            ],

            list = []

        ;

        ctx_to_poll.forEach(function(ctx){
            if ( typeof ctx === 'object' && typeof ctx.columns_to_load === 'function' ) {
                var ctx_list = ctx.columns_to_load();
                Array.isArray(ctx_list) && ctx_list.forEach(function(id){
                    if ( list.indexOf(id) === -1 ) {
                        list.push(id);
                    }
                });
            }
        });

        return list;

    },/*}}}*/

    /** get_total_items_count() ** {{{ Количество записей в колонках (загруженных ранее с помощью `resolve_columns`)
     */
    get_total_items_count : function () {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,

            data = params.columns_data,
            total_items_count = 0,

            undef
        ;

        if ( typeof data === 'object' ) {
            for ( var id in data ) {
                if ( data[id] && Array.isArray(data[id]) && data[id].length > total_items_count ) {
                    total_items_count = data[id].length;
                }
            }
        }

        return total_items_count;

    },/*}}}*/

    /** initialize() ** {{{ Инициализируем объект контроллера данных
     * @param {Object} options
     */
    initialize : function (options) {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,
            undef
        ;

        this._request_id || ( this._request_id = options.request_id || params.request_id );
        this._request_url || ( this._request_url = options.request_url || params.request_url );

        this.__base.apply(this, arguments);

    },/*}}}*/

    /** _on_inited() ** {{{ Инициализируем блок.
     */
    _on_inited : function() {

        var dataloader_src_servercolumns = this,
            that = this,
            params = this.params,
            undef
        ;

        params.columns_data = {};

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function() {

                var dataloader_src_servercolumns = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this.__base.apply(this, arguments);

                this._on_inited();

            }
        },/*}}}*/

    },/*}}}*/

})); // provide

}); // module
