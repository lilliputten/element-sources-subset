/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project, window */
/**
 *
 * @overview dataloader
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.10.05 16:50
 * @version 2016.12.01, 13:50
 *
*/

/*
 *
 * @module dataloader
 *
 */
modules.define('dataloader', [
        'i-bem-dom',
        // 'events',
        // 'events__channels',
        'project',
        'vow',
        'store',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // events,
        // channels,
        project,
        vow,
        store,
        $
    ) {

/*
 *
 * @exports
 * @class dataloader
 * @bem
 *
 */

/**
 *
 * @class dataloader
 * @classdesc __INFO__
 *
 * @see Во время разработки см. пример раскрытого функционала в project/blocks/custom/objects_list/objects_list.js
 *
 * TODO
 * ====
 *
 * 2016.11.08, 15:50 -- DONE -- См. событие `after_fetch_data` -- нужно тестировать -- ~~Переделать на работу с событиями прямой вызов `this._filter_controller.reset_data()`~~
 *
 * 2016.11.02, 15:12 -- Возможность использования column_data вместо column_id?
 *
 * 2016.10.07, 15:27 -- Уточнить, не нужно ли использовать прокси-контроллер для данных?
 *
 * ОПИСАНИЕ
 * ========
 *
 * Контроллер предоставления данных.
 *
 * Работает в связке с контроллерами:
 *  - view_controller (...)
 *  - filter_controller - WEB_TINTS/project/blocks/interface/box_actions/_filters/box_actions_filters.js
 *  - dicts_controller (?)
 *
 * ГЕНЕРИРУЕМЫЕ СОБЫТИЯ
 * ====================
 *
 * after_prefetch_data, after_fetch_data - После первичной загрузки данных ({@link #prefetch_data}) или дополнительной загрузки.
 * Передаёт хэш с ключами:
 *  - columns : Загруженные данные (для mod:src:servercolumns)
 *  - dicts : Загруженные словари (для mod:src:servercolumns)
 *  - data : Загруженные словари (для mod:src:local)
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends dataloader.prototype */ {

    /*{{{*/_check : function () {

        if ( !this.hasMod('initialized') ) {
            var message_prefix = 'Не инициализирован контроллер данных ',
                message = message_prefix + this.params.id;
            app.error(message);
            return false;
        }
        return true;

    },/*}}}*/

    /** dicts_to_load() ** {{{ Список словарей для (пред-)загрузки
     * @return {array}
     */
    dicts_to_load : function () {

        // return [];//this.absent_active_filter_dicts_list();

        var columns = this.columns_to_load(),
            dicts = this.get_dicts_for_columns(columns)
        ;

        return dicts;

    },/*}}}*/
    /** columns_to_load() ** {{{ Список обязательных колонок для (пред-)загрузки
     * @return {array}
     */
    columns_to_load : function () {

        var columns = this.used_columns_list();

        return columns;

    },/*}}}*/

    /** test_data_values() ** {{{ Проверка на совпадение значений (например, для фильтров)
     * @param val - Сравниваемое значение
     * @param test_val - Эталонное значение
     * @param exact - Флаг поиска на точное соответствие (для select)
     */
    test_data_values : function (val, test_val, exact) {

        // Если эталонное значение не установлено, то считаем, что значения совпадают
        if ( typeof test_val === 'undefined' || test_val === '' ) { return true; }

        // Если эталонное значение -- список, то сравниваемое значение должно совпасть хотя бы с одним из эталонных...
        if ( Array.isArray(test_val) ) {
            for ( var i=0; i<test_val.length; i++ ) {
                if ( this.test_data_values(val, test_val[i], exact) ) {
                    return true;
                }
            }
            return false;
        }

        // Сравниваем как строки
        val = String(val);
        test_val = String(test_val);

        if ( exact ) { // Если жёсткое сравнение (для select, напр.)
            if ( val === test_val ) { return true; }
        }
        else { // Иначе ищем как подстроку
            if ( val.indexOf(test_val) !== -1 ) { return true; }
        }

        return false;

    },/*}}}*/

    /** get_resolved_dict() ** {{{ Данные предварительно загруженного (!) словаря
     * @param {string} dict_id - Идентификатор словаря.
     */
    get_resolved_dict : function (dict_id) {

        return this._dicts_controller.params.dicts[dict_id] || [];

    },/*}}}*/

    /** get_resolved_dict_single_value() ** {{{ Данные предварительно загруженного (!) словаря
     * @param {string} dict_id - Идентификатор словаря.
     * @param {*} id - Идентификатор значения.
     * @param [{object|string}] related_column - Идентификатор или объект описания связанной колонки данных.
     *
     * TODO 2016.11.18, 15:29 -- К отладке (dict_*_key, *name_key etc...)
     */
    get_resolved_dict_single_value : function (dict_id, val, related_column) {

        var dict = this.get_resolved_dict(dict_id);
        var name_key;

        // Если значение -- объект...
        if ( typeof val === 'object' ) {
            typeof related_column === 'undefined' && ( related_column = dict_id );
            typeof related_column === 'string' && ( related_column = this.column_info(related_column) );
            // Пытаемся получить значение по ключу object_key, если указан
            var object_key = related_column && related_column.object_key || 'ID';
            // if ( val[object_key] ) {
                val = val[object_key];
            // }
        }

        // Если значение находится в словаре...
        if ( dict[val] ) {
            val = dict[val];
            name_key = related_column && related_column.dict_name_key || 'name';
            // Если найденный элемент словаря -- объект, пытаемся взять скаляр по ключу
            if ( typeof val === 'object' && val[name_key] ) {
                val = val[name_key];
            }
        }

        // Дополнительный "пост"-словарь (???)
        if ( related_column && related_column.post_dict ) {
            var post_dict = this.get_resolved_dict(related_column.post_dict);
            if ( post_dict[val] ) {
                val = post_dict[val];
            }
            name_key = related_column && related_column.post_dict_name_key || 'name';
            // Если найденный элемент словаря -- объект, пытаемся взять скаляр по ключу
            if ( typeof val === 'object' && val[name_key] ) {
                val = val[name_key];
            }
        }

        return val;

    },/*}}}*/
    /** get_resolved_dict_value() ** {{{ Данные предварительно загруженного (!) словаря
     * @param {string} dict_id - Идентификатор словаря.
     * @param {*} id - Идентификатор значения.
     * @param [{object|string}] related_column - Идентификатор или объект описания связанной колонки данных.
     */
    get_resolved_dict_value : function (dict_id, val, related_column) {

        var that = this,
            dict = this.get_resolved_dict(dict_id)
        ;

        if ( Array.isArray(val) ) {
            typeof related_column === 'undefined' && ( related_column = dict_id );
            typeof related_column === 'string' && ( related_column = this.column_info(related_column) );
            val = val.map(function(v){
                return that.get_resolved_dict_single_value(dict_id, v, related_column);
            });
        }
        else {
            val = that.get_resolved_dict_single_value(dict_id, val, related_column);
        }

        return val;

    },/*}}}*/

    /** get_resolved_back_dict_value() ** {{{ Данные (предварительно загруженного!) словаря с обратной связью данных
     * @param {string} dict_id - Идентификатор словаря.
     * @param {*} id - Идентификатор значения (row_no?).
     * @param [{object|string}] related_column - Идентификатор или объект описания связанной колонки данных.
     */
    get_resolved_back_dict_value : function (dict_id, id, related_column) {

        var dict = this.get_resolved_dict(dict_id),
            val
        ;

        typeof related_column === 'undefined' && ( related_column = dict_id );
        typeof related_column === 'string' && ( related_column = this.column_info(related_column) );

        var

            // Ключ для эталонного значения (значений) в словаре
            back_key = related_column.back_filter_key,
            // Идентификатор колонки данных, с которой производится сравнение
            cmp_key = related_column.back_filter_compare_key,

            // Данные колонки для сравнения
            cmp_column_data = this.column_data(cmp_key),
            // Сравниваемое значение
            cmp_val = cmp_column_data[id],

            done = null
        ;        // Проходим по словарю и находим вхождения или совпадения сравниваемого значения с эталонным
        for ( var back_dict_id in dict ) {
            if ( dict.hasOwnProperty(back_dict_id) ) {
                var dict_data = dict[back_dict_id],
                    back_val = dict_data[back_key]
                ;
                if ( typeof back_val !== 'undefined' && this.test_data_values(cmp_val, back_val, true) ) {
                    // Нашли одно значение...
                    if ( typeof val === 'undefined' ) {
                        val = back_dict_id;
                    }
                    // ...или второе...
                    else if ( !Array.isArray(val) ) {
                        val = [ val, back_dict_id ];
                    }
                    // ...или последующие...
                    else {
                        val.push(back_dict_id);
                    }
                }
            }
        }

        return val;

    },/*}}}*/

    /** get_pocessed_data_value() ** {{{ Получить подготовленное значение
     * @param {string} column_id - Идентификатор колонки данных
     * @param {*} val - Номер "строки" данных.
     * @param {boolean} user_mode - Режим "пользовательского представления данныъ" -- если установлено, возвращается значение, преобразованное в соответствии с назначенными словарями и/или шаблонами (?).
     *
     * Подразумевается, что данные уже загружены ранее (resolve*).
     */
    get_processed_data_value : function (column_id, val, user_mode) {

        var dataloader = this,
            params = this.params,
            that = this,

            column_info = this.column_info(column_id),
            // column_data = this.column_data(column_id), // Не используется?

            undef

        ;

        // "Обратный" словарь
        if ( column_info.back_filter_key ) {
            // Eg:
            // - back_filter_key : 'MOInfo', // Ключ обратной связанности данные/фильтр
            // - back_filter_compare_key : 'objID', // Колонка данных для сравнения с данными обратной связанности
            // var back_key = column_info.back_filter_key,
            //     cmp_key = column_info.back_filter_compare_key;
            val = this.get_resolved_back_dict_value(column_info.dict, val, column_info);
        }

        // Режим словаря для "человекочитаемых" данных
        if ( user_mode === true ) {
            if ( column_info.dict ) {
                val = this.get_resolved_dict_value(column_info.dict, val, column_info);
            }
            // Тип данных: дата/время
            if ( column_info.type === 'date' || column_info.type === 'time' || column_info.type === 'datetime' ) {
                var format = column_info.format || project.config.formats[column_info.type];
                val = val ? project.helpers.dateformatter.formatDate(new Date(val), format) : '';
            }
            // Тип данных: длительность времени (милисекунды)
            else if ( column_info.type === 'duration' ) {
                val = isNaN(val) && val ? '' : project.helpers.sformat('%t', val);
            }
            // Тип данных: длительность времени (секунды)
            else if ( column_info.type === 'duration_s' ) {
                val = isNaN(val) && val ? '' : project.helpers.sformat('%t', val*1000);
            }
            // Тип данных: логический (да, нет)
            else if ( column_info.type === 'boolean' ) {
                val = val ? 'Да' : 'Нет';
            }
            // Шаблон
            if ( column_info.template ) {
                val = project.helpers.sformat(column_info.template, val);
            }
        }
        // Режим словаря для данных (переключение на другой словарь в режиме 'data'
        else if ( user_mode === 'data' ) {
            if ( column_info.data_dict ) {
                val = this.get_resolved_dict_value(column_info.data_dict, val, column_info);
            }
        }

        return val;

    },/*}}}*/
    /** get_raw_data_by_row_no() ** {{{ Значение ячейки данных
     * @param {string} column_id - Идентификатор колонки данных
     * @param {number} row_no - Номер "строки" данных.
     */
    get_raw_data_by_row_no : function (column_id, row_no) {

        var dataloader = this,
            params = this.params,
            that = this,

            column_info = this.column_info(column_id),
            column_data = this.column_data(column_id),

            val = column_info.back_filter_key ? row_no : column_data[row_no], // || '', // row_no, ???

            undef
        ;

        return ( typeof val !== 'undefined' ) ? val : '';

    },/*}}}*/
    /** get_resolved_data_value_by_row_no() ** {{{ Получить значение
     * @param {string} column_id - Идентификатор колонки данных
     * @param {number} row_no - Номер "строки" данных.
     * @param {boolean} user_mode - Режим "пользовательского представления данных" -- если установлено, возвращается значение, преобразованное в соответствии с назначенными словарями и/или шаблонами (?).
     *
     * Подразумевается, что данные уже загружены ранее (resolve*).
     */
    get_resolved_data_value_by_row_no : function (column_id, row_no, user_mode) {

        var dataloader = this,
            params = this.params,
            that = this,

            val = this.get_raw_data_by_row_no(column_id, row_no),

            undef
        ;

        // DEBUG: Отлаживаем получание данных для определённых колонок
        // if ( column_id === 'typeID' || column_id === 'enabledStateList' ) {
        //     $('.screenholder').hide();
        //     debugger
        // }

        return this.get_processed_data_value(column_id, val, user_mode);

    },/*}}}*/

    /** get_row_column_value ** {{{ Конечное значение ячейки данных
     * @returns {String}
     */
    get_row_column_value : function (column_id, row_no) {

        var val = this._dataloader.get_resolved_data_value_by_row_no(column_id, row_no, true);

        if ( Array.isArray(val) ) {
            val = val.join(', ');
        }

        return val;

    },/*}}}*/

    /** required_columns_list() ** {{{ Список обязательных колонок
     * @return {array}
     */
    required_columns_list : function () {

        var dataloader = this,
            params = this.params,
            required_columns = [];

        // Проходим по всем укзанным колонкам и формируем список незагруженных

        this._columns.forEach(function(column) {
            if ( column.required || column.key ) {
                required_columns.push(column.id);
            }
        });

        return required_columns;

    },/*}}}*/
    /** absent_columns_from_listed() ** {{{ Список незагруженных колонок из указанных
     * @param {array} columns_list - Список колонок, среди которых надо перечислить незагруженные
     * @param {boolean} ignoreUsedStatus - Игнорировать статус 'used'
     * @returns {Array}
     */
    absent_columns_from_listed : function (columns_list, ignoreUsedStatus) {

        var that = this,
            result_list = columns_list.filter(function(column_id){
                return ( ignoreUsedStatus || that.is_used_data_column(column_id) ) && !that.is_column_loaded(column_id);
            })
        ;

        return result_list;

    },/*}}}*/

    /** is_column_required() ** {{{ Статус -- Является ли колонка обязательной (для показа/загрузки)
     */
    is_column_required : function (column_id) {

        var index = this.column_index(column_id),
            column = this._columns[index];

        return ( index !== -1 && ( column.required || column.key ) ) ? true : false;

    },/*}}}*/

    /** is_loadable_column() ** {{{ Является ли колонка загружаемой (не `local`)
     */
    is_loadable_column : function (column_id) {

        var column = this.column_info(column_id);

        // Проверяем, реальная ли колонка и не является ли она "локальной"
        return ( column.id && !column.local ) ? true : false;

    },/*}}}*/
    /** is_used_column() ** {{{ Является ли колонка используемой
     */
    is_used_column : function (column_id) {

        var column = this.column_info(column_id);

        return ( column.key || column.required || column.show || column.filter );// && !column.no_column_data;

    },/*}}}*/
    /** is_used_data_column() ** {{{ Является ли колонка используемой и работающей с данными
     */
    is_used_data_column : function (column_id) {

        var column = this.column_info(column_id);

        return this.is_used_column(column_id) && !column.no_column_data;

    },/*}}}*/
    /** is_column_displayable() ** {{{ Может ли колонка быть показана
     */
    is_column_displayable : function (column_id) {

        var column = this.column_info(column_id),
            not_displayable = ( !column.title || column.not_displayble ) ? true : false;

        return !not_displayable;

    },/*}}}*/
    /** is_column_visible() ** {{{ Видна ли колонка в данный момент
     */
    is_column_visible : function (column_id) {

        var column = this.column_info(column_id);

        return ( ( column.required || column.show ) && !column.hidden && !column.not_displayble );

    },/*}}}*/

    /** used_columns_list() ** {{{ Список колонок, используемых в показе или фильтрах
     * @return {array}
     */
    used_columns_list : function () {

        var that = this;

        return this.all_columns_list().filter(function(column_id){
            return that.is_used_column(column_id);
        });

    },/*}}}*/
    /** used_data_columns_list() ** {{{ Список колонок, для которых наобходима подгрузка данных
     * @return {array}
     */
    used_data_columns_list : function () {

        var that = this;

        return this.all_columns_list().filter(function(column_id){
            return that.is_used_data_column(column_id);
        });

    },/*}}}*/
    /** displayable_columns_list() ** {{{ Список колонок, которые могут быть показаны
     *
     * @return {array}
     */
    displayable_columns_list : function () {

        var that = this;

        return this.all_columns_list().filter(function(column_id){
            return that.is_column_displayable(column_id);
        });

    },/*}}}*/
    /** visible_columns_list() ** {{{ Список колонок, видимых в данный момент
     *
     * @return {array}
     */
    visible_columns_list : function () {

        var that = this;

        return this.all_columns_list().filter(function(column_id){
            return that.is_column_visible(column_id);
        });

    },/*}}}*/

    /** get_dicts_for_columns() ** {{{ Возвращаем все словари, используемые в указанных колонках
     */
    get_dicts_for_columns : function (columns) {

        var that = this,
            dicts = []
        ;

        columns.forEach(function(column_id) {
            var column = that.column_info(column_id);
            // Основной словарь (для показа данных)
            if ( column.dict && dicts.indexOf(column.dict) === -1 ) {
                dicts.push(column.dict);
            }
            // Словари для получения данных
            if ( column.data_dict && dicts.indexOf(column.data_dict) === -1 ) {
                dicts.push(column.data_dict);
            }
            // Словари для подсказок
            if ( column.hints_dict && dicts.indexOf(column.hints_dict) === -1 ) {
                dicts.push(column.hints_dict);
            }
            // Словари для постобработки (?)
            if ( column.post_dict && dicts.indexOf(column.post_dict) === -1 ) {
                dicts.push(column.post_dict);
            }
        });

        return dicts;

    },/*}}}*/

    /** get_object_id_by_row_no() ** {{{ Идентификатор объекта по номеру строки
     * @param {string} row_no - Номер строки
     * @return {number} - Идентификатор объекта
     */
    get_object_id_by_row_no : function (row_no) {

        var dataloader = this,
            params = this.params,

            key_id = this.get_key_column_id(),
            column_data = this.column_data(key_id),
            object_id = column_data[row_no],

            undef
        ;

        return object_id;

    },/*}}}*/
    /** get_row_no_by_object_id() ** {{{ Номер строки по идентификатору объекта
     * @param {string} opbject_id - Номер строки
     * @return {number} - Идентификатор объекта
     */
    get_row_no_by_object_id : function (object_id) {

        var dataloader = this,
            params = this.params,

            key_id = this.get_key_column_id(),
            column_data = this.column_data(key_id),
            row_no = column_data.indexOf(object_id),

            undef
        ;

        return row_no;

    },/*}}}*/

    /** all_columns_list() ** {{{ Список идентификаторов всех колонок
     * @return {string[]}
     */
    all_columns_list : function () {

        return this._columns.map(function(column) {
            return column.id;
        });

    },/*}}}*/
    /** column_info() ** {{{ Получить объект описания колонки по идентификатору
     * @param {string} column_id - Идентификатор колонки данных
     * @return {object}
     */
    column_info : function (column_id) {

        var index = this.column_index(column_id);

        return ( index !== -1 ) && this._columns[index] || {};

    },/*}}}*/
    /** column_id_by_index() ** {{{ Индекс колонки по идентификатору
     * @param {string} column_no - Номер колонки данных
     * @return {number} - Идентификатор колонки
     */
    column_id_by_index : function (column_no) {

        return this._columns[column_no].id;

    },/*}}}*/
    /** column_index(column_id) ** {{{ Индекс колонки по идентификатору
     * @param {string} column_id - Идентификатор колонки данных
     * @return {number}
     */
    column_index : function (column_id) {

        return ( typeof this._columns_indices[column_id] !== 'undefined' ) ? this._columns_indices[column_id] : -1;

    },/*}}}*/
    /** has_column() ** {{{ Статус -- загружены ли данные для колонки
     * @param {string} column_id - Идентификатор колонки данных
     */
    has_column : function (column_id) {

        return typeof this._columns_indices[column_id] !== 'undefined';

    },/*}}}*/

    /** get_key_column_id() ** {{{ Идентификатор колючевого столбца.
     */
    get_key_column_id : function () {

        return this.params.key_column_id;

    },/*}}}*/

    /** resolve_columns() ** {{{ Возвращаем промис с данными (если нужно загружаем нужные колонки).
     * @param {Array} columns - Список колонок данных
     * @returns {Promise}
     */
    resolve_columns : function (columns/* , ignoreUsedStatus */) {

        var dataloader = this,
            params = this.params,
            that = this,
            undef
        ;

        return null;

    },/*}}}*/

    /** _actions() ** {{{ Действия пользователя и обработка событий.
     */
    _actions : function() {

        // var dataloader = this,
        //     params = this.params;

        // ...

    },/*}}}*/

    /** _collect_dicts_to_load() ** {{{ Собираем список словарей для загрузки со всех связанных контроллеров
     * @return {array}
     */
    _collect_dicts_to_load : function () {

        var dataloader = this,
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
            if ( ctx && typeof ctx === 'object' && typeof ctx.dicts_to_load === 'function' ) {
                var ctx_list = ctx.dicts_to_load();
                Array.isArray(ctx_list) && ctx_list.forEach(function(id){
                    if ( list.indexOf(id) === -1 ) {
                        list.push(id);
                    }
                });
            }
        });

        return list;

    },/*}}}*/
    /** _collect_columns_to_load() ** {{{ Собираем список колонок для загрузки со всех связанных контроллеров
     * @return {array}
     */
    _collect_columns_to_load : function () {

        var dataloader = this,
            params = this.params,
            that = this,
            undef
        ;

        // По умолчанию ничего не загружаем.
        // Мод, которому нужна загрузка (src:servercolumns), переопределяет метод и возвращает нужные данные.

        return [];

    },/*}}}*/

    /** prefetch_data() ** {{{ Загружаем необходимые данные для активных фильтров и обязательных колонок
     * @param {boolean} dont_make_event - Не инициировать событие 'after_prefetch_data' (для фильтров и т.д.)
     */
    prefetch_data : function (dont_make_event) {

        var dataloader = this,
            params = this.params,
            that = this,

            columns_to_prefetch = this._collect_columns_to_load(),
            dicts_to_prefetch = this._collect_dicts_to_load(),

            __base = this.__base.apply(this, arguments), // ???

            undef
        ;

        try {

            // Загружаем данные и словари:
            var allPromises = [
                __base,
                this.resolve_columns(columns_to_prefetch),
                this._dicts_controller.resolve_dicts(dicts_to_prefetch),
            ];
            var promise = vow.all(allPromises)
                .spread(function(base,columns,dicts){
                    var data = {
                        columns : columns,
                        dicts : dicts,
                    };
                    dont_make_event || that._emit('after_prefetch_data', data);
                    return data;
                })
            ;
            return promise;

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** start_actions() ** {{{ Запускаем любые действия, необходимые для начала работы контроллера
     * (Должно срабатывать после инициализации всех связанных объектов.)
     * @return {Promise}
     */
    start_actions : function () {

        // Считаем, что по умолчанию загружаем все необходимые данные
        return this.prefetch_data();

    },/*}}}*/

    /** initialize() ** {{{ Инициализируем объект контроллера данных
     * @param {Object} options
     */
    initialize : function (options) {

        var dataloader = this,
            params = this.params;

        this._id = params.id = this._id || options.id || params.id || 'default';
        // params.store_id = params.id+'_columns_ctx_';

        this._dataloader = this;

        // Параметры из переданных опций или параметров блока
        this._options = options;

        // Описания данных столбцов/колонок
        this._columns || ( this._columns = options.columns || app.error('Не задано описание данных для контроллера данных "'+this._id+'"') );

        // Колючевая ("индексируемая") колонка
        params.key_column_id = options.key_column_id || params.key_column_id;

        this._dicts_controller || ( this._dicts_controller = options.dicts_controller || app );
        this._view_controller || ( this._view_controller = options.view_controller );
        this._filter_controller || ( this._filter_controller = options.filter_controller );//|| this.findParentBlock(BEMDOM.entity('filter_controller')) );

        // Обратный индекс
        this._columns_indices = {};
        // this._columns_indices_rev = {};
        for ( var n in this._columns ) {
                if ( this._columns.hasOwnProperty(n) ) {
                var id = this._columns[n].id;
                this._columns_indices[id] = Number(n);
                // this._columns_indices_rev[n] = id;
                if ( !params.key_column_id && this._columns[n].key ) {
                    params.key_column_id = id;
                }
            }
        }

        // Флаг инициализации
        this.setMod('initialized');

    },/*}}}*/

    /** _on_inited() ** {{{ Инициализируем блок.
     */
    _on_inited : function () {

        var dataloader = this,
            params = this.params;

        params.id = params.id || 'default_dataloader';

        // Объект инициации событий - используем собственный эмитер
        this.promises || ( this.promises = {} );

        this._actions();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** js:inited ** {{{ Модификатор `js:inited` -- при инициализации блока системой.
         */
        js : {
            inited : function () {
                this._on_inited();
            },
        },/*}}}*/

    },/*}}}*/

}, /** @lends dataloader */{

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

