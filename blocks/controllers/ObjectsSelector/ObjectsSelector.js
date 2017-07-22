/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module ObjectsSelector
 * @overview ObjectsSelector
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.28
 * @version 2016.10.19, 13:58
 *
 * $Id: ObjectsSelector.js 8780 2017-07-18 10:19:14Z miheev $
 * $Date: 2017-07-18 13:19:14 +0300 (Tue, 18 Jul 2017) $
 *
*/

modules.define('ObjectsSelector',
    [
        'i-bem-dom',
        // 'events',
        // 'events__channels',
        'vow',
        'popup_controller',
        'nicescroll',
        'menu',
        'menu__item',
        'store',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        // events,
        // channels,
        vow,
        popup_controller,
        nicescroll,
        Menu,
        MenuItem,
        store,
        $
    ) {

/*
 *  @exports ObjectsSelector
 *  @class ObjectsSelector
 *  @bem
 */

/**
 *
 *  @class ObjectsSelector
 *  @classdesc Управление совокупностью блоков выбора КО.
 *
 *  TODO
 *  ====
 *
 *  ОПИСАНИЕ
 *  ========
 *
 *  `view_controller` для выбора КО @see {@link Report#init_ko_filter}
 *
 *  Внутренние данные
 *  -----------------
 *
 *  {array} params.checked - Список выбранных объектов.
 *
 */

provide(BEMDOM.declBlock(this.name, /** @lends ObjectsSelector.prototype */ {

    /** Колонка данных с ключами (идентификаторами) */
    key_column_id : 'objID',

    /** Идентификатор управляющей кнопки */
    control_button_id : 'ko_filter_control',
    /** Шаблон управляющей кнопки в активном состоянии (есть выбранные элементы) */
    control_button_active_template : 'Выбрано КО: {{info_checked_count}}',
    /** Шаблон управляющей кнопки в пассивном состоянии (нет выбранных элементов) */
    control_button_inactive_template : 'Выбрать КО',

    /** _update_control_button_text ** {{{ */
    _update_control_button_text : function (text) {

        if ( !this._control_button ) {
            var control_button_dom = $('.app .button_id_'+this.control_button_id);
            if ( control_button_dom.length ) {
                this._control_button = control_button_dom.bem(BEMDOM.entity('button'));
            }
        }

        this._control_button && this._control_button._elem('text').domElem.html(text);

    },/*}}}*/

    /** _update_control_button() ** {{{ Обновить вид/состояние управляющей кнопки
     */
    _update_control_button : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            state = ( params.checked &&  params.checked.length ) ? true : false, // Кнопка активна, если есть выбранные элементы
            template = ( state ) ? this.control_button_active_template : this.control_button_inactive_template,

            container = this._info_container,

            process_template_cb = function (match, info_key_id) {
                container.domElem && ( container = container.domElem );
                var info_elem = container.find('.'+info_key_id),
                    replace_text = ( info_elem && info_elem.length ) ? info_elem.html() : match
                ;
                return replace_text;
            },

            button_text = template.replace(/{{(\w+)}}/g, process_template_cb)
        ;

        this._update_control_button_text(button_text);

    },/*}}}*/

    /** _update_info() ** {{{ Обновить информацию
     * TODO 2016.10.19, 20:39 -- Проверять, все ли выбранные объекты входят в число отфильтрованных? (Если выбран объект не из числа отфильтрованных???)
     */
    _update_info : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            container = this._info_container,

            checked_count = ( Array.isArray(params.checked) ) ? params.checked.length : 0

        ;

        if ( !container ) { return; }

        // Обновляем информацию
        container.domElem && ( container = container.domElem );
        BEMDOM.update(container.find('.info_total_count'), params.total_items_count);
        BEMDOM.update(container.find('.info_filtered_count'), params.filtered_items_count);
        BEMDOM.update(container.find('.info_checked_count'), checked_count);//params.checked_rows_count);
        BEMDOM.update(container.find('.info_show_count'), params.show_no);
        BEMDOM.update(container.find('.info_scanned_count'), params.row_no);

        this._update_control_button();

        // Статус состояния выбора (all/none/some)
        var checkedMode = this._get_amount_status(checked_count, params.filtered_items_count);
        this.setMod('checked', checkedMode);

        // Статус количества показанных пунктов (all/none/some)
        var shownMode = this._get_amount_status(params.show_no, params.filtered_items_count);
        this.setMod('shown', shownMode);

        // Статус количества показанных пунктов (all/none/some)
        var filteredMode = this._get_amount_status(params.filtered_items_count, params.total_items_count);
        this.setMod('filtered', filteredMode);

        // this._box_group.setMod('shown_all', row_no >= total_items_count);
        // TODO...

    },/*}}}*/

    /** initMenu ** {{{ Инициализируем (или создаём) меню
     * @param {Boolean} [forceRecreate]
     */
    initMenu : function (forceRecreate) {

        // Меню
        this._menu = this._container.findChildBlock(Menu);
        if ( forceRecreate || !this._menu ) {

            var dom = BEMDOM.append(this._container.domElem, BEMHTML.apply({
                block : 'ObjectsSelector',
                elem : 'menu',
                elemMods : {
                    mode : this.getMod('mode'),
                },
            }));
            this._menu = dom.bem(Menu); // this._container.findChildBlock(Menu);//BEMDOM.entity('menu'));

        }

    },/*}}}*/

    /** init_dom() ** {{{ Инициализируем DOM
     */
    init_dom : function () {

        var ObjectsSelector = this,
            params = this.params
        ;

        // Служебные элементы...

        // Заставка экрана
        // this.screenholder = $(this.panelbox.domElem).children('.screenholder');
        this.screenholder = $(this.domElem).children('.screenholder').bem(BEMDOM.entity('screenholder'));

        // Скроллбар на контейнере с прокруткой
        this._container = this._elem('container');
        this._nicescroll = nicescroll.init(this._container);
        // NOTE: same as $(this._container.domElem).getNiceScroll(0)

        // ???
        // this.initMenu();
        this._menu = this._container.findChildBlock(Menu);

        // Внимание, -- надо находить самый близкий элемент, м.б., ограничивать условие поиска идентифкатором и пр.?
        this._box_group = this.findParentBlock(BEMDOM.entity('box_group'));//box_group_id_ko_filter
        this._box_actions = this._box_group.findChildBlock({ block : BEMDOM.entity('box_actions'), modName : 'id', modVal : 'actions' });
        this._box_filters = this._box_group.findChildBlock({ block : BEMDOM.entity('box_actions'), modName : 'id', modVal : 'filters' });

        // Кнопки...

        this._show_more_button = this._box_actions.findChildBlock({ block : BEMDOM.entity('button'), modName : 'id', modVal : 'show_more' });
        this._check_all_button = this._box_actions.findChildBlock({ block : BEMDOM.entity('button'), modName : 'id', modVal : 'check_all' });
        this._check_none_button = this._box_actions.findChildBlock({ block : BEMDOM.entity('button'), modName : 'id', modVal : 'check_none' });
        this._ok_button = this._box_actions.findChildBlock({ block : BEMDOM.entity('button'), modName : 'id', modVal : 'ok' });

        return true;

    },/*}}}*/

    /** init_actions() ** {{{ Действия пользователя
     */
    init_actions : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this
        ;

        // Кнопки...

        // show_more
        this._show_more_button.domElem.click(function(e) {
            that.update(true);
        });

        // check_all
        this._check_all_button.domElem.click(function(e) {
            // popup_controller.infobox('Выбрать всё')
            that.check_all();
        });

        // check_none
        this._check_none_button.domElem.click(function(e) {
            // popup_controller.infobox('Сбросить всё')
            that.check_none();
        });

        // ok, если кнопка существует
        this._ok_button && this._ok_button.domElem.click(function(e) {
            popup_controller.infobox('Ок!!!');
            // that.ok();
        });

        return true;

    },/*}}}*/

    /** checked_rows_count() ** {{{ Количество выбранных строк
     * @return {number}
     */
    checked_rows_count : function () {

        return this.params.checked.length;

    },/*}}}*/
    /** is_row_checked() ** {{{ Выбрана ли строка
     * @return {boolean}
     */
    is_row_checked : function (row_no) {

        return this.params.checked && this.params.checked.indexOf(row_no)!==-1 || false;

    },/*}}}*/

    /** _get_row_bemjson(data, row_no, appendMode) ** {{{ Создаём bemjson для строки данных
     * @param {object} data - Данные для показа колонок
     * row_no {number} - Номер (ID) строки
     * @param {boolean} appendMode - Режим добавления данных
     */
    _get_row_bemjson : function (row_no, appendMode) {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            row_data = this._dataloader.get_row_data(row_no),

            isChecked = this.is_row_checked(row_no),

            title = row_data.name

        ;

        return {
            // TODO: menu__item!
            block : 'menu',
            elem : 'item',
            // js : true,
            // mods : {
            //     mode : 'check',
            // },
            content : title || '&#151;',
            elemMods : {
                n : row_no,
                checked : isChecked ? true : false,
                theme : 'islands',
                new : true,
            },
            attrs : {
                title : title || '(без названия)',
                // id : 'n'+row_no,
            },
            id : 'n'+row_no,
        };
    },/*}}}*/

    /** get_checked_items_positions() ** {{{ Список отмеченных значений
     * @return {array}
     */
    get_checked_items_positions : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            items_list = []

        ;

        if ( this.params.checked ) {
            for ( var i=0; i<params.checked.length; i++ ) {
                var row_no = params.checked[i];
                items_list.push(row_no);
            }
        }

        // // Выбранные элементы из DOM (не используется):
        // $(this.domElem).find('.menu__item_checked').map(function(n,item){
        //     var id = Number( $(item).attr('id') );
        //     items_list.push(id);
        // });

        return items_list;

    },/*}}}*/
    /** get_checked_items() ** {{{ Список отмеченных значений
     * @return {array}
     */
    get_checked_items : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            key_column = this._dataloader.column_data(this.key_column_id),

            items_list = []

        ;

        if ( this.params.checked ) {
            for ( var i=0; i<params.checked.length; i++ ) {
                var row_no = params.checked[i],
                    row_id = key_column[row_no]
                ;
                items_list.push(row_id);
            }
        }

        return items_list;

    },/*}}}*/

    /** _get_amount_status() ** {{{ Статус количества пунктов от общего числа (none/some/all)
     */
    _get_amount_status : function (count, total) {

        var status = 'some'; // По умолчанию, несколько

        if ( !count || count <=0 ) {
            status = 'none';
        }
        else if ( count >= total ) {
            status = 'all';
        }

        return status;

    },/*}}}*/

    /** _menu_scroll_to_row_no() ** {{{ Прокрутить окно просмотра к элементу (строке данных, по номеру)
     */
    _menu_scroll_to_row_no : function (row_no) {

        var

            that = this,

            container = this._container, // this._elem('container'),

            // menu_elem = this._menu.domElem,
            menuTop = this._menu.domElem.offset().top,
            // menuHeight = this._menu.domElem.outerHeight(),

            // item = this._menu.findChildElem({ elem : 'item', modName : 'n', modVal : row_no }),//.bem(BEMDOM.entity('menu__item')),
            itemElem = this._menu.domElem.find('.menu__item#n'+row_no),//.bem(BEMDOM.entity('menu__item')),
            itemTop = itemElem && itemElem.offset().top,
            itemHeight = itemElem && itemElem.outerHeight(),

            scrollTop = itemTop - menuTop + itemHeight,

            undef
        ;

        this._nicescroll.hide();
        container.domElem.animate({
            scrollTop : scrollTop,
        }, 150, function(){
            that._nicescroll.show();
        });

    },/*}}}*/

    /** setInitList ** {{{ Установить список (идентификаторов) для инициализации списка выбранных элементов
     * @param {Array} list - Список идентификаторов
     */
    setInitList : function (list) {

        var ObjectsSelector = this,
            params = this.params
        ;

        params.initList = list;

    },/*}}}*/

    /** _update_data() ** {{{ Обновляем данные в контейнере
     * @param {object} data - Данные для показа колонок
     * @param {boolean} appendMode - Режим добавления данных
     */
    _update_data : function (data, appendMode) {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            show_no = ( appendMode && params.show_no ) ? params.show_no : 0, // Элементов на экране
            row_no = ( appendMode && params.row_no ) ? params.row_no : 0, // Элементов просмотрено всего

            show_items_count = show_no + this._page_size,
            total_items_count = this._dataloader.get_total_items_count(),
            filtered_items_count = this._filter_controller.get_filtered_items_count(),

            new_rows_bemjson = [],

            first_added_row_no
        ;

        // Если не режим добавления, сбрасываем выделенные объекты, если что-то изменилось (показываем заново)
        if ( !appendMode ) {
            // Если значение списка для инициализации
            if ( Array.isArray(params.initList) ) {
                params.checked = params.initList.map(this._dataloader.get_row_no_by_object_id, this._dataloader);
                delete params.initList; // только первый раз
            }
            // Иначе пустой список
            else {
                params.checked = [];
            }
        }

        try {

            // Добавляем строки (через фильтр)...
            while ( ( !show_items_count || show_no < show_items_count ) && row_no < total_items_count ) {
                if ( this._filter_controller.is_row_filtered(row_no) ) {
                    new_rows_bemjson.push(this._get_row_bemjson(row_no, appendMode));
                    if ( first_added_row_no === undefined ) {
                        first_added_row_no = row_no;
                    }
                    show_no++;
                }
                row_no++;
            }

            params.show_no = show_no;
            params.row_no = row_no;
            params.total_items_count = total_items_count;
            params.filtered_items_count = filtered_items_count;

            if ( !this._menu ) {
                throw new Error('menu block wasn\'t initialized! May be need to use initMenu?');
            }

            // Прячем скроллбар
            this._nicescroll.hide();

            // Если не режим добавления, то предварительно очищаем контейнер
            if ( !appendMode ) {
                BEMDOM.update(this._menu.domElem, {});
                this._menu._dropElemCache();
                delete this.params.lastClicked;
            }
            // Обновляем данные
            BEMDOM.append(this._menu.domElem, BEMHTML.apply(new_rows_bemjson));
            appendMode && first_added_row_no !== undefined && this._menu_scroll_to_row_no(first_added_row_no);
            delete this._menu._items; // NOTE: См. menu.js:setContent
            var items = this._menu.findChildElems('item');

            var newItems = this._menu.findChildElems({ elem : 'item', modName : 'new' });
            this._domEvents(newItems).on('click', that.menuItemClick);

            // Обновляем/показываем скроллбар
            this._nicescroll.resize();
            this._nicescroll.show();

            // TODO: throttle?
            if ( this._new_items_timeout ) {
                clearTimeout(this._new_items_timeout);
                delete this._new_items_timeout;
            }
            this._new_items_timeout = setTimeout(function(){
                newItems.delMod('new');
                delete that._new_items_timeout;
            },1500);
            // animation time see ObjectsSelector__container.styl:ObjectsSelector_menu_item_animation

            this._update_info();

            this._screenholder.ready();

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
            app.error(e); // TODO: Показывать ошибку в текущей заставке (screenholder)?
        }

    },/*}}}*/

    /** reapply_filters() ** {{{ Применить обновлённые фильтры
     */
    reapply_filters : function () {

        var ObjectsSelector = this,
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

    /** _checkItem ** {{{ Установить значение "выбрано" для элемента в списке params.checked (и для элемента меню, если задан флаг)
     * @param {Number} rowNo - Номер строки данных элемента
     * @param {Boolean} checked - Состояние элемента (true=выбран)
     * @param {Boolean} [checkMenuItem] - Выделить элемент меню
     */
    _checkItem : function (rowNo, checked, checkMenuItem) {

        var
            isRadio = this.getMod('mode') === 'radio' // Одиночный выбор?
        ;

        // Если одиночный выбор...
        if ( isRadio ) {
            this.params.checked = [rowNo];
        }
        // Иначе...
        else {

            if ( !this.params.checked ) { this.params.checked = []; }

            var checkedIndex = this.params.checked.indexOf(rowNo);

            if ( checked ) {
                if ( checkedIndex === -1 ) {
                    this.params.checked.push(rowNo);
                }
            }
            else {
                if ( checkedIndex !== -1 ) {
                    this.params.checked.splice(checkedIndex,1);
                }
            }
        }

        if ( checkMenuItem ) {
            var item = this._menu.findChildElem({ elem : 'item', modName : 'n', modVal : rowNo });
            item && item.setMod('checked', checked);
        }

    },/*}}}*/

    /** menuItemClick() ** {{{ Замена стандартному обработчику клика на элементе меню
     *
     * (Стандартный обработчик не устанавливается на динамически добавляемые позиции.)
     *
     * ВАЖНО: Вызывается в контексте события.
     */
    menuItemClick : function (e) {

        var
            isRadio = this.getMod('mode') === 'radio', // Одиночный выбор?
            item = e.bemTarget,
            checked = isRadio || !item.getMod('checked'), // item.toggleMod('checked').getMod('checked'),
            rowNo = parseInt( item.getMod('n') ),
            shiftKey = e.shiftKey
        ;

        if ( item.hasMod('disabled') /* || item.hasMod('new') */ ) { return false; }

        // При клике с shift выделяем или снимаем выделение на всех элементах от последнего изменённого до текущего
        if ( !isRadio && shiftKey && this.params.lastClicked && this.params.lastClicked.rowNo !== rowNo ) { // && this.params.lastClicked.checked === checked ) {
            var lastNo = this.params.lastClicked.rowNo,
                // Границы диапазона...
                minNo = ( rowNo > lastNo ) ? lastNo : rowNo+1,
                maxNo = ( rowNo > lastNo ) ? rowNo-1 : lastNo
            ;
            // Пункты упорядечены по номерам строк данных (см. способ формирования в _update_data),
            // поэтому обрабатыаем элементы с номерами строк >= lastClicked && < rowNo:
            this._menu.getItems().map(function(foundItem){
                var no = parseInt( foundItem.getMod('n') );
                if ( no >= minNo && no <= maxNo ) {
                    this._checkItem(no, checked, true);
                }
            }, this);
        }

        this._checkItem(rowNo, checked);

        this.params.lastClicked = {
            rowNo : rowNo,
            checked : checked,
            shiftKey : shiftKey,
            item : item,
        };

        this._update_info();
        this._emit('change', {
            rowNo : rowNo,
            checked : checked,
            checkedItems : this.params.checked,
            controller : this,
        });

        return false;

    },/*}}}*/

    /** check_all() ** {{{ Выбираем все видимые пункты
     */
    check_all : function () {

        var ObjectsSelector = this,
            that = this
        ;

        try {

            // Выбираем все отфильтрованные элементы
            this.params.checked = this._filter_controller.get_filtered_rows_list();

            // this._menu.domElem.find('.menu__item:not(.menu__item_checked)').addClass('menu__item_checked'); // TODO: menu__item?
            this._menu.findChildElems({ elem : 'item', modName : 'checked', modVal : false }).setMod('checked');

            this._update_info();

            this._emit('change', {
                checkedItems : this.params.checked,
                controller : this,
            });

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** check_none() ** {{{ Выбираем все видимые пункты
     */
    check_none : function () {

        var ObjectsSelector = this,
            that = this
        ;

        try {

            // Сбрасываем все выбранные элементы
            this.params.checked = [];

            // $(this._menu.domElem).find('.menu__item.menu__item_checked').removeClass('menu__item_checked'); // TODO: menu__item?
            this._menu.findChildElems({ elem : 'item', modName : 'checked' }).delMod('checked');

            this._update_info();

            this._emit('change', {
                checkedItems : this.params.checked,
                controller : this,
            });

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** update() ** {{{ Показываем данные
     * @param {boolean} appendMode - Режим добавления данных
     *
     * Вызывается либо из колбека на `show_more` (appendMode=true), либо из `reapply_filters` {@link #reapply_filters} (appendMode=false).
     */
    update : function (appendMode) {

        var ObjectsSelector = this,
            params = this.params,
            that = this,

            columns = this._dataloader.used_columns_list()

        ;

        try {
            vow.cast( this._dataloader.resolve_columns(columns) )
                .then(function(data) {
                    that._update_data(data, appendMode);
                    that._emit('updated', {
                        data : data,
                        appendMode : appendMode,
                    });
                })
            ;
        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** initialize() ** {{{ Инициализация блока
     */
    initialize : function (options) {

        var ObjectsSelector = this,
            params = this.params,
            that = this
        ;

        this._view_controller = this;
        // this._view_controller || ( this._view_controller = options.view_controller || this.findParentBlock(BEMDOM.entity('view_controller')) || this );

        this._options || ( this._options = options );
        this._page_size || ( this._page_size = options.page_size || params.page_size );

        // this._dicts_controller || ( this._dicts_controller = options.dicts_controller || app );
        this._dataloader || ( this._dataloader = options.dataloader || this.findParentBlock(BEMDOM.entity('dataloader')) );
        this._filter_controller || ( this._filter_controller = options.filter_controller || this.findParentBlock(BEMDOM.entity('filter_controller')) );

        this._info_container = this._box_actions;

        this._screenholder || ( this._screenholder = options.screenholder || this.findParentBlock(BEMDOM.entity('screenholder')) );

    },/*}}}*/

    /** on_inited() ** {{{ Инициализация блока
     */
    on_inited : function () {

        var ObjectsSelector = this,
            params = this.params,
            that = this
        ;

        // DOM...
        this.init_dom() && this.init_actions();

        if ( !that.screenholder.is_error() && !app.screenholder.is_error()) {
            that.screenholder.ready(); // ??? Сейчас? Не после последней (?) инициализации?
        }

    },/*}}}*/

    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой. */
        js : {
            inited : function() {

                this.on_inited();

            },
        },
        /*}}}*/

        /** (*) ** {{{ Синхронизируем все модификаторы, кроме 'js'... */
        '*' : {
            '*' : function (mod, val) {
                if ( mod !== 'js' && this._box_group ) {
                    this._box_group.setMod(mod, val);
                    this._box_actions.setMod(mod, val);
                }
            },
        },/*}}}*/

        /** (checked) ** {{{ Состояния для количества элементов, показанных из отфильтрованных @see {@link #_update_info} */
        checked : {
            none : function () {
                this._check_all_button.setMod('disabled', false);
                this._check_none_button.setMod('disabled', true);
            },
            some : function () {
                this._check_all_button.setMod('disabled', false);
                this._check_none_button.setMod('disabled', false);
            },
            all : function () {
                this._check_all_button.setMod('disabled', true);
                this._check_none_button.setMod('disabled', false);
            },
        },/*}}}*/

        /** (shown) ** {{{ Состояния для количества элементов, показанных из отфильтрованных @see {@link #_update_info} */
        shown : {
            none : function () {
                this._show_more_button.setMod('disabled', false);
            },
            some : function () {
                this._show_more_button.setMod('disabled', false);
            },
            all : function () {
                this._show_more_button.setMod('disabled', true);
            },
        },/*}}}*/

    },

}

));

});
