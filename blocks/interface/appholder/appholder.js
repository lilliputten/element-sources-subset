/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 *  @module appholder
 * @overview appholder
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.01.20 15:51
 * @version 2017.01.20 15:51
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: appholder.js 8762 2017-07-17 11:16:38Z miheev $
 *
*/

modules.define('appholder', [
        'i-bem-dom',
        // 'events__channels',
        // 'store',
        'button',
        'vow',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // channels,
        // store,
        Button,
        vow,
        $
    ) {

/*
 * @exports
 * @class appholder
 * @bem
 */

/**
 *
 * @class appholder
 * @classdesc __INFO__
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * Состояния
 *
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends appholder.prototype */ {

    // Данные...

    /** Длительность анимации. */
    _animateTimeout : 500,

    /** Статус по умолчанию */
    _defaultStatus : 'Загрузка...',

    /** Очередь статусов (обратный стек) */
    _statuses : [],

    // Методы...

    // /** showError ** {{{ // ???
    //  */
    // showError : function (error) {
    //
    //     var appholder = this,
    //         that = this;
    //
    // },/*}}}*/

    /** hideForm() ** {{{ Спрятать форму
     * @param {string} formId - Идентификатор формы
     * @return {Promise} - Окончание анимации
     */
    hideForm : function (formId) {

        var appholder = this,
            that = this,

            // Ищем экран с формой
            formElem = this._elem({ elem : 'screen', modName : 'id', modVal : formId }),

            undef
        ;

        // Показываем экран
        return this.hideScreen(formElem);

    },/*}}}*/
    /** showForm() ** {{{ Показать форму
     * @param {string} formId - Идентификатор формы
     * @param {object} [options] - Доп.параметры формы
     * @return {Promise} - Окончание анимации
     *
     * TODO: Переделать initFormActions на перерегистрацию событий (пока регистрируются только при первом обращении)
     *
     */
    showForm : function (formId, options) {

        var appholder = this,
            that = this,

            undef
        ;

        // Показываем экран
        return this.showScreen(formId, options);

    },/*}}}*/

    /** actionClick_login() ** {{{ Пользовательское действие: вход
     */
    actionClick_login : function (e, data) {

        var appholder = this,
            that = this,
            undef
        ;

        // e.preventDefault();
        // return false;

        return true;

    },/*}}}*/

    /** formSubmit_login() ** {{{ (ПРИМЕР!) Пользовательское действие: отправка формы login
     */
    formSubmit_formAuth : function (e, data) {

        var appholder = this,
            that = this,
            undef
        ;

        // e.preventDefault();
        return false;

    },/*}}}*/

    /** initFormActions() ** {{{ Инициализируем действия на форме
     * @param {bemElem} screenElem - Элемент экрана с формой
     * @param {object} [options] - Доп.параметры формы
     */
    initFormActions : function (screenElem, options) {

        var appholder = this,
            that = this,

            splashform = screenElem.findChildBlock(BEMDOM.entity('splashform')),
            splashformId = splashform.getMod('id'),
            actions = splashform._elem('actions'),
            actionButtons = actions.findChildBlocks(BEMDOM.entity('button')),

            formParams = {
                screenElem : screenElem,
                splashform : splashform,
                splashformId : splashformId,
            },

            undef
        ;

        try {

            // Сабмит формы
            $(splashform.domElem).off('submit').on('submit', function(e, data){
                var actionId = 'formSubmit_'+splashformId,
                    formParamsExtended = $.extend({}, formParams, data)
                ;
                if ( typeof options['onSubmit_'+splashformId] === 'function' ) {
                    return options['onSubmit_'+splashformId].call(that, e, formParamsExtended);
                }
                else if ( typeof options.onSubmit === 'function' ) {
                    return options.onSubmit.call(that, e, formParamsExtended);
                }
                return true;
            });

            // Клик на кнопке
            this._events(actionButtons).un('click').on('click', function (e, data) {
                var
                    button = e.bemTarget,
                    id = button.getMod('id'),
                    formParamsExtended = $.extend({ id : id }, formParams, data),
                    actionId = 'actionClick_'+id,
                    func = options['onAction_'+id]
                ;
                if ( typeof func === 'function' ) {
                    return func.call(this, e, formParamsExtended);
                }
                return true;
            }, this);

            // Флаг инициализации
            screenElem.setMod('actions', 'inited');

        }
        catch (error) {
            console.error(error);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _getResultObject ** {{{ Получить объект с результатом действий, используюя параметры по умолчанию из опций
     */
    _getResultObject : function (resultObject, options) {

        options = options || {};

        return $.extend({}, options.result, resultObject);

    },/*}}}*/

    /** screenFormErrors() ** {{{ Показываем ошибки на экране (для type=form)
     * @param {string|object} screen - Название (тип) экрана (`loader`, `error`, ...) или bem-элемент (object)
     * @param {object} [options|array|string] - Ошибки или параметры.
     * @param {callback} [options.cbBeforeShow] - Callback ф-ции для действий непосредственно перед началом анимации показа экрана.
     */
    screenFormErrors : function (screen, options) {

        // Параметры
        options = options || {};

        var appholder = this,
            that = this,

            // Элемент экрана (по типу или сам объект)
            screenElem = ( typeof screen === 'string' ) ? this._elem({ elem : 'screen', modName : 'id', modVal : screen }) : screen,
            screenId = ( typeof screen === 'string' ) ? screen : ( screenElem.getMod('id') || 'defaultScreen' /* screenType */ ),
            // // screenType = screenElem.getMod('type'),
            // screenType = ( screenId.indexOf('form') === 0 ) ? 'form' : 'screen',

            // Форма
            splashform = screenElem.findChildBlock(BEMDOM.entity('splashform')),
            splashformId = splashform.getMod('id'),

            errorsElem = splashform._elem('errors'),

            content = ( typeof options === 'string' || Array.isArray(options) ) ? app.error2html(options) : ( ( options.error ) ? app.error2html(options.error) : '' ),

            undef
        ;

        var bemhtml = {
                block : 'splashform',
                elem : 'errors',
                content : content,
                options : options,
            },
            html = BEMHTML.apply(bemhtml);

        BEMDOM.replace(errorsElem.domElem, html);

        errorsElem = splashform.findChildElem('errors');

    },/*}}}*/
    /** screenFormOptions() ** {{{ Сохраняем опции формы
     * @param {string|object} screen - Название (тип) экрана (`loader`, `error`, ...) или bem-элемент (object)
     * @param {object} options - Набор опций для схранения в `splashform.params.options`.
     */
    screenFormOptions : function (screen, options) {

        var appholder = this,
            that = this,

            // Элемент экрана (по типу или сам объект)
            screenElem = ( typeof screen === 'string' ) ? this._elem({ elem : 'screen', modName : 'id', modVal : screen }) : screen,
            screenId = ( typeof screen === 'string' ) ? screen : ( screenElem.getMod('id') || 'defaultScreen' /* screenType */ ),
            // // screenType = screenElem.getMod('type'),
            // screenType = ( screenId.indexOf('form') === 0 ) ? 'form' : 'screen',

            // Форма
            splashform = screenElem.findChildBlock(BEMDOM.entity('splashform')),

            undef
        ;

        if ( splashform ) {
            // splashform.params.options = options;
            // Сохраняем старые значения
            splashform.params.options = $.extend({}, splashform.params.options, options);
        }

    },/*}}}*/

    /** currentAnimationPromise ** {{{ */
    currentAnimationPromise : function () {

        var appholder = this,
            params = this.params,
            that = this,

            promise = params.animatePromise
        ;

        if ( !this.isAnimatingNow() ) {
            delete params.animatePromise;
        }

        return params.animatePromise;

    },/*}}}*/

    /** isAnimatingNow ** {{{ */
    isAnimatingNow : function () {

        var appholder = this,
            params = this.params,
            that = this,

            promise = params.animatePromise
        ;

        return promise && promise.isResolved && !promise.isResolved();

    },/*}}}*/

    /** showScreen() ** {{{ Показываем экран
     * @param {string|object} screen - Название (тип) экрана (`loader`, `error`, ...) или bem-элемент (object)
     * @param {object} [options] - Параметры.
     * @param {callback} [options.cbBeforeShow] - Callback ф-ции для действий непосредственно перед началом анимации показа экрана.
     * @returns {Promise} - Окончание анимации
     *
     * TODO 2017.02.15, 01:31 -- Отлавливать момент, когда вызов происходит в момент анимации. (?) Аналогично с hideScreen.
     *
     */
    showScreen : function (screen, options) {

        // Параметры
        options = options || {};

        var appholder = this,
            params = this.params,
            that = this,

            // Элемент экрана (по типу или сам объект)
            screenElem = ( typeof screen === 'string' ) ? this._elem({ elem : 'screen', modName : 'id', modVal : screen }) : screen,
            screenId = ( typeof screen === 'string' ) ? screen : ( screenElem && screenElem.getMod('id') || 'defaultScreen' /* screenType */ ),
            // screenType = screenElem.getMod('type'),
            screenType = ( screenId.indexOf('form') === 0 ) ? 'form' : 'screen',

            // Действия перед началом показа экрана
            doBeforeShow = function () {
                ( typeof options.cbBeforeShow === 'function' ) && options.cbBeforeShow(screenElem, options);
            },

            undef
        ;

        try {

            // Если экран с формой не найден, создаём его
            if ( ( !screenElem || !screenElem.domElem ) && screenId ) {
                var screenBemhtml = {
                        block : 'appholder',
                        elem : 'screen',
                        elemMods : {
                            type : screenType,
                            id : screenId,
                        },
                        options : options,
                    },
                    screenHtml = BEMHTML.apply(screenBemhtml),
                    container = that._elem('container') || {},
                    screenElemDom = BEMDOM.append(container.domElem, screenHtml)
                ;
                // Находим элемент (и добавляем в кэш для нахождения через .elem в дальнейшем -- sic!)
                screenElem = that.findChildElem({ elem : 'screen', modName : 'id', modVal : screenId });
            }

            // Если экран с формой, то инициализируем форму
            if ( screenType === 'form' ) {

                // Сохраянем опции
                that.screenFormOptions(screenElem, options);

                // Показываем ошибки/сообщения, если есть
                that.screenFormErrors(screenElem, options);

                // Инициализируем действия
                that.initFormActions(screenElem, options);

            }

            // Промис, после которого цепляем себя (если анимация идёт сейчас)
            var prevPromise = that.currentAnimationPromise(); // params.animatePromise;

            // Анимация для показа экрана
            var promise = params.animatePromise = new vow.Promise(function (resolve,reject) {

                var subPromise = vow.cast(prevPromise)
                    .then(function(data){

                        var hideElems = [];

                        // ??? Скрываем все initial и show экраны кроме текущего
                        that.findChildElems({ elem : 'screen', modName : 'initial' })
                            .concat(that.findChildElems({ elem : 'screen', modName : 'show' }))
                            .map(function(elem){
                                if ( !Array.from(screenElem).includes(elem) && !hideElems.includes(elem) ) {
                                    hideElems.push(elem);
                                }
                            })
                        ;

                        var hideQueue = hideElems.map(function(elem){
                            return that.hideScreen(elem);
                        });

                        // Добавляем ожидание для скрытия всех нужных элементов
                        return vow.all(hideQueue);
                    })
                    .then(function(data){

                        // Устанавливаем тип показываемого экрана
                        // ???
                        that.setMod('mode', screenType);

                        // Убеждаемся, что заставка показана
                        return that.show();
                    })
                    .then(function(data){

                        if ( !screenElem || !screenElem.domElem ) {
                            return reject('no element found: '+screenId);
                        }

                        if ( !screenElem.getMod('show') ) {

                            that.setMod('animatingScreen', true);

                            var _showScreenElem = function () {

                                doBeforeShow();

                                screenElem.setMod('show', true);

                                screenElem.domElem.stop().animate({
                                    opacity: 1,
                                }, that._animateTimeout, function () {
                                    that.setMod('animatingScreen', false);
                                    return resolve(that._getResultObject({ status : 'animation done'}, options));
                                });

                            };

                            var elemsToHide = that.findChildElems({ elem : 'screen', modName : 'show', modVal : true });

                            // Скрываем все другие видимые экраны
                            // TODO: BemCollection?
                            if ( elemsToHide && elemsToHide.length ) {
                                elemsToHide.stop().animate({
                                    opacity: 0,
                                }, that._animateTimeout, function () {
                                    elemsToHide.setMod('show', false);
                                    elemsToHide.setMod('initial', false);
                                    _showScreenElem();
                                });
                            }
                            else {
                                _showScreenElem();
                            }

                        }
                        else {
                            doBeforeShow();
                            return resolve(that._getResultObject({ status : 'no animation' }, options));
                        }

                    })
                ;

            });

            return promise;

        }
        catch (error) {
            console.error(error);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/
    /** hideScreen() ** {{{ Скрываем экран
     * @param {string|object} screen - Название (тип) экрана (`loader`, `error`, ...) или bem-элемент (object)
     * @returns {Promise} - Окончание анимации скрытия
     */
    hideScreen : function (screen) {

        var appholder = this,
            that = this,

            // Элемент экрана (по типу или сам объект)
            screenElem = ( typeof screen === 'string' ) ? this._elem({ elem : 'screen', modName : 'id', modVal : screen }) : screen,
            screenId = ( typeof screen === 'string' ) ? screen : ( screenElem.getMod('id') || screenElem.getMod('type') ),

            undef
        ;

        that.delMod('mode');

        var promise = new vow.Promise(function (resolve,reject) {

            if ( !screenElem || !screenElem.domElem ) {
                return reject('no element found: '+screenId);
            }

            if ( screenElem.getMod('show') ) {

                that.setMod('animatingScreen', true);

                screenElem.domElem.stop().animate({
                    opacity: 0,
                }, that._animateTimeout, function () {
                    screenElem.setMod('show', false);
                    screenElem.setMod('initial', false);
                    that.setMod('animatingScreen', false);
                    return resolve('animation done');
                });

            }
            else {
                return resolve('no animation');
            }

        });

        return promise;
    },/*}}}*/

    /** hideScreenLoader() ** {{{ Скрываем экран загрузчика (после деактивации progressbar)
     * @returns {Promise} - Окончание анимации скрытия
     */
    hideScreenLoader : function () {

        var appholder = this,
            that = this;

        var promise = new vow.Promise(function (resolve,reject) {

            if ( that.getMod(that._screenLoader, 'show') ) {

                var _todo = function () {
                    $(that._screenLoader).stop().animate({
                        opacity: 0,
                    }, that._animateTimeout, function () {
                        that._progressbar.delMod('current');
                        that.delMod(that._screenLoader, 'show');
                        return resolve('animation done');
                    });
                };

                // if ( that._progressbar.animatedNow )
                if ( that._progressbar.getMod('active') ) {
                    that._progressbar.on('deactivated', _todo);
                }
                else {
                    _todo();
                }

            }
            else {
                return resolve('no animation');
            }

        });

        return promise;
    },/*}}}*/
    /** showScreenLoader() ** {{{ Скрываем экран загрузчика
     * @returns {Promise} - Окончание анимации скрытия
     */
    showScreenLoader : function () {

        var appholder = this,
            that = this;

        that._progressbar.setMod('current');

        return this.showScreen(this._screenLoader);

    },/*}}}*/
    /** showScreenLoaderOrDisappear() ** {{{ Показываем экран загрузчика или скрываем заставку, если загрузчик неактивен
     * @returns {Promise} - Окончание анимации скрытия
     */
    showScreenLoaderOrDisappear : function () {

        var appholder = this,
            that = this;

        if ( this._progressbar.getMod('active') ) {
            return this.showScreen(this._screenLoader);
        }
        else if ( this.isModeLoader() ) {
            return this.hideScreenLoader()
                .then(function(){
                    return that.hide();
                })
            ;
        }
        else {
            return this.hide();
        }

    },/*}}}*/

    /** error() ** {{{ Показать ошибку
     * @param {String} text - Текст сообщения.
     * @param {String} iconClass - Класс иконки значка ошибки.
     * @returns {Promise}
     */
    error : function (text, iconClass) {

        var appholder = this,
            returningDomElem,
            that = this;

        this.setMod('hasError', true);

        var promise =  this.showScreen('error', {
            cbBeforeShow : function () {
                if ( that._screenholder ) {
                    returningDomElem = that._screenholder.error(text, iconClass);
                }
                if ( that._screenholderErrors ) {
                    returningDomElem = that._screenholderErrors.error(text, iconClass);
                }
            },
        });

        return promise
            .then(function(status){
                return {
                    domElem : returningDomElem, // ??? async?
                    status : status,
                };
            })
        ;

    },/*}}}*/

    /** closeLoaderAndDisappear() ** {{{ Убираем загрузки и прячем заставку, если в режиме загрузки (не ошибка и не форма)
     * @param {boolean} hideAnyway - Прятать заставку даже в том случае, если loader не активен
     * @returns {Promise}
     */
    closeLoaderAndDisappear : function (hideAnyway) {

        var appholder = this,
            that = this,
            undef
        ;

        if ( this.isModeLoader() ) {
            return this.hideScreenLoader()
                .then(function(){
                    return that.hide();
                })
            ;
        }
        else if ( hideAnyway ) {
            return that.hide();
        }

        // return vow.cast(null);
        return vow.Promise.resolve({ status : 'no _screenLoader active' });

    },/*}}}*/

    /** show() ** {{{ Показываем заставку
     */
    show : function () {

        var appholder = this,
            that = this;

        var promise = new vow.Promise(function (resolve,reject) {

            if ( !that.getMod('show') ) {
                that.setMod('show', true);
                $(that.domElem).stop().animate({
                    opacity: 1,
                }, that._animateTimeout, function () {
                    return resolve('animation done');
                });
            }

            return resolve('no animation');

        });

        return promise;

    },/*}}}*
    /** hide() ** {{{ Скрываем заставку
     */
    hide : function () {

        var appholder = this,
            that = this;

        var promise = new vow.Promise(function (resolve,reject) {

            if ( that.getMod('show') ) {
                $(that.domElem).stop().animate({
                    opacity: 0,
                }, that._animateTimeout, function () {
                    that.setMod('show', false);
                    return resolve('animation done');
                });
            }

            return resolve('no animation');

        });

        return promise;

    },/*}}}*
    /** loaderStatusUpdate ** {{{ Обновить текущий статус
     * @param {string} [text] - Текст статуса (Если не задан, берётся из стека или по умолчанию).
     */
    loaderStatusUpdate : function (text) {

        text = text || this._statuses[0] || this._defaultStatus;

        var statusElem = this._elem('screen_type_loader_status') || {};

        BEMDOM.update(statusElem.domElem, text);

    },/*}}}*/

    /** loaderStatusSet() ** {{{ Установить статус ожидания
     * @param {string} text - Текст статуса
     * @param {boolean} [willBeRemoved=true] - Добавлять статус в стэк (будет удалено)?
     */
    loaderStatusSet : function (text, willBeRemoved) {

        willBeRemoved = typeof willBeRemoved === 'undefined' ? true : willBeRemoved;

        var appholder = this,
            that = this,
            params = this.params,

            statusElem = this._elem('screen_type_loader_status') || {},

            undef
        ;

        BEMDOM.update(statusElem.domElem, text);

        if ( willBeRemoved ) {
            this._statuses.unshift(text);
        }

    },/*}}}*/

    /** loaderStatusRemove ** {{{ Удалить статус (по названию или последний)
     */
    loaderStatusRemove : function (text) {

        if ( this._statuses && this._statuses.length ) {
            var changed = false;
            if ( text ) {
                var pos;
                if ( ( pos = this._statuses.indexOf(text) ) !== -1 ) {
                    this._statuses.splice(pos, 1);
                }
            }
            else {
                this._statuses.unshift();
            }
            this.loaderStatusUpdate();
        }

    },/*}}}*/

    /** getMode() ** {{{ Получить текущий режим
     * @returns {string} mode
     */
    getMode : function () {

        return this.getMod('mode');

    },/*}}}*/
    /** isMode() ** {{{ Проверить текущий режим
     * @param {string} mode -- Режим для проверки
     */
    isMode : function (mode) {

        return ( this.getMod('mode') === mode );

    },/*}}}*/
    /** isModeLoader() ** {{{ Проверить, является ли текущий режим режимом загрузки (ничего не произошло)
     */
    isModeLoader : function () {

        return this.isMode('loader');

    },/*}}}*/

    /** _on_inited() ** {{{ Инициализируем блок.
     */
    _on_inited : function() {


        var appholder = this,
            that = this,
            params = this.params,
            undef
        ;

        if ( !project.config.useAppholder ) {
            return;
        }

        // Экран с заставкой загрузки:
        this._screenLoader = this._elem({ elem : 'screen', modName : 'id', modVal : 'loader' }) || {};
        // Экран для показа ошибок
        this._screenError = this._elem({ elem : 'screen', modName : 'id', modVal : 'error' }) || {};

        this._progressbar = this.findChildBlock(BEMDOM.entity('progressbar'));

        // Собственный экран для вывода ошибок appholder:
        this._screenholderErrors = this.findChildBlock({ block : BEMDOM.entity('screenholder'), modName : 'id', modVal : 'appholderErrors' });

        // Перекрывающий экран для показа состояний занятости
        this._screenholderOver = this.findChildBlock({ block : BEMDOM.entity('screenholder'), modName : 'id', modVal : 'appholderOver' });

    },/*}}}*/

    /** toggleOverLoader ** {{{ Показываем или прячем перекрывающий экран занятости
     * @param {boolean} mode - Флаг: показывать или прятать
     */
    toggleOverLoader : function (mode) {

        if ( mode ) {
            return this._screenholderOver && this._screenholderOver.show('spin');
        }
        else {
            // Сбрасываем счётчик, если установлен
            this.params.overLoaderCount && ( this.params.overLoaderCount = 0 );
            return this._screenholderOver && this._screenholderOver.hide();
        }

    },/*}}}*/

    /** overLoader ** {{{ Уменьшаем или увеличиваем счётчик ожидающих загрузки процессов в зависимости от флага, в соотв. с его значением показываем или прячем перекрывающий экран индикации ожидания.
     * @param {boolean} mode - Флаг: увеличивать или уменьшать кол-во ожидающих задач
     */
    overLoader : function (mode) {

        ( this.params.overLoaderCount && this.params.overLoaderCount >= 0 ) || ( this.params.overLoaderCount = 0 );

        // Сохраняем предыдущее значение счётчика
        this.params.prevOverLoaderCount = this.params.overLoaderCount;

        // Изменяем текущее значение
        if ( mode ) {
            this.params.overLoaderCount++;
        }
        else if ( this.params.overLoaderCount > 0 ) {
            this.params.overLoaderCount--;
        }

        // Если нет больше ожидаемых заданий, то скрываем заставку
        if ( !this.params.overLoaderCount ) {
            return this.toggleOverLoader(false);
        }
        // Если первое ожидаемое задание, то показываем заставку
        else if ( !this.params.prevOverLoaderCount ) {
            return this.toggleOverLoader(true);
        }

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function () {

                var appholder = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._on_inited();

            },
        },/*}}}*/

    },/*}}}*/

})); // provide

}); // module

