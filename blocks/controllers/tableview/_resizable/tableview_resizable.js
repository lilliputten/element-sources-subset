/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 *  @module tableview_resizable
 *  @overview tableview_resizable
 *  @author lilliputten <lilliputten@yandex.ru>
 *  @since 2016.11.25 12:17
 *  @version 2016.11.25 12:17
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: tableview_resizable.js 8746 2017-07-13 17:12:11Z miheev $
 *
*/

modules.define('tableview', [
        'i-bem-dom',
        // 'events__channels',
        'store',
        'project',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        // channels,
        store,
        project,
        $,
        tableview
    ) {

/*
 *  @exports
 *  @class tableview_resizable
 *  @bem
 */

/**
 *
 *  @class tableview_resizable
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

provide(tableview.declMod({ modName : 'resizable', modVal : true }, /** @lends tableview_resizable.prototype */{

    // Данные...

    /** Селектор для нахождения ячейки заголовка */
    cell_selector : '.tableview__headcell',

    // /** Селектор для нахождения "обычной" ячейки заголовка */
    // normal_cell_selector : '.tableview__headcell:not(.tableview__headcheck)',

    /** Минимальная ширина колонки */
    min_resize_width : 50,

    /** Сдвиг управлятор изменения ширины колонки
     * На самом деле половина ширины: handle_offset = Math.floor( handle.outerWidth() / 2 ),
     */
    resize_handle_offset : 2,

    // Методы...

    /** _load_stored_params() ** {{{ Загружаем сохранённые параметры
     */
    _load_stored_params : function () {

        var tableview = this,
            that = this,
            params = this.params
        ;

        this.__base.apply(this, arguments);

        params.resize_widths = store.get(this._store_id + 'resize_widths', []);

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
            bemjson = this.__base.apply(this, arguments),

            undef
        ;

        // Добавляем парметр ширины ячейки
        bemjson.width = params.resize_widths[n];

        return bemjson;
    },/*}}}*/

    /** _create_header() ** {{{ Создать шапку таблицы
     */
    _create_header : function () {

        var tableview = this,
            that = this,
            params = this.params,

            undef
        ;

        this.__base.apply(this, arguments);

        // Скроллинг
        this._init_scroll_actions();

        // Изменение ширины колонок
        this._init_resize_handles();
        this._init_resize_actions();

    },/*}}}*/

    /** _init_resize_handle_item() ** {{{ Инициализировать или обновить состояние колонки с изменяемой шириной
     * @param {elem} cell - Объект ячейки таблицы заголовка
     */
    _init_resize_handle_item : function (cell) {

        var tableview = this,
            that = this,
            params = this.params,

            // is_number = typeof item === 'number',
            cellDom = cell.domElem, // is_number ? this.domElem.find(this.cell_selector+'.n_'+item) : $(item),
            titleDom = cellDom.find('.title'),
            cellId = cellDom.attr('id'),
            cellNo = Number(cellId), // is_number ? item : Number(cellId),
            handleDom = cellDom.find('.handle'),
            // handle_offset = Math.floor( handleDom.outerWidth() / 2 ),
            cellWidth = params.resize_widths[cellNo] || titleDom.outerWidth() + 1, // cellDom.width(),

            scrollOffsetContainer = this._elem('container'),
            scrollOffset = scrollOffsetContainer.domElem.scrollLeft(),

            undef
        ;

        if ( cellNo >= 0 && cellWidth < this.min_resize_width ) { cellWidth = this.min_resize_width; }

        params.resize_widths[cellNo] = cellWidth;
        this.domElem.find('.n_'+cellNo).css({
            'width': cellWidth,
            'min-width': cellWidth,
            'max-width': cellWidth,
        });

        handleDom.css('margin-left', cellWidth - this.resize_handle_offset - scrollOffset);

    },/*}}}*/

    /** _init_resize_handles() ** {{{ Устанавливаем все ширины и позиции "пермещателей" для заголовка таблицы
     */
    _init_resize_handles : function () {

        var tableview = this,
            that = this,
            params = this.params,
            undef
        ;

        // Устанавливаем все перемещатели
        this.findChildElems('headcell').map(function(elem){
            that._init_resize_handle_item(elem);
        });

    },/*}}}*/

    /** _init_resize_actions() ** {{{ Инициализируем действия по изменению ширины колонок
     */
    _init_resize_actions : function () {

        var tableview = this,
            that = this,
            params = this.params,

            // Объект скролл-контейнера -- получаем значение текущего скролла (на всякий случай -- каждый раз)
            scrollContainer = this._elem('container'),
            // Параметры скролла (вычисляются при resizeStart):
            // текущий скролл, левая, правая позции и ширина контейнера
            // (для отслеживания выхода курсора за его границы)
            scroll_offset,
            scroll_left,
            scroll_right,
            scroll_width,

            // Таблица и её ширина
            // table = this._elem('table'),
            table_width,

            // Элементы и параметры текущей изменяемой колонки:
            // jquery-коллекции "перемещателя", ячейки, номер колонки, флаг последней колонки
            curr_handle,
            curr_cell,
            curr_cell_n,
            is_last_cell,

            // Последняя ширина колонки
            last_width,

            // jquery коллекция всех ячеек текущей колонки -- для одновременного обновления стилей
            all_cells,

            /* scroll_to_pointer() {{{ Скролл к курсору, если он вышел за границы контейнера */
            scroll_to_pointer = function (pointer_x) {

                if ( pointer_x < scroll_left ) {
                    scrollContainer.domElem.scrollLeft( scroll_offset - ( scroll_left - pointer_x ) - 10 );
                    scroll_offset = scrollContainer.domElem.scrollLeft();
                }
                else if ( pointer_x > scroll_right ) {
                    scrollContainer.domElem.scrollLeft( scroll_offset + ( pointer_x - scroll_right ) );
                    scroll_offset = scrollContainer.domElem.scrollLeft();
                }

            },/*}}}*/
            /* setWidth() * {{{ Устанавливаем ширину колонки, хелпер для resize() */
            setWidth = function (width) {

                // Пододвигаем сам "перемещатель" под мышку
                curr_handle.css('margin-left', width - that.resize_handle_offset - scroll_offset);

                // Изменяем ширину всех ячеек колонки
                all_cells.css({
                    'width': width,
                    'min-width': width,
                    'max-width': width,
                });

            },/*}}}*/
            /* resize() * {{{ Обработчик изменения ширины */resize = function (e) {

                var left = e.clientX,
                    curr_cell_left = curr_cell.offset().left,
                    width = left - curr_cell_left,
                    undef
                ;

                if ( width < that.min_resize_width ) {
                    width = that.min_resize_width;
                }

                // Если ширина изменилась...
                if ( width !== last_width ) {

                    // Сохраняем значение текущей ширины колоки
                    params.resize_widths[curr_cell_n] = last_width = width;

                    // Изменяем ширину
                    setWidth(width);

                    // Контролируем позицию скролла (если курсор выходит за границу контейнера)
                    scroll_to_pointer(left);

                }

                return false;
            },/*}}}*/
            /* resizeEnd() * {{{ Обработчик конца изменения */
            resizeEnd = function (e) {

                // Сбрасываем обработчики
                that._domEvents(BEMDOM.doc).un('mousemove', resize);
                that._domEvents(BEMDOM.doc).un('mouseup', resizeEnd);

                // Обновляем все ячейки в заголовке (на всякий случай)
                that._init_resize_handles();
                // that._update_scroll_head();

                // Сохраняем текущие ширины в store
                this.getMod('nostore') || store.set(that._store_id + 'resize_widths', params.resize_widths);

                // Снимаем модификаторы и классы
                curr_cell.removeClass('resizing');
                that._elem('head').delMod('resizing');

                return false;
            },/*}}}*/
            /* resizeStart() * {{{ Обработчик начала изменения ширины */
            resizeStart = function (e) {

                // Пример кода из resizableColumns:
                // this.bindEvents(this.$ownerDocument, ['mousemove', 'touchmove'], this.onPointerMove.bind(this));
                // this.bindEvents(this.$ownerDocument, ['mouseup', 'touchend'], this.onPointerUp.bind(this));

                // Текущий "перемещатель"
                curr_handle = $(this);

                if ( curr_handle.hasClass('check') ) {
                    return false;
                }

                // Получаем текущую ячейку (родитель)
                curr_cell = curr_handle.parent();
                // ...и её номер
                curr_cell_n = Number(curr_cell.attr('id'));

                // Параметры скролла
                scroll_offset = scrollContainer.domElem.scrollLeft();
                scroll_left = scrollContainer.domElem.offset().left;
                scroll_width = scrollContainer.domElem.outerWidth();
                scroll_right = scroll_left + scroll_width;

                // Последняя ли колонка?
                is_last_cell = ( Number(curr_cell_n) === params.resize_widths.length-1 );

                // Последнее значение ширины колонки
                last_width = params.resize_widths[curr_cell_n];

                // Все ячейки текущей колонки (будем обновлять стили всем сразу)
                // all_cells = $(that.domElem).find('.cell.n_'+curr_cell_n);
                all_cells = that.domElem.find('.n_'+curr_cell_n);

                // Классы и модификаторы состояния "изменяем ширину сейчас"
                curr_cell.addClass('resizing');
                that._elem('head').setMod('resizing');

                // События на перетаскивание "перемещателя" и окончание изменения ширины
                that._domEvents(BEMDOM.doc).on('mousemove', resize);
                that._domEvents(BEMDOM.doc).on('mouseup', resizeEnd);

                return false;

            },/*}}}*/

            undef
        ;

        // Событие на начало изменения ширины -- на всех "перемещателях"
        this.domElem.find(this.cell_selector+' .handle').on('mousedown', resizeStart);

    },/*}}}*/

    /** _init_scroll_actions() ** {{{ Обработка скроллинга
     */
    _init_scroll_actions : function () {

        var tableview = this,
            that = this,
            params = this.params,

            headcells = this.domElem.find(this.cell_selector+' > div.title'),
            handle_cells = this.domElem.find(this.cell_selector+' > div.handle'),

            // Переменная для сохранения последней позиции скролла
            last_x = 0,

            update_headcells = function(e) {
                // Если позиция скролла изменилась
                var x = $(e.target).scrollLeft();
                if ( x !== last_x ) {
                    // Все тексты названий колонок просто сдвигаем
                    headcells.css('margin-left', -x);
                    // Все перемещатели пододвигаем к правому краю ячеек (зависит от ширины)
                    handle_cells.map(function(itemNo,item){
                        var n = $(item).attr('id');
                        var offset = params.resize_widths[n] - that.resize_handle_offset;
                        $(item).css('margin-left', -x + offset);
                    });
                    // Сохраняем позицию
                    last_x = x;
                }
            }
        ;

        // Устанавливаем обработчик события
        this._domEvents(this._elem('container')).on('scroll', update_headcells);

    },/*}}}*/

    // /** _actions() ** {{{ Действия пользователя и обработка событий.
    //  */
    // _actions : function() {
    //
    //     var tableview_resizable = this,
    //         that = this,
    //         params = this.params,
    //         undef
    //     ;
    //
    //     this.__base.apply(this, arguments);
    //
    //     // ...
    //
    // },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок.
     */
    onInited : function() {

        var tableview_resizable = this,
            that = this,
            params = this.params,
            undef
        ;

        // NOTE: Если onInited определён в базовом блоке, то он будет вызван первым помимо js:inited,
        // тогда необходимо вызывать __base.apply, иначе должен быть вызов из js:inited
        //
        this.__base.apply(this, arguments);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой. */
        js : {
            inited : function() {

                this.onInited();

            }
        },/*}}}*/

    },/*}}}*/

}, /** @lends tableview_resizable */{

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


