/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module tableview
 * @overview tableview
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.10.31 13:31
 * @version 2017.05.22, 13:56
 *
 * $Id: tableview.js 8746 2017-07-13 17:12:11Z miheev $
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 *
*/
modules.define('tableview', [
        'i-bem-dom',
        'dom',
        'next-tick',
        'events',
        'events__channels',
        'nicescroll',
        'vow',
        'store',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        dom,
        nextTick,
        events,
        channels,
        nicescroll,
        vow,
        store,
        $
    ) {

/*
 * @exports
 * @class tableview
 * @bem
 */

/**
 *
 * @class tableview
 * @classdesc __INFO__
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * Параметры инициализации (initialize())
 * ======================================
 *
 * info_container - Контейнер (блок), в котором происходит поиск элементов для обновления параметров статистики
 * (пока (?) предполагается, что они должны находиться в одном блоке). Список обновляемых элементов:
 *
 *  - info_checked_count - Количество выбранных элементов.
 *  - (потенциально) info_selected_count - Количество выделенных элементов (не путать с checked*).
 *  - info_total_count - Всего элементов в контроллере данных.
 *  - info_filtered_count - Количество отфильтрованных элементов.
 *  - info_show_count - Количество показанных в данный момент элементов.
 *  - info_scanned_count - Количество просканированных (в последний раз?) элементов.
 *
 * См. контроллеры
 * ===============
 *
 *  - WEB_TINTS/project/blocks/interface/dataloader/dataloader.js
 *  - WEB_TINTS/project/blocks/interface/box_actions/_filters/box_actions_filters.js
 *
 */

provide(BEMDOM.declBlock(this.name, /** @lends tableview.prototype */ {

    /** _getDefaultParams ** {{{ */
    _getDefaultParams : function () {
        return {
            criticalMods : [
                'checkable',
                'hoverable',
                'mode',
                'resizable',
                'selectable',
                'vpadded',
            ],
        };
    },/*}}}*/

    /** getCriticalMods ** {{{ Объект, описывающий критичные модификаторы блока. Используем вместо getMods */
    getCriticalMods : function () {

        var that = this,
            mods = this.params.criticalMods.reduce(function(mods, modName){
                mods[modName] = that.getMod(modName);
                return mods;
            }, {})
        ;

        return mods;

    },/*}}}*/

    /** _update_info() ** {{{ Обновить информацию
     * TODO 2016.10.19, 20:39 -- Проверять, все ли выбранные объекты входят в число отфильтрованных? (Если выбран объект не из числа отфильтрованных???)
     */
    _update_info : function () {

        var tableview = this,
            params = this.params,
            that = this,

            container = this._info_container,

            undef
        ;

        // Если не задан блок для вывода статистики
        if ( !container ) { return; }

        container.domElem && ( container = container.domElem );

        // Обновляем информацию
        BEMDOM.update(container.find('.info_total_count'), params.total_items_count);
        BEMDOM.update(container.find('.info_filtered_count'), params.filtered_items_count);
        BEMDOM.update(container.find('.info_checked_count'), params.checked_rows_count);
        BEMDOM.update(container.find('.info_show_count'), params.show_no);
        BEMDOM.update(container.find('.info_scanned_count'), params.row_no);

    },/*}}}*/

    /** _init_header_actions() ** {{{ Действия на шапке
     */
    _init_header_actions : function () {

        var tableview = this,
            that = this,
            params = this.params,

            head_container = this._elem('head'),

            undef
        ;

    },/*}}}*/

    /** getColumnsList ** {{{ */
    getColumnsList : function () {

        return this._columns_list || ( this._columns_list = this._dataloader.displayable_columns_list() );

    },/*}}}*/

    /** _get_header_row_items_bemjson() ** {{{ Получаем список элементов заголовка таблицы
     * (Доопределяется в `_checkable`.)
     * @returns {BEMJSON}
     */
    _get_header_row_items_bemjson : function () {

        var tableview = this,
            that = this,
            params = this.params,

            // Список всех колонок
            columns = this.getColumnsList(),

            // Создаём XJST для списка колонок
            itemsBemjson = columns.map(function(column_id,n){
                var
                    column = that._dataloader.column_info(column_id),
                    is_visible = that._dataloader.is_column_visible(column_id),
                    bemjson = {
                        // block : 'tableview',
                        elem : 'headcell',
                        n : n,
                        id : column_id,
                        datasets : column.datasets,
                        title : column.title,
                        show : is_visible,
                        mix : [{ block : 'column_id_'+column_id }],
                    }
                ;
                // Сохраняем индексы используемых колонок
                ( that._column_indices || ( that._column_indices = {} ) )[column_id] = n;
                return bemjson;
                /*
                 * Return sample:
                 *  {
                 *      datasets : undefined,
                 *      elem : 'headcell',
                 *      id : 'typeID',
                 *      mix : [{ block : 'column_id_typeID' }],
                 *      n : 0,
                 *      show : true,
                 *      title : 'Тип КО',
                 *  }
                 *
                 */
            }),

            undef
        ;

        return itemsBemjson;
    },/*}}}*/

    /** _create_header() ** {{{ Создать шапку таблицы
     */
    _create_header : function () {

        var tableview = this,
            that = this,
            params = this.params,

            // Элемент заголовка
            headElem = this._elem('head') || {}
        ;

        try {

            // Если заголовок пуст
            if ( headElem.domElem.is(':empty') ) {

                var

                    // Список всех колонок
                    columns = this.getColumnsList(),

                    // Контент для генерации HTML
                    itemsBemjson = this._get_header_row_items_bemjson(),

                    // Полная строка
                    headBemjson = {
                        block : 'tableview', // 'tableview',
                        mods : this.getCriticalMods(),
                        elem : 'headrow',
                        content : itemsBemjson,
                    },

                    // Создаём html и обновляем элемент
                    head_html = BEMHTML.apply(headBemjson),
                    dom = BEMDOM.update(headElem.domElem, head_html)

                ;

                // Если используется общая ячейка под заголовком, устанавливаем параметр кол-ва объединяемых ячеек
                $(this._elem('underheadcell')).attr('colspan', columns.length);

            }

            // Действия на шапке
            this._init_header_actions();

            // Флаг "заголовок создан"
            this.setMod('headerInited', true);

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _get_row_column_value() ** {{{ Значение для ячейки данных таблицы -> get_row_column_value(column_id, row_no)
     * @param {number} row_no - Номер строки
     * @param {string|number} column_id - Идентификатор колонки
     */
    _get_row_column_value : function (row_no, column_id) {

        var val = this._dataloader.get_row_column_value(column_id, row_no);
        // var val = this._dataloader.get_resolved_data_value_by_row_no(column_id, row_no, true);
        //
        // // Если список значений...
        // if ( Array.isArray(val) ) {
        //     val = val.join(', ');
        // }

        return val;

    },/*}}}*/

    /** _get_bodyrow_one_item_bemjson() ** {{{ Описание одной ячейки таблицы
     * row_no {number} - Номер (позиция) строки
     * (Доопределяется...)
     * @returns {BEMJSON}
     */
    _get_bodyrow_one_item_bemjson : function (row_no, column_id, n) {

        var tableview = this,
            that = this,
            params = this.params,

            // XJST для ячейки
            column = that._dataloader.column_info(column_id),
            is_visible = that._dataloader.is_column_visible(column_id),
            // val = row_data[column_id],
            val = that._get_row_column_value(row_no, column_id),
            bemjson = {
                // block : 'tableview',
                elem : 'bodycell',
                row_no : row_no,
                n : n,
                // width : params.resize_widths[n], // !!! resizable
                id : column_id,
                datasets : column.datasets,
                title : column.title,
                val : val,
                show : is_visible,
            },

            undef
        ;

        return bemjson;
    },/*}}}*/
    /** _get_bodyrow_items_bemjson() ** {{{ Список элементов строки таблицы
     * row_no {number} - Номер (позиция) строки
     * (Доопределяется в `_checkable`.)
     * @returns {BEMJSON}
     */
    _get_bodyrow_items_bemjson : function (row_no) {

        var tableview = this,
            that = this,
            params = this.params,

            // XJST для всех ячеек
            itemsBemjson = this._columns_list.map(function(column_id,n){
                return that._get_bodyrow_one_item_bemjson(row_no, column_id, n);
            }),

            undef
        ;

        return itemsBemjson;
    },/*}}}*/

    /** _get_row_bemjson() ** {{{ Создаём bemjson для строки данных
     * row_no {number} - Номер (позиция) строки
     */
    _get_row_bemjson : function (row_no) {

        var tableview = this,
            params = this.params,
            that = this,

            // XJST для всех ячеек
            itemsBemjson = this._get_bodyrow_items_bemjson(row_no),

            // XJST для всей строки
            row_bemjson = {
                block : 'tableview',
                mods : this.getCriticalMods(),
                elem : 'bodyrow',
                row_no : row_no,
                elemMods : {
                    selected : typeof params.selected !== 'undefined' && ( params.selected === row_no ) ? true : false,
                },
                // checked : this.is_row_checked(row_no),
                content : itemsBemjson,
            },

            undef
        ;

        return row_bemjson;

    },/*}}}*/

    /** _init_body_actions() ** {{{ Действия на строках таблицы
     */
    _init_body_actions : function () {

        var tableview = this,
            that = this,
            params = this.params,

            // head_container = this._elem('head'),

            undef
        ;

    },/*}}}*/

    /** exportData ** {{{ */
    exportData : function (conditions, columns) {

        columns = columns || this._columns_list;

        var tableview = this,
            params = this.params,
            that = this,

            // Всего элементов в контроллере данных
            total_items_count = this._dataloader.get_total_items_count(),
            // Всего элементов прошло фильтры
            filtered_items_count = this._filter_controller ? this._filter_controller.get_filtered_items_count() : total_items_count,

            // Здесь накапливаем XJST для вывода элементов (строк)
            rows = [],

            row_no = 0,

            undef
        ;

        try {

            Array.from(Array(total_items_count)).map(function(undef, row_no){
                // ...Если строка проходит фильтры...
                if ( !this._filter_controller || this._filter_controller.is_row_filtered(row_no) ) {
                    var row = this._columns_list.map(function(column_id,n){
                        return this._get_row_column_value(row_no, column_id);
                    });
                    rows.push(row);
                }
            });

            return rows;
        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _create_content ** {{{ Обновляем содержимое таблицы
     * @param {object} data - Данные для показа колонок
     * @param {boolean} append_mode - Режим добавления данных
     */
    _create_content : function (data, append_mode) {

        var tableview = this,
            params = this.params,
            that = this,

            // // Счётчик показанных элементов.
            // // Не нулевой, если нет контроллера постраничного вывода, установлен режим добавления
            // // и уже что-то было выведено, -- тогда добавляем записи.
            // show_no = ( !this._pager_controller && append_mode && params.show_no ) ? params.show_no : 0, // Показано (уже) элементов на экране
            //
            // // Строка (номер эл-та) с которой начинаем просмотр/вывод.
            // // Зависит от наличия пагинатора или режима добавления.
            // // Если используется пагинатор, то позиция хранится в нём.
            show_no = this._pager_controller ? this._pager_controller.get_position() : ( append_mode && params.show_no ) ? params.show_no : 0, // Позиция, с которой показываем данные
            row_no = this._filter_controller ? this._filter_controller.get_nth_filtered_row_no(show_no) : show_no,

            // Количество записей на экран
            page_size = this._pager_controller ? this._pager_controller.get_objects_per_page() : this._page_size,
            // Рссчитываем, когда прекратить вывод
            show_stop = show_no + page_size,
            // Всего элементов в контроллере данных
            total_items_count = this._dataloader.get_total_items_count(),
            // Всего элементов прошло фильтры
            filtered_items_count = this._filter_controller ? this._filter_controller.get_filtered_items_count() : total_items_count,

            // Здесь накапливаем XJST для вывода элементов (строк)
            rows_bemjson = [],
            listed_rows = [],

            undef
        ;

        try {

            // Сбрасываем выделенные объекты, если что-то изменилось (показываем заново).
            // Только если нет постраничного контроллера и не режим добавления.
            if ( !this._pager_controller && !append_mode ) {
                params.checked = [];
            }

            // Добавляем строки прошедшие фильтр...
            while ( ( !show_stop || show_no < show_stop ) && row_no < total_items_count ) {
                // ...Если строка проходит фильтры...
                if ( !this._filter_controller || this._filter_controller.is_row_filtered(row_no) ) {
                    // ...Добавляем её к выводимым на экран
                    rows_bemjson.push(this._get_row_bemjson(row_no, append_mode));
                    listed_rows.push(row_no); // debug?
                    // ...Увеличиваем счётчик выведенных строк
                    show_no++;
                }
                // ...Увеличиваем счётчик просмотренных строк
                row_no++;
            }

            // Выводим  на экран
            var container = this._elem('body') || {},
                new_rows_html = BEMHTML.apply(rows_bemjson),
                bemdom_func = ( append_mode ) ? BEMDOM.append : BEMDOM.update,
                dom = bemdom_func.call(BEMDOM, container.domElem, new_rows_html)
            ;

            // Сохраняем параметры состояния страницы для вывода информации
            // (и последующего вывда в ржиме добавления?)
            params.show_no = show_no;
            params.row_no = row_no; // ???
            params.total_items_count = total_items_count;
            params.filtered_items_count = filtered_items_count;
            // params.checked_rows_count = params.checked && params.checked.length || 0;

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _update_data() ** {{{ Обновить данные в таблице
     * @param {object} data - Данные для показа колонок
     * @param {boolean} append_mode - Режим добавления данных
     */
    _update_data : function (data, append_mode) {

        var tableview = this,
            params = this.params,
            that = this,

            undef
        ;

        try {

            // Создаём шапку, если ещё не создана...
            if ( !this.getMod('headerInited') ) {
                this._create_header();
            }

            // Обновляем содержимое таблицы
            this._create_content(data, append_mode);

            // Действия пользователя
            this._init_body_actions();

            // Обновляем информацию
            this._update_info();

            // Если есть пагинатор, то обновляем его...
            this._pager_controller && this._pager_controller.update();

            // Выключаем заставку (включается в `update()` перед запросом `resolve_columns()`)
            this._screenholder && this._screenholder.ready();

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** update_column_show_status() ** {{{ Обновить статус показа (`show`) колонки таблицы.
     * @param {number|string} column - Индекс или идентификатор колонки
     */
    update_column_show_status : function (column, only_header) {

        var tableview = this,
            params = this.params,
            that = this,

            is_passed_no = typeof column === 'number',
            column_no = is_passed_no ? column : this._column_indices[column],
            column_id = !is_passed_no ? column : this._columns_list[column],

            is_visible = this._dataloader.is_column_visible(column_id),

            container = only_header ? this._elem('head') : this._elem('table'),

            undef

        ;

        $(container).find('.n_'+column_no).toggleClass('show', is_visible);

    },/*}}}*/

    /** update() ** {{{ Показываем данные
     * @param {boolean} append_mode - Режим добавления данных (не перезаписывам старое содержимое)
     *
     * Вызывается либо из колбека на `show_more` (append_mode=true), либо из `reapply_filters` {@link #reapply_filters} (append_mode=false).
     */
    update : function (append_mode) {

        var tableview = this,
            params = this.params,
            that = this,

            columns = this._dataloader.used_columns_list(),

            undef

        ;

        // Если работаем с фильтрами, но они ещё не инициализированы, рабоать с данными не начинаем.
        if ( this._filter_controller && !this._filter_controller.getMod('filters_created') ) {
            return;
        }

        // Показываем состояние ожидания (сброс в `_update_data` при завершении операции).
        // this._screenholder && this._screenholder.waiting();
        this._screenholder && this._screenholder.ready();

        try {
            // Подтверждаем загруженность необходимых данных
            vow.cast( this._dataloader && this._dataloader.resolve_columns(columns) )
                .then(function(data) {
                    // Выводим данные.
                    that._update_data(data, append_mode);
                })
            ;
        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** reapply_filters() ** {{{ Применить обновлённые фильтры (???)
     */
    reapply_filters : function () {

        var tableview = this,
            params = this.params,
            that = this
        ;

        try {
            return this._filter_controller.prefilter_columns_promise()
                .then(function(data){
                    that.update(false);
                })
                .fail(function(e){
                    console.error(e);
                    /*DEBUG*//*jshint -W087*/debugger;
                })
            ;
        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _load_stored_params() ** {{{ Загружаем сохранённые параметры
     */
    _load_stored_params : function () {

        var tableview = this,
            that = this,
            params = this.params
        ;

        // resizable...
        // params.resize_widths = store.get(this._store_id + 'resize_widths', []);

    },/*}}}*/

    /** initialize() ** {{{ Инициализация блока
     */
    initialize : function (options) {

        options = options || {};

        var tableview = this,
            that = this,
            params = this.params
        ;

        // // Инициализация -- только один раз!
        // if ( this._inited ) { return; } else { this._inited = true; }

        this._id = params.id = this._id || options.id || params.id || 'default';
        this._store_id = params.id + '_tableview_';

        this._view_controller = this;
        // this._view_controller || ( this._view_controller = options.view_controller || this.findParentBlock(BEMDOM.entity('view_controller')) || this );

        this._options || ( this._options = options );
        // this._page_size || ( this._page_size = options.page_size || params.page_size || 10 );

        // Вытаскиваем необходимые (?) связанные контроллеры и элементы
        // this._dicts_controller || ( this._dicts_controller = options.dicts_controller || app );
        this._dataloader || ( this._dataloader = options.dataloader || this.findParentBlock(BEMDOM.entity('dataloader')) );
        this._filter_controller || ( this._filter_controller = options.filter_controller || this.findParentBlock(BEMDOM.entity('filter_controller')) );
        this._pager_controller || ( this._pager_controller = options.pager_controller || this.findParentBlock(BEMDOM.entity('pager_controller')) );

        this._info_container || ( this._info_container = options.info_container );

        this._screenholder || ( this._screenholder = options.screenholder || this.findChildBlock(BEMDOM.entity('screenholder')) );

        // Загружаем сохранённые параметры
        this._load_stored_params();

        // Действия на связанных контроллерах (на всякий случай с nextTick)
        nextTick(function() {

            // Пагинатор...
            if ( that._pager_controller ) {
                // При инициализации
                that._pager_controller._events().on('pager_inited', function(e, data) {
                    that.update();
                });
                // Изменение номера страницы пагинатора
                that._pager_controller._events().on('page_number_changed', function(e, data) {
                    that.update();
                });
                // Иземенение кол-ва объектов на страницу
                that._pager_controller._events().on('objects_per_page_changed', function(e, data) {
                    that.update();
                });
            }

            // Фильтры...
            if ( that._filter_controller ) {
                that._filter_controller._events().on('apply_filters', function(e, data) {
                    that.reapply_filters();
                });
            }

        });

    },/*}}}*/

    /** _init_static_actions() ** {{{ Действия пользователя и обработка событий.
     */
    _init_static_actions : function() {

        // var tableview = this,
        //     params = this.params;

        // ...

    },/*}}}*/
    /** _init_static_dom() ** {{{ Действия пользователя и обработка событий.
     */
    _init_static_dom : function() {

        // Скроллбар
        this._nicescroll = nicescroll.init(this._elem('container')); // ???

    },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок.
     */
    onInited : function() {

        var tableview = this,
            params = this.params;

        this._init_static_dom();
        this._init_static_actions();

        // Если статический контент, то инициализируем действия (сделать то же в других модах: selectable, checkable?)
        if ( this.getMod('static') ) {
            this._init_body_actions();
        }

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой.
         */
        js : {
            inited : function () {

                // var tableview = this,
                //     that = this,
                //     params = this.params,
                //     undef
                // ;

                this.onInited();
            },
        },/*}}}*/

    },/*}}}*/

})); // provide

}); // module

