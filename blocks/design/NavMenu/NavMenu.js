/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */

/**
 *
 * @module NavMenu
 * @overview NavMenu
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.30 17:31:53
 * @version 2017.03.30 17:31:53
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: NavMenu.js 8746 2017-07-13 17:12:11Z miheev $
 *
*/

modules.define('NavMenu', [
        'i-bem-dom',
        'project',
        'ua',
        'keyboard__codes',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        project,
        ua,
        keyCodes,
        $,
    __BASE) {

/**
 *
 * @exports
 * @class NavMenu
 * @bem
 * @classdesc __INFO__
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10 ? 'keypress' : 'keydown';

var NavMenu = /** @lends NavMenu.prototype */ {

    // Данные...

    /** Стек открытых элементов. Хранит dom-элементы элементов меню (`Item`) */
    _openedItems : [],

    // Методы...

    /** syncCurrentItem() ** {{{ Синхронизируем выделение текущего элемента
     * @param {string|elem|DOM} Item - Идентификатор страницы (пункта меню) или объект пункта меню
     */
    syncCurrentItem : function (Item) {

        Item = Item || app.params.pageId;

        var navMenu = this,
            that = this,
            params = this.params,

            menuDom = $(this.domElem),
            itemDom = typeof Item === 'string' ? menuDom.find('.NavMenu__Item_id_'+Item) : Item,

            undef
        ;

        menuDom.find('.NavMenu__Item_current').removeClass('NavMenu__Item_current');

        // Ставим мод `current` у текущего элемента и всех элементов у его родителей
        itemDom.parents('.NavMenu__ItemWrap').map(function(){
            $(this).children('.NavMenu__Item').addClass('NavMenu__Item_current');
        });

    },/*}}}*/

    /** setCollapsed ** {{{ Установить модификатор `Collapsed`
     */
    setCollapsed : function (status) {

        this.resetAllMenus();
        this.setMod('Collapsed', status);

    },/*}}}*/

    /** isItemOpened ** {{{ */
    isItemOpened : function (Item) {

        return ( this._openedItems.indexOf(Item/* [0] */) !== -1 );

    },/*}}}*/

    /** resetAllMenus ** {{{ */
    resetAllMenus : function () {

        this.findChildElems('Submenu').map(function(elem){
            elem.domElem.attr('style','');
        });

    },/*}}}*/

    /** walkOpened ** {{{ Применяем метод (`method.call(this,Item)`) ко всем открытым меню */
    walkOpened : function (method, param) {

        var that = this,
            items = []
        ;

        if ( this._openedItems.length ) {

            // Копируем элементы (на случай операций с самим списком
            this._openedItems.map(function(ItemDom){
                items.push(ItemDom);
            });

            // Применяем метод к элементам
            items.map(function(ItemDom){
                var Item = ItemDom.domElem.bem(BEMDOM.entity('NavMenu', 'Item'));
                method.call(that, Item, param);
            });
        }

    },/*}}}*/

    /** closeAllMenus ** {{{ Закрываем все открытые меню */
    closeAllMenus : function () {

            // Закрываем все
            this.walkOpened(this.closeSubmenu);

    },/*}}}*/

    /** _getItemForEvent ** {{{ */
    _getItemForEvent : function (e) {

        var Dom = e.currentTarget || e.target;
        var Item = $(Dom).bem(BEMDOM.entity('NavMenu','Item'));

        return Item;

    },/*}}}*/

    /** _getItemSubmenu ** {{{ */
    _getItemSubmenu : function (Item) {

        var ItemParams = Item.params;

        if ( !ItemParams.Submenu ) {
            var Wrap = Item.domElem.closest('.NavMenu__ItemWrap');
            var Submenu = Wrap.find('> .NavMenu__Submenu');
            ItemParams.Submenu = Submenu.bem(BEMDOM.entity('NavMenu', 'Submenu'));
        }

        return ItemParams.Submenu;

    },/*}}}*/

    /** _isEventInDom ** {{{ */
    _isEventInDom : function (e, Dom, gap) {

        gap = gap || 0;

        if ( Dom.domElem ) {
            Dom = Dom.domElem;
        }

        // Если объект Dom не определен
        if ( !Dom ) { return false; }

        // Если не Dom объект
        if ( typeof Dom.length === 'undefined' ) {
            Dom = $(Dom);
        }
        if ( !Dom.length ) { return false; }

        var
            x = e.pageX,
            y = e.pageY,

            offset = Dom.offset(),

            x1 = offset.left,
            x2 = x1 + Dom.outerWidth(),
            y1 = offset.top,
            y2 = y1 + Dom.outerHeight(),

            isInsideX = ( x >= x1 - gap && x <= x2 + gap ),
            isInsideY = ( y >= y1 - gap && y <= y2 + gap ),
            isInside = isInsideX && isInsideY
        ;

        return isInside;

    },/*}}}*/

    /** isEventInItemOrSubmenu ** {{{ */
    isEventInItemOrSubmenu : function (e, Item, gap) {

        // Если не jq collection и не элемент
        if ( typeof Item.length === 'undefined' ) {
            Item = Item.domElem.bem(BEMDOM.entity('NavMenu', 'Item'));
        }

        if ( this._isEventInDom(e, Item, gap || 5) ) {
            return true;
        }
        if ( Item.getMod('opened') && this._isEventInDom(e, this._getItemSubmenu(Item), gap || 5) ) {
            return true;
        }
        return false;

    },/*}}}*/

    /** isEventInLastOpened ** {{{ */
    isEventInLastOpened : function (e, lastItem) {

            if ( !lastItem ) { lastItem = this.getLastOpened(); }
            var isInLastItem = this.isEventInItemOrSubmenu(e, lastItem);

    },/*}}}*/

    /** closeItemIfEventIsOutside ** {{{ */
    closeItemIfEventIsOutside : function (Item, e) {

        var isEventInside = this.isEventInItemOrSubmenu(e, Item);
        if ( !isEventInside ) {
            this.closeSubmenu(Item);
        }

    },/*}}}*/

    /** onKeyPress ** {{{ */
    onKeyPress : function (e, data) {

        var // Item = this._getItemForEvent(e)
            isCollapsed = this.hasMod('Collapsed'),
            useClick = this.hasMod('useClick')
        ;

        if ( !isCollapsed && this.hasOpened() && useClick && e.keyCode === keyCodes.ESC ) {
            this.closeLastOpened();
            // this.closeAllMenus();
            return false;
        }

        return true;

    },/*}}}*/

    /** onNormalClick ** {{{ */
    onNormalClick : function (e, data) {

        var // Item = this._getItemForEvent(e)
            isCollapsed = this.hasMod('Collapsed'),
            useClick = this.hasMod('useClick')
        ;

        if ( !isCollapsed && this.hasOpened() && useClick ) {
            this.walkOpened(this.closeItemIfEventIsOutside, e);
        }

        return false;

    },/*}}}*/
    /** onNormalMove ** {{{ */
    onNormalMove : function (e, data) {

        var // Item = this._getItemForEvent(e)
            isCollapsed = this.hasMod('Collapsed'),
            useClick = this.hasMod('useClick')
        ;

        if ( !isCollapsed && this.hasOpened() ) {
            // e.preventDefault();
            // e.stopPropagation();
            var lastItem = this.getLastOpened();
            var isInLastItem = this.isEventInItemOrSubmenu(e, lastItem);
            if ( !isInLastItem && !useClick ) {
                this.closeSubmenu(lastItem);
            }
            // Если внутри элемента без gap, то true...
            // return this.isEventInItemOrSubmenu(e, lastItem, 0);
        }

        return false;

    },/*}}}*/

    /** closeLastOpened ** {{{ */
    closeLastOpened : function () {

        var lastP = this._openedItems.length - 1;

        // Если пусто
        if ( lastP < 0 ) {
            return false;
        }

        var lastOpened = this._openedItems[lastP];
        var lastOpenedItem = lastOpened.domElem.bem(BEMDOM.entity('NavMenu', 'Item'));

        return this.closeSubmenu(lastOpenedItem);

    },/*}}}*/

    /** findParent ** {{{ */
    findParent : function (Item) {

        if ( Item.getMod('isRoot') ) {
            return null;
        }

        var ItemParams = Item.params;

        if ( typeof ItemParams.parentItem === 'undefined' ) {

            var parentSubmenu = Item.domElem.closest('.NavMenu__Submenu');
            var parentWrap = parentSubmenu.closest('.NavMenu__ItemWrap');
            var parentItemDom = parentWrap.find('> .NavMenu__Item');

            ItemParams.parentItem = parentItemDom.bem(BEMDOM.entity('NavMenu', 'Item'));

        }

        return ItemParams.parentItem;

    },/*}}}*/

    /** isItemsSame ** {{{ Являются ли два объекта элемента `Item` элементами одного меню? */
    isItemsSame : function (Item1, Item2) {

        // if ( !Item1 || !Item1.domElem || !Item2 || !Item2.domElem ) {
        //     return false;
        // }

        // Сравниваем объекты DOM-элементов
        return ( Item1 === Item2 );

    },/*}}}*/

    /** isItemChildOf ** {{{ Является ли элемент дочерним элементом другого? */
    isItemChildOf : function (Item, parentItem) {

        var testParentItem = this.findParent(Item);

        return this.isItemsSame(testParentItem, parentItem);

    },/*}}}*/

    /** hasOpened ** {{{ */
    hasOpened : function () {

        return ( this._openedItems && this._openedItems.length ) ? true : false;

    },/*}}}*/

    /** getLastOpened ** {{{ */
    getLastOpened : function () {

        var lastP = this._openedItems.length - 1;
        var lastItemDom = this._openedItems[lastP];
        var lastItem = lastItemDom.domElem.bem(BEMDOM.entity('NavMenu', 'Item'));

        return lastItem;

    },/*}}}*/

    /** isChildOfLastOpened ** {{{ */
    isChildOfLastOpened : function (Item) {

        var lastOpened = this.getLastOpened();
        var isParent = this.isItemChildOf(Item, lastOpened);

        return isParent;

    },/*}}}*/

    /** closeMenuIfChild ** {{{ Закрыть подменю, если элемент является дочерним */
    closeMenuIfChild : function (Item, parentItem) {

        if ( this.isItemChildOf(Item, parentItem) ) {
            this.closeSubmenu(Item);
        }

    },/*}}}*/

    /** closeAllChilds ** {{{ Закрываем все дочерние открытые подменю */
    closeAllChilds : function (Item) {

        this.walkOpened(this.closeMenuIfChild, Item);

    },/*}}}*/

    /** openSubmenu ** {{{ */
    openSubmenu : function (Item) {

        var NavMenu = this,
            that = this,
            params = this.params,
            isCollapsed = this.hasMod('Collapsed'),
            undef
        ;

        // Если открываем меню верхнего уровня, то безусловно закрываем все другие меню
        if ( Item.hasMod('isRoot') ) {
            this.closeAllMenus();
        }
        // Иначе закрываем последнее меню, если оно не является родительским
        else if ( !this.isChildOfLastOpened(Item) ) {
            this.closeLastOpened();
        }

        // Если уже открыто, то ничего не делаем (?)
        if ( this.isItemOpened(Item) ) {
            return true;
        }

        var Submenu = this._getItemSubmenu(Item);
        Item.setMod('opened');

        // Флаг: нет открытых меню
        var isFirstMenu = !this._openedItems.length;

        // Добавляем дом-элемент текущего меню в стек
        this._openedItems.push(Item/* [0] */);

        // Открываем подменю в зависмости от режима Collapsed
        if ( isCollapsed ) {
            Submenu.slideDown(250, function(){
                Submenu.setMod('opened');
            });
        }
        else {
            Submenu.setMod('opened');
        }

        // Если это первое открытое меню, активируем прослушивание события мыши
        if ( isFirstMenu ) {
            /* OLD CODE
             * this.bindToDoc('mousemove', this.onNormalMove);
             * this.bindToDoc('click', this.onNormalClick);
             * this.bindToDoc(KEYDOWN_EVENT, this.onKeyPress);
             */
            this._domEvents(BEMDOM.doc).on('mousemove', this.onNormalMove);
            this._domEvents(BEMDOM.doc).on('click', this.onNormalClick);
            this._domEvents(BEMDOM.doc).on(KEYDOWN_EVENT, this.onKeyPress);
        }

    },/*}}}*/
    /** closeSubmenu ** {{{ */
    closeSubmenu : function (Item) {

        var NavMenu = this,
            that = this,
            params = this.params,
            isCollapsed = this.hasMod('Collapsed'),
            undef
        ;

        // Если среди открытых
        var p = this._openedItems.indexOf(Item/* [0] */);
        if ( p !== -1 ) {

            this._openedItems.splice(p, 1);

            // Закрываем все дочерние открытые подменю
            this.closeAllChilds(Item);

            var Submenu = this._getItemSubmenu(Item);
            Item.delMod('opened');

            // Закрытие подменю в зависимости от режима
            if ( isCollapsed ) {
                Submenu.slideUp(250, function(){
                    Submenu.delMod('opened');
                });
            }
            else {
                Submenu.delMod('opened');
            }

            // Если больше нет открытых меню, то отключаем прослушивание событий мыши
            if ( !this._openedItems.length ) {
                /* OLD CODE
                 * this.unbindFromDoc('mousemove', this.onNormalMove);
                 * this.unbindFromDoc('click', this.onNormalClick);
                 * this.unbindFromDoc(KEYDOWN_EVENT, this.onKeyPress);
                 */
                this._domEvents(BEMDOM.doc).un('mousemove', this.onNormalMove);
                this._domEvents(BEMDOM.doc).un('click', this.onNormalClick);
                this._domEvents(BEMDOM.doc).un(KEYDOWN_EVENT, this.onKeyPress);
            }
        }

    },/*}}}*/

    /** onItemClick ** {{{ */
    onItemClick : function (e, data) {

        var NavMenu = this,
            that = this,
            params = this.params,

            Item = this._getItemForEvent(e),

            useClick = this.hasMod('useClick'),
            isCollapsed = this.hasMod('Collapsed'),
            isSubmenu = Item.getMod('hasChilds')
        ;

        // Если подменю
        if ( isSubmenu ) {
            if ( isCollapsed || useClick ) {
                if ( this.isItemOpened(Item) ) {
                    this.closeSubmenu(Item);
                }
                else {
                    this.openSubmenu(Item);
                }
            }
            return false;
        }
        // Если пункт меню с идентификатором
        else if ( Item.hasMod('hasId') ) {
            this.closeAllMenus();
            this._emit('clickId', {
                Item : Item,
                id : Item.params.id,
            });
            return false;
        }
        // Если пункт меню со ссылкой
        else if ( Item.hasMod('hasUrl') ) {
            this.closeAllMenus();
            this._emit('clickUrl', {
                Item : Item,
                url : Item.attr('href'),
            });
            return false;
        }

        return true;

    },/*}}}*/

    /** onItemOver ** {{{ */
    onItemOver : function (e, data) {

        var NavMenu = this,
            that = this,
            params = this.params,

            Item = this._getItemForEvent(e),

            useClick = this.hasMod('useClick'),
            isCollapsed = this.hasMod('Collapsed'),
            isSubmenu = Item.getMod('hasChilds')
        ;

        if ( !isCollapsed && isSubmenu && !useClick ) {
            this.openSubmenu(Item);
        }

    },/*}}}*/
    /** onItemOut ** {{{ */
    onItemOut : function (e, data) {

        var NavMenu = this,
            that = this,
            params = this.params,

            Item = this._getItemForEvent(e),

            isCollapsed = this.hasMod('Collapsed'),
            isSubmenu = Item.getMod('hasChilds')
        ;

    },/*}}}*/

    /** _onInited() ** {{{ Инициализируем блок.
     */
    _onInited : function() {

        var NavMenu = this,
            that = this,
            params = this.params,
            undef
        ;

        this._NavHeader = this.findParentBlock(BEMDOM.entity('NavHeader'));

        // "Наследуем" модификатор `Collapsed` от `NavHeader`
        if ( that._NavHeader ) {
            that.setCollapsed( that._NavHeader.hasMod('Collapsed') );
            // И отслеживаем его изменения
            this._NavHeader._events().on('_Collapsed_true', function(e,data){ that.setCollapsed(true); });
            this._NavHeader._events().on('_Collapsed_', function(e,data){ that.setCollapsed(false); });
        }

        /* OLD CODE:
         * this.bindTo(this._elem('Item'), 'click', this.onItemClick);
         * this.bindTo(this._elem('Item'), 'mouseover', this.onItemOver);
         */
        // События мыши над элементами...
        var Items = this.findChildElems('Item');
        this._domEvents(Items).on('click', this.onItemClick);
        this._domEvents(Items).on('mouseover', this.onItemOver);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function () {

                var NavMenu = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._onInited();

            },
        },/*}}}*/

    },/*}}}*/

};

provide(BEMDOM.declBlock(this.name, NavMenu, /** @lends NavMenu */{

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

