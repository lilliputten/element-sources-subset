/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module NavHeader
 * @overview NavHeader
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.30 17:56:14
 * @version 2017.03.30 17:56:14
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: NavHeader.js 8733 2017-07-11 16:47:15Z miheev $
 *
*/

modules.define('NavHeader', [
        'i-bem-dom',
        'dropdown',
        'button',
        'NavMenu',
        'vlayout',
        'project',
        'nicescroll',
        'ua',
        'events__channels',
        'keyboard__codes',
        'store',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        Dropdown,
        Button,
        NavMenu,
        vlayout,
        project,
        nicescroll,
        ua,
        channels,
        keyCodes,
        store,
        $,
    __BASE) {

/**
 *
 * @exports
 * @class NavHeader
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

var
    __sizes = {
        Tiny : 0,
        Small : 600,
        Medium : 1000,
        Large : 1500,
    },
    __defaults = {
        sizeMods : __sizes,
        collapsedTreshold : __sizes.Small,
    }
;

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10 ? 'keypress' : 'keydown';

var NavHeader = /** @lends NavHeader.prototype */ {

    /** updateUserInfo ** {{{ Обновить данные о пользователе
     * @param {object} user - Данные о пользователе (в формате, передаваемом сервером, см. `get_AppParams`)
     * @param {string} user.username - Имя пользователя
     * @param {boolean} [user.isAdmin] - Администратор
     * @param {boolean} [user.isOperator] - Оператор
     * @param {boolean} [user.UseDomainAuth] - Доменный вход (???)
     */
    updateUserInfo : function (user) {

        var hasUser = ( user && user.username && ( user.isAdmin || user.isOperator ) ) ? true : false;

        this.setMod('hasUser', hasUser);

        var userRoles = [];
        user.isAdmin && userRoles.push('администратор');
        user.isOperator && userRoles.push('оператор');
        var userRolesText = userRoles.join(', ');

        var userRoleElem = this._elem('UserRole') || {};
        BEMDOM.update(userRoleElem.domElem, userRolesText);

        // Имя пользователя
        // TODO: findChildBlock...findChildElem
        var userNameButton = this.domElem.find('.button_id_UserName');
        var userNameElem = userNameButton.find('.button__text') || {};
        BEMDOM.update(userNameElem, user.username);
        userNameButton.attr('title', userRolesText);

    },/*}}}*/

    /** onSideMenuKeyPress ** {{{ Скрываем SideMenu по нажатию ESC */
    onSideMenuKeyPress : function (e) {

        if ( e.keyCode === keyCodes.ESC ) {
            this.toggleCollapsable(false);
            return false;
        }

        return true;

    },/*}}}*/

    /** toggleSideMenu ** {{{ */
    toggleSideMenu : function (state) {

        var SideMenu = this._elem('SideMenu'); // elemify(this._collapsable, 'SideMenu');

        // Показываем/прячем
        this.setMod(SideMenu, 'show', state);

        // Слушаем событие на клавиатуре -- ждём нажатия ESC
        if ( state ) {
            this._domEvents(BEMDOM.doc).un(KEYDOWN_EVENT, this.onSideMenuKeyPress);
        }
        else {
            this._domEvents(BEMDOM.doc).un(KEYDOWN_EVENT, this.onSideMenuKeyPress);
        }


    },/*}}}*/

    /** toggleCompact ** {{{ Полный/компактный вид */
    toggleCompact : function (state) {

        if ( typeof state !== 'boolean' ) {
            var ExpandState = !this._ExpandButton.getMod('checked');
            state = ExpandState;
        }

        this._ExpandButton.setMod('checked', state);
        this.setMod('Compact', state);

        store.set('NavHeaderCompactState', state);

        this._vlayout && this._vlayout.update(); // TODO!!!
        channels('header').emit('layout_resize'); // Временное: сигнал для корневого panlebox

    },/*}}}*/

    /** toggleCollapsable ** {{{ Открываем/прячем скрываемое меню (Collapsable, collapsed) */
    toggleCollapsable : function (state) {

        var toggleCollapsableState = !!this._ToggleCollapsedButton.getMod('checked');

        if ( typeof state === 'undefined' ) {
            state = !toggleCollapsableState;
        }

        if ( state !== toggleCollapsableState ) {
            this._ToggleCollapsedButton.setMod('checked', state);
        }
        this._UserNameButton.delMod('checked');
        this._UserNamePopup.delMod('visible');

        // Если SideMenu...
        if ( $(this._collapsable).hasClass('NavHeader__SideMenu') ) {
            this.toggleSideMenu(state);
        }
        // Иначе просто прячем/показываем...
        else {
            if ( state ) {
                this._collapsable.show();
            }
            else {
                this._collapsable.hide();
            }
            this._vlayout && this._vlayout.update(); // TODO!!!
        }

    },/*}}}*/

    /** initNavMenuActions ** {{{ Инициализируем реакцию на действия пользователя в меню */
    initNavMenuActions : function () {

        var NavHeader = this,
            that = this
        ;

        if ( this._NavMenu ) {

            this._NavMenu._events().on('clickId', function(e,data) {
                that.toggleCollapsable(false);
                that._emit('MenuClickId', data);
            });

            this._NavMenu._events().on('clickUrl', function(e,data) {
                that.toggleCollapsable(false);
                that._emit('MenuClickUrl', data);
            });

        }

    },/*}}}*/

    /** createNavMenu ** {{{ Создать меню
     */
    createNavMenu : function (pageId) {

        var NavHeader = this,
            that = this,

            // pageId = params.pageId,
            menuId = app.params.config.appdata.menuIndex[pageId] && app.params.config.appdata.menuIndex[pageId].menuId || '',

            NavMenu = this.findChildBlock(BEMDOM.entity('NavMenu')),

            useClick = ( typeof this.params.useClick === 'boolean' ) ? this.params.useClick : ( typeof this.getMod('useClick') === 'boolean' ) ? this.getMod('useClick') : true,

            undef
        ;

        try {

            // Если показано то же меню, то ничего не делаем
            if ( NavMenu && NavMenu.getMod('id') === menuId ) {
                return;
            }

            // ...Иначе отображаем меню
            var bemhtml = {
                    block : 'NavMenu',
                    js : {
                        pageId : pageId,
                    },
                    mods : {
                        id : menuId,
                        Collapsed : this.getMod('Collapsed'),
                        useClick : useClick, // Использовать клик для открытия меню // TODO -- В project.config?
                    },
                    content : menuId ? app.params.config.appdata.menu[menuId] : '<div class="error">Ошибка определения раздела меню для страницы <u>'+pageId+'</u></div>',
                },
                html = BEMHTML.apply(bemhtml),
                // См. _initHeaderDom
                MenuBoxElem = this._elem('MenuBox') || {},
                dom = BEMDOM.update(MenuBoxElem.domElem, html)

            ;

            this._vlayout && this._vlayout.update(); // TODO!!!

            this.setMod('hasMenu', menuId);

            if ( dom && dom.length ) {

                this._NavMenu = this.findChildBlock(BEMDOM.entity('NavMenu'));

                // this.syncCurrentItem(pageId);

                this.initNavMenuActions();

            }

        }
        catch (error) {
            console.error(error);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** syncCurrentItem ** {{{ */
    syncCurrentItem : function (pageId) {

        return this._NavMenu && this._NavMenu.syncCurrentItem && this._NavMenu.syncCurrentItem(pageId);

    },/*}}}*/

    /** _initDomActions ** {{{ Действия пользователя и обработка событий
     */
    _initDomActions : function() {

        var NavHeader = this,
            that = this,
            params = this.params,
            undef
        ;

        this._vlayout = this.findParentBlock(vlayout);

        this._collapsable = this.domElem.find('.collapsable');

        // Collapsable и SideMenu...
        this._ToggleCollapsedButton = this.findChildBlock({ block : Button, modName : 'id', modVal : 'ToggleCollapsed' });

        // Клик на кнопке `ToggleCollapsedButton` (`hamburger`)
        this._ToggleCollapsedButton._events().on('click', function(e,data) {
            var state = that._ToggleCollapsedButton.getMod('checked');
            that.toggleCollapsable(state);
        });

        // Кнопка `UserName` и popup...
        this._UserNameButton = this.findChildBlock({ block : Button, modName : 'id', modVal : 'UserName' });
        this._UserNameDropdown = this._UserNameButton.domElem.bem(Dropdown);
        this._UserNamePopup = this._UserNameDropdown.getPopup();
        // // На всякий случай переопределяем z-уровень расположения popup
        this._UserNamePopup.domElem.find('a').click(function(e,data){
            // Скрываем всё при клике
            that.toggleCollapsable(false);
        });

        // Перехватываем клик на пункте меню "Смена типа авторизации"
        this.domElem.find('.appChangeAuth').click(function(e,data){
            app.changeAuthType();
            return false;
        });

        // Кнопка компактное/полное
        this._ExpandButton = this.findChildBlock({ block : Button, modName : 'id', modVal : 'Expand' });
        this._ExpandButton._domEvents().on('click', this.toggleCompact.bind(this));


    },/*}}}*/

    /** _updateStates ** {{{ Обновляем состояния меню
     */
    _updateStates : function () {

        var NavMenuBox = this,
            that = this,
            lastFitted = '',
            undef
        ;

        // Проходим по всем заданным размерам окна (sizeMods)
        Object.keys(__defaults.sizeMods).map(function(id){
            var fitTo = window.innerWidth >= __defaults.sizeMods[id];
            that.setMod(id, fitTo);
            if ( fitTo ) {
                lastFitted = id;
            }
        });
        that.setMod('Collapsed', window.innerWidth < __defaults.collapsedTreshold);
        that.setMod('Size', lastFitted);

    },/*}}}*/

    /** _onInited() ** {{{ Инициализируем блок.
     */
    _onInited : function() {

        var NavHeader = this,
            that = this,
            params = this.params,
            undef
        ;

        this._domEvents(BEMDOM.win)
            .un('resize', this._updateStates)
            .on('resize', this._updateStates)
        ;

        this._initDomActions();

        this.toggleCompact( store.get('NavHeaderCompactState') );
        this._updateStates();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (Collapsed) ** {{{ Схлопывание
         */
        Collapsed : {

            // '*' : function (id, val) {
            // },
            true : function (id, val) {

                // nicescroll
                if ( !this._SideMenuScroll ) {
                    this._SideMenuScroll = nicescroll.init(this._elem('SideMenuContainer'), {
                        // zindex : 1000,
                        // cursorcolor : '#000',
                    });
                }

            },
            '' : function (id, val) {

                if ( this._SideMenuScroll ) {
                    this._SideMenuScroll.remove();
                    delete this._SideMenuScroll;
                }
            },

        },/*}}}*/

        /** (js:inited) ** {{{ Инициализация bem блока
         */
        js : {

            inited : function () {

                var NavHeader = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._onInited();

            },

        },/*}}}*/

    },/*}}}*/

};

provide(BEMDOM.declBlock(this.name, NavHeader, /** @lends NavHeader */{

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

