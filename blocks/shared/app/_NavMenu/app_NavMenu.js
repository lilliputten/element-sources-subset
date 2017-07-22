/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, getCookie, app, project */

/**
 *
 * @module app_NavMenu
 * @overview Код для работы с главным меню (?)
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.30 14:44:08
 * @version 2017.03.30 14:44:08
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: app_NavMenu.js 8762 2017-07-17 11:16:38Z miheev $
 *
*/

modules.define('app', [
    'i-bem-dom',
    'NavHeader',
    'uri__querystring',
    'project',
    'vow',
    'jquery',
],
function(provide,
    BEMDOM,
    NavHeader,
    querystring,
    project,
    vow,
    $,
__BASE) {

/**
 *
 * @exports
 * @class app_NavMenu
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

var app_NavMenu = /** @lends app_NavMenu.prototype */ {

    // Данные...

    // Методы...

    /** prepareUrlForAuth() ** {{{
     * @param {string} url
     */
    prepareUrlForAuth : function (url) {

        var
            origUrl = url, // debug?
            changedUrl = false, // debug?
            token = getCookie(project.config.authCookieName),
            tokenPrefix = 'ElementToken=',
            tokenElement = tokenPrefix + encodeURIComponent(token),
            replaceReg = new RegExp('('+tokenPrefix+')([A-z0-9%:-]+)'),
            undef
        ;
        if ( token && url && url.indexOf('#') !== 0 ) {
            if ( url.indexOf(tokenPrefix) === -1 ) {
                tokenElement = ( ( url.indexOf('?') === -1 ) ? '?' : '&' ) + tokenElement;
                url = url.replace(/(#.*)?$/, tokenElement+'$1');
            }
            else {
                url = url.replace(replaceReg, tokenElement);
            }
        }

        return url;

    },/*}}}*/

    /** _updateHeaderInfo() ** {{{ Обновляем информацию в шапке
     */
    _updateHeaderInfo : function () {

        var app = this,
            params = this.params,
            undef;

        app._NavHeader.updateUserInfo(params.user);

    },/*}}}*/

    /** _getPageIdForApp ** {{{ Получить идентификатор страницы для ph-приложения
     * @param {string} appId - Идентификатор ph-приложения
     * @param defaultPageId - Возвращается, если страница не найдена
     */
    _getPageIdForApp : function (appId, defaultPageId) {

        var app = this,
            params = this.params,
            // appdata = app.config.appdata,
            appdata = ( app.config && app.config.appdata ) || {},
            undef
        ;

        if ( appId && appdata.menuRubrics ) {
            // Находим страницу для этого приложения
            for ( var i=0; i<appdata.menuRubrics.length; i++ ) {
                var rubric = appdata.menuRubrics[i];
                if ( appId === rubric.id ) {
                    // Используем страницу по умолчанию или первую страницу раздела...
                    return rubric.defaultPage || appdata.menuFirstPages[appId] || defaultPageId;
                }
            }
        }

        return defaultPageId;

    },/*}}}*/

    /** _prepareTargetPageId ** {{{ Получить окончательный идентификатор страницы (обрабатываем мета-идентификаторы типа `app:*` */
    _prepareTargetPageId : function (pageId) {

        var app = this,
            params = this.params,
            match
        ;

        if ( ( match = pageId.match(/^app:(\w+)$/) ) !== null ) {
            pageId = app._getPageIdForApp(match[1], pageId);
        }

        return pageId;

    },/*}}}*/

    /** _getPageIdToOpen ** {{{ Получить идентификатор страницы (экрана), соответствующий переданным параметрам
     * В App могут передаваться следующие параметры:
     *  - ?app={appId} - идентификатор приложения
     *  - #app:{appId} - идентификатор приложения
     *  - #{pageId} - Идентификатор страницы
     * Смотрим на:
     *  - window.location.hash
     *  - window.location.search
     * @param defaultPageId - Возвращается, если страница не найдена
     * @returns {string|null}
     */
    _getPageIdToOpen : function (defaultPageId) {

        var app = this,
            params = this.params,
            // appdata = ( app.config && app.config.appdata ) || {},
            match, // regexp result
            qpos, // indexOf result
            undef
        ;

        // Если страница задана в хэше запроса `#{pageId}`
        if ( window.location.hash ) {
            var pageId = window.location.hash;
            if ( pageId.startsWith('#') ) {
                pageId = pageId.substr(1);
            }
            // ??? Перестраховываемся от `#{pageId}?...`
            if ( ( qpos = pageId.indexOf('?') ) !== -1 ) {
                pageId = pageId.substr(0, qpos);
            }
            //
            // if ( ( match = pageId.match(/^app:(\w+)$/) ) !== null ) {
            //     pageId = app._getPageIdForApp(match[1], pageId);
            // }
            return pageId;
        }
        // Если задан идентификатор приложения `?app={appId}`
        else if ( window.location.search ) {
            var
                queryParams = querystring.parse(window.location.search),
                appId = queryParams.app
            ;
            if ( appId ) {
                return app._getPageIdForApp(appId);
            }
        }

        return defaultPageId;

    },/*}}}*/

    /** _prepareMenuData() ** {{{ Подготавливаем данные меню после загрузки AppParams (см. {@link #_acceptAppParams}).
     */
    _prepareMenuData : function () {

        var app = this,
            params = this.params;

        params.config.appdata.menuIndex = [];
        params.config.appdata.menuFirstPages = {};

        var __processMenu = function (menuId, menu, level) {
            if ( !Array.isArray(menu) ) { return; }
            level = level || 0;
            for ( var i=0; i<menu.length; i++ ) {
                var item = menu[i];
                item.elem = 'Item';
                item.hasChilds = ( Array.isArray(item.content) && item.content.length ) ? true : false;
                if ( item.url ) {
                    item.url = project.helpers.expand_path('{{approot}}'+item.url);
                }
                if ( item.id ) {
                    if ( params.config.appdata.pages[item.id] && !item.title ) {
                        item.title = params.config.appdata.pages[item.id].title;
                    }
                    params.config.appdata.menuIndex[item.id] = {
                        menuId : menuId,
                        title : item.title,
                        hasChilds : item.hasChilds,
                        menu : menu,
                        // has_childs : item.hasChilds,
                    };
                    // Если нет первой страницы для данного меню и это конечный элемент (страница)...
                    if ( !params.config.appdata.menuFirstPages[menuId] && !item.hasChilds ) {
                        // Сохраняем идентифкатор текущей страницы
                        params.config.appdata.menuFirstPages[menuId] = item.id;
                    }
                }
                if ( item.hasChilds ) {
                    // ( item.elemMods || ( item.elemMods = {} ) ).hasChilds = true;
                    __processMenu(menuId, item.content, level+1);
                }
            }
        };

        if ( typeof params.config.appdata.menu === 'object' ) {
            Object.keys(params.config.appdata.menu).forEach(function(menuId) {
                __processMenu(menuId, params.config.appdata.menu[menuId]);
            });
        }

    },/*}}}*/

    /** _initHeaderDom() ** {{{ Инициализация "шапки"
     */
    _initHeaderDom : function () {

        var app = this,
            params = this.params,
            undef
        ;

        app._NavHeader = app._vlayout.findChildBlock(NavHeader);

        app._NavHeader._events().on('MenuClickId', function(e,data){
            var pageId = data.id;
            app.openPage(pageId);
        });
        app._NavHeader._events().on('MenuClickUrl', function(e,data){
            var url = app.prepareUrlForAuth(data.url);
            window.location.assign(url);
        });

    },/*}}}*/

    /** _onInited() ** {{{ Инициализируем блок.
     */
    _onInited : function() {

        var app = this,
            params = this.params,
            undef
        ;

        // app._actions();

        // TODO: Переместить в другое место -- если header создаётся динамически,
        // то на момент инициализации app его ещё может не быть
        // ???
        app._initHeaderDom();

    },/*}}}*/

    /** getLastMenuContainingPage ** {{{ Получить текущее активное меню (низшего уровня) */
    getLastMenuContainingPage : function (pageId) {

        pageId = pageId || this.params.pageId;

        var
            app = this,
            params = this.params,
            menuIndex = params.config.appdata.menuIndex[pageId]
        ;

        return menuIndex && menuIndex.menu;

    },/*}}}*/

    // Методы, переопределяемые у родительского блока...

    /** _acceptAppParams() ** {{{ Получаем и обрабатываем данные конфигурации
     * @param {object} data - Данные конфигурации
     */
    _acceptAppParams : function (data, textStatus, jqXHR) {

        var app = this,
            params = this.params
        ;

        var basePromise = this.__base.apply(this, arguments);

        return basePromise
            .then(function(data){

                // Подготавливаем меню (NavMenu)
                app._prepareMenuData();

                // информация в шапке
                app._updateHeaderInfo();

            })
        ;

    },/*}}}*/

    /** _openPageInit(id) ** {{{ Инициализируем новую страницу (Шаг 4, async)
     * @param {string} id - Идентификатор страницы
     * return {Promise}
     */
    _openPageInit : function (id) {

        var app = this,
            params = this.params,
            undef
        ;

        var basePromise = this.__base.apply(this, arguments);

        return basePromise
            .then(function(data){

                // Создаём меню
                app._NavHeader.createNavMenu(id);

                app._NavHeader.syncCurrentItem(id);

                return vow.Promise.resolve({ status : '(app_NavMenu)_openPageInit ok', pageId : id });

            })
        ;

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function() {

                var app_NavMenu = this,
                    params = this.params,
                    undef
                ;

                // NOTE: Если _onInited определён в базовом блоке, то он будет вызван помимо js:inited
                this.__base.apply(this, arguments);

                this._onInited();

            }
        },/*}}}*/

    },/*}}}*/

};

provide(__BASE.declMod({ modName : 'NavMenu', modVal : true }, app_NavMenu, /** @lends app_NavMenu */{

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


