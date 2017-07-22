/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project, window, document, setCookie, getCookie */
/**
 *
 * @module app
 * @overview Управление инфраструктурой одностраничного приложения (SPA).
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.07.26
 * @version 2016.07.27, 16:44
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: app.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * @see WEB_TINTS/source/blocks/shared/app/app.deps.js
 * @see WEB_TINTS/source/blocks/shared/app/_NavMenu/app_NavMenu.js
 *
 */
modules.define('app', [
    // 'app_controllers',
    'i-bem-dom',
    // 'vlayout',
    // 'appholder',
    // 'progressbar',
    // 'screenholder',
    'uri__querystring',
    'next-tick',
    'events__channels',
    'popup_controller',
    'waiter',
    'request_controller',
    'requestor',
    'project',
    'socket',
    'session',
    'vow',
    'store',
    'md5',
    'jquery'
],
function(provide,
    // app_controllers,
    BEMDOM,
    // vlayout,
    // appholder,
    // progressbar,
    // screenholder,
    querystring,
    nextTick,
    channels,
    popup_controller,
    waiter,
    request_controller,
    requestor,
    project,
    socket,
    session,
    vow,
    store,
    md5,
    $
) {

/**
 *
 * @class app
 * @classdesc Управление инфраструктурой одностраничного приложения (SPA).
 *
 *
 * TODO
 * ====
 *
 * 2017.03.22, 12:13 -- Выделение подмодулей:
 * - загрузка/предоставление данных,
 * - обработка ошибок,
 * - сессия/авторизация,
 * - открытие/закрытие страниц,
 * - работа с событиями/контентом заголовка/меню,
 * - параметры/конфигурация/состояние приложения,
 *
 * 2016.07.27, 16:34 -- Регистрация методов на закрытие страницы с подтверждением (можно закрыть/нельзя).
 *
 * 2016.08.03, 16:57 -- Повторная загрузка модулей (store) при загрузке browser.js пакетов.
 *
 * ОПИСАНИЕ
 * ========
 *
 * Параметры app.params
 * ====================
 *
 * - params.pageId : Идентификатор текущей страницы
 * - params.pageData : Описание текущей страницы
 *
 */

// Ссылка на описание модуля
var __module = this;

/** defaultParams ** {{{ Значения параметров по умолчанию.
 * @type {Object}
 */
var defaultParams = {

    /** [defaultParams] Время ожидания загрузки ресурсов. */
    asset_load_timeout : 600000, // XXX

    /** loaded_dicts ** Информация о загруженных данных/словарях "по требованию".
     * Сами данные хранятся в `app.params.dicts`.
     *
     * @type {Object}
     *
     */
    loaded_dicts : {
    },

    /** loaded_assets ** Информация о загруженных компонентах "по требованию".
     * @type {Object}
     *
     */
    loaded_assets : {
    },

    /** [defaultParams] Загруженные данные/словари **/
    dicts : {},

    /** [defaultParams] Загруженные данные/словари **/
    assets_data : {},

};/*}}}*/

provide(BEMDOM.declBlock(this.name, /** @lends app.prototype */ {

    /*{{{ Данные... */

    /** _clearLocationHash ** {{{
     */
    _clearLocationHash : function () {

        var prevLoadingPageFlag = app.params.loadingPageFlag;
        app.params.loadingPageFlag = true;
        window.location.hash = '';
        nextTick(function() {
            app.params.loadingPageFlag = prevLoadingPageFlag;
        });
        // history.replaceState({}, document.title, '.');

    },/*}}}*/

    /** _doLogon ** {{{ Запустить процесс авторизации
     */
    _doLogonAction : function (e) {
        e.preventDefault();
        this._clearLocationHash();
        this._initApp(true);
        return false;
    },/*}}}*/

    /** _specialPagesAcceptDom ** {{{ Действия при показе спецстраницы
     * @param specialId
     * @param {object} specialCtx
     * @param {DOM} domElem
     */
    _specialPagesAcceptDom : function (specialId, specialCtx, domElem) {
        var app = this,
            logonAction = $(domElem).find('#appLogon'),
            logonMethod = this._doLogonAction
        ;
        if ( logonAction && logonAction.length && logonMethod ) {
            this._domEvents(logonAction)
                .un('click', logonMethod)
                .on('click', logonMethod)
            ;
        }
    },/*}}}*/

    /** _specialPages{} ** {{{ Спецстраницы (напр., `SignedOut`) */
    _specialPages : {

        /*{{{*/AuthError : {
            title : 'Ошибка',
            icon : 'ti-lock',
            content : {
                block : 'page_message',
                escapeContent : false,
                content : [
                    { elem : 'title', content : 'Возникла ошибка', },
                    { elem : 'text', content : [
                        {
                            block : 'link',
                            url : '{{rootUrl}}application/User/signin',
                            id : 'appLogon',
                            content : 'Заново войти в систему',
                        },
                    ] },
                ]
            },
            // acceptDom : function (specialId, specialCtx, domElem) {
            // },
        },/*}}}*/

        /*{{{*/SignedOut : {
            title : 'Сеанс работы с системой завершён',
            icon : 'ti-lock',
            content : {
                block : 'page_message',
                content : [
                    { elem : 'title', content : 'Сеанс работы с системой завершён', },
                    { elem : 'text', content : [
                        {
                            block : 'link',
                            url : '{{rootUrl}}application/User/signin',
                            id : 'appLogon',
                            content : 'Заново войти в систему',
                        },
                    ] },
                ]
            },
            // acceptDom : function (specialId, specialCtx, domElem) {
            // },
        },/*}}}*/

    },/*}}}*/

    /** Обработчики закрытия страницы.
     * @type {Callback[]}
     */
    on_page_close_callbacks : [],

    /** Обработчики, которых опрашивают перед закрытием страницы: если вызывают переданный callback, то страницу можно закрывать. Реально закрывается, если все обработчики подтвердили закрытие.
     * @type {Callback[]}
     */
    before_page_close_pollers : [],

    /** Ошибки во время загрузки
     * @type {String[]}
     */
    load_errors : [],

    /** Счётчик ожидания загрузки ресурсов.
     * @type {Number}
     */
    load_waiting : 0,

    /** Флаг занятости. Состояние выполнения блокирующей процедуры. true : джём до завершения.
     * @type {Boolean}
     * @see См. {@link app#do}
     */
    operating : false,

    /** Очередь задач на выполнение после завершения текущей операции.
     * @type {Boolean}
     * @see См. {@link app#do}
     */
    operating_callbacks : [],

    registered_channel_events : [],

    collected_errors : '',

    /*}}}*/

    // Методы

    /** error2string ** {{{ Преобразование строки/объекта в текст ошибки
     * @param {*} o - Переменная для преобразования в строку
     * @returns {string}
     * TODO 2017.02.14, 23:11 -- Отработать многострочные разрывы (параграф, перенос строки...)
     */
    error2string : function (error) {

        var app = this,
            that = this,
            text = '',
            maxShowStringLength = project.config.maxShowStringLength || 300,
            match,
            undef
        ;

        try {

            // Если ошибка -- не объект, показываем, как строку
            if ( typeof error !== 'object' ) {
                text = String(error);
            }
            // Если ошибка уже обработана, то ничего не показываем
            else if ( !error || error.processed ) {
                return '';
            }
            else if ( Array.isArray(error) ) {
                text = error.map(this.error2string, this).join('\n\n');
            }
            // Объект с ошибкой
            else if ( error instanceof Error ) {
                text = /* error.stack ||  */error.message || String(error);
                if ( error.stack ) {
                    text += '\n\n<pre>' + error.stack + '</pre>';
                }
                if ( Array.isArray(error.trace) ) {
                    text += '\n\n<small><b>Ошибка перехвачена в:</b> ' + error.trace.join(', ') + '</small>';
                }
            }
            // ajax 404
            else if ( ( ( error.jqXHR && error.jqXHR.status === 404 ) || error.error === 'Not found' ) && error.settings && error.settings.url ) {
                console.warn( 'app error2string Not found', error );
                text = 'Ресурс не найден: <u>'+error.settings.url+'</u>';
            }
            else if ( error.message ) {
                console.warn( 'app error2string message', error );
                // text += ( error.description || 'Сообщение об ошибке:' ) + '\n\n';
                text += error.message;
            }
            else if ( /* error.error === 'errorMessages' && */ Array.isArray(error.errorMessages) ) {
                console.warn( 'app error2string errorMessages', error );
                // text = ( error.description || 'Список ошибок:' ) + '\n\n';
                text += error.errorMessages
                    .map(function(error){ return that.error2string(error); })
                    .join('\n\n')
                ;
            }
            else if ( error.textStatus === 'parsererror' ) {
                text = 'Ошибка обработки ответа сервера';
                var plusText = error.error || ( error.jqXHR && error.jqXHR.responseText && ( match = error.jqXHR.responseText.match(/<b>(Parse error|Fatal error).*/) ) !== null && match[0] ) ;
                if ( plusText ) {
                    if ( plusText.length > maxShowStringLength ) {
                        plusText = plusText.substr(0, maxShowStringLength-3)+'...';
                    }
                    text += '\n' + plusText;
                }
            }
            else if ( error.error === 'jqXHR' ) {
                console.warn( 'app error2string jqXHR', error );
                text = error.description || 'Ошибка ajax';
                var
                    props = {
                        'адрес' : error.url || error.location,
                    },
                    propsText = Object.keys(props)
                        .filter(function(name){ return props[name] ? true : false; })
                        .map(function(name){ return name+': '+props[name]; })
                        .join(', ')
                ;
                if ( propsText ) {
                    text += ' ('+propsText+')';
                }
                return text;
            }
            else if ( error.error && typeof error.error === 'object' /* && !Array.isArray(error.error) */ ) {
                text += this.error2string(error.error);
            }
            else {
                text = error.description || error.message || error.error || error.errorText || 'Неопределённая ошибка';// String(error);
                // ?????
                if ( error.jqXHR && error.jqXHR.responseText ) {
                    text += '\n\n' + error.jqXHR.responseText;
                }
                if ( error.error && typeof error.error === 'object' ) {
                    text += '\n\n' + this.error2string(error.error);
                }
                if ( Array.isArray(error.trace) ) {
                    text += '\n\n<b>Ошибка перехвачена в:</b> ' + error.trace.join(', ');
                }
            }

            return text.trim();

        }
        catch (e) {
            console.error( 'error2string error:', e );
            /*DEBUG*//*jshint -W087*/debugger;
            ( e.trace || ( e.trace = [] ) ).push('app:error2string');
            return e;
        }
    },/*}}}*/

    /** error2html ** {{{ Преобразование строки/объекта в html-текст ошибки
     * @param {*} o - Переменная для преобразования в строку
     * @returns {string} HTML
     */
    error2html : function (e) {

        var errorText = this.error2string(e),
            errorHtml = '<p>' + errorText.trim().replace(/(\s*\n){2,}/g, '</p><p>').replace(/\s*\n/g, '<br>') + '</p>',
            undef
        ;

        return errorHtml;

    },/*}}}*/

    /** error() ** {{{ Прерываем операции (?), показываем сообщение об ошибке
     * @param {...} errors - Список сообщений об ошибке. Отдельные параметры объединяются через пробел.
     */
    error : function (error) {

        var app = this,
            that = app,
            params = this.params,
            args = Array.prototype.slice.call(arguments),
            firstArg = args[0]
        ;

        // Если одиничная ошибка, проверяем на спецошибки // XXX
        if ( args.length === 1 && typeof firstArg === 'object' && firstArg ) {
            // Ошибка обработана; ничего не делаем
            if ( firstArg.processed ) {
                return;
            }
            // Если отмена авторизации
            else if ( firstArg.error === 'AuthCancelled'
              || ( firstArg.textStatus === 'canceled' && firstArg.error === 'отмена авторизации' ) ) {
                return this.showSpecialPage('SignedOut');
            }
        }

        var
            textArgs = args.map(function(arg){
                return that.error2string(arg);
            }),
            errorText = textArgs.join(' ').replace(/\s*<br[^<>]*>[\n\r]*/g, '\n').trim(),
            // errorText = Array.prototype.slice.call(arguments).join(' ').replace(/\s*<br[^<>]*>[\n\r]*/g, '\n'),
            errorHtml = errorText.replace(/(\s*\n){2,}/g, '<p>').replace(/\s*\n/g, '<br>'),
            errorPlain = errorText.replace(/<[^<>]*>/g, '').replace(/(\s*\n){3,}/g, '\n\n'),
            currentScreenholder = ( this._appholder && this._appholder.getMod('show') ) ? this._appholder : this.screenholder,
            undef
        ;

        try {

            console.error( 'app.error called', errorPlain );
            /*DEBUG*//*jshint -W087*/debugger;

            // Если ошибка пустая, ничего не делаем
            if ( !errorText ) {
                return;
            }

            // this.screenholder && this.screenholder.error(this.collected_errors);
            // currentScreenholder && currentScreenholder.error(this.collected_errors);
            if ( currentScreenholder ) { currentScreenholder.error(errorHtml); }

            // popup_controller.error(errorHtml, 'Ошибка приложения');

        }
        catch (e) {
            console.error(e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** __error ** {{{ Обработка внутренней ошибки
     * @param {Object|*} error - Ошибка
     * @param {String} [methodName] - Имя метода, вызвавшего ошибку. Если не укзан, пробуем определить через `callee.caller`.
     * @returns {Promise} - reject-промис с ошибкой.
     *
     * Вывод сообщения о вызове (модуль, метод) в консоль, останавливает
     * выполнение (debugger), добавляет информацию о вызове в ошибку (если
     * объект), возвращает проваленный (rejected) промис с ошибкой.
     */
    __error : function (error, methodName) {

        methodName = methodName || ( arguments.callee && arguments.callee.caller && arguments.callee.caller.name ) || '(anonymous)'; // jshint ignore:line

        var errorId = __module.name + ':' + methodName;

        console.error( errorId, error );
        /*DEBUG*//*jshint -W087*/debugger;

        if ( !error ) { error = {}; }
        else if ( typeof error !== 'object' || Array.isArray(error) ) { error = { error : error }; }

        // if ( error && typeof error === 'object' && !Array.isArray(error) ) {
        ( error.trace || ( error.trace = [] ) ).push(errorId);
        // }

        return vow.Promise.reject(error);

    },/*}}}*/

    /** do(callback) ** {{{ Выполнение критичной процедуры: отлженное или сразу, с учётом флага занятости. (???)
     * @param {Callback} callback
     *
     * @see См. {@link app#operating}, {@link app#operating_callbacks}
     *
     */
    do : function (callback) {

        // var app = this;

        ( this.operating_callbacks || (this.operating_callbacks=[]) ).push(callback);

        if ( !this.operating ) {
            this.operating = true;
            var waited_callback;
            while ( waited_callback = this.operating_callbacks.shift() ) {
                waited_callback();
            }
            // callback();
            this.operating = false;
        }

    },/*}}}*/

    /** _renewSession() ** {{{ Обновляем сессию
     */
    _renewSession : function () {

        // Если не залогинены или обновление происходит сейчас, то ничего не делаем
        if ( /* !this.getMod('loggedOn') || */ this._renewingSessionNow ) {
            return;
        }
        // Иначе устанавливаем флаг
        else {
            this._renewingSessionNow = true;
        }

        var app = this,
            params = this.params,

            oldToken = getCookie(project.config.authCookieName),

            renewUrl = project.helpers.expand_path(project.config.renew_session_url),

            requestTimeout = app.params.asset_load_timeout, //30000,

            renew_waiter_settings = {
                id : 'renewSession',
                title : 'Обновление сессии',
                timeout : requestTimeout,
                method : 'GET',
                url : renewUrl,
                silent_errors : true,
            },

            renewWaiter = request_controller.do_waiter_request(renew_waiter_settings),

            newToken,
            newTokenData
        ;

        // Иначе (не проверка) обычный вызов.
        // Наверное, вообще можно ничего не обрабатывать по завершении?
        renewWaiter
            .then(function(data){
                newToken = getCookie(project.config.authCookieName);
                newTokenData = data.tokenValue;
                return data;
            })
            .fail(function(error) {
                if ( app._renewSessionTimer ) {
                    clearTimeout(app._renewSessionTimer);
                    delete app._renewSessionTimer;
                }
                if ( error.indexOf('<a href') === -1 ) {
                    var auth_url = project.helpers.expand_path(project.config.auth_url);
                    error = 'Ошибка авторизации\n'+error+'\n<a href="'+auth_url+'">Аторизоваться</a>';
                }
                app.error(error);
                /*DEBUG*//*jshint -W087*/debugger;
                return error;
            })
            .always(function(){
                app._renewingSessionNow = false;
            })
        ;

        return renewWaiter;

    },/*}}}*/

    /** _stopRenewSession() ** {{{ Останавливаем периодическое обновление сессии
     */
    _stopRenewSession : function () {

        var app = this,
            undef
        ;

        if ( this._renewSessionTimer ) {
            clearInterval(this._renewSessionTimer);
            delete this._renewSessionTimer;
        }

    },/*}}}*/
    /** _startRenewSession() ** {{{ Инициируем периодическое обновление сессии
     */
    _startRenewSession : function () {

        var app = this,
            params = this.params,

            token_refresh_time = params.config.token.refresh_time

        ;

        if ( !project.config.LOCAL_ENB ) {

            this._renewSessionTimer = setInterval(function(){
                app._renewSession();
            }, token_refresh_time);
        }

    },/*}}}*/
    /** _startSocket() ** {{{ Запускаем работу с сокетами
     * @returns {Promise}
     */
    _startSocket : function () {

        if ( !project.config.useSockets ) {
            return vow.Promise.resolve({ status : 'notUseSockets', description : 'Сокеты не используются (параметр конфигурации)' });
        }

        var app = this,
            params = this.params,

            // Метод информирования об ошибках подключения сокетов -- в зависимости от конфигурации, либо ошибка, либо игнорирование
            waiterFailMethod = project.config.catchSocketsError ? waiter.error : waiter.done,
            waiterFail = waiterFailMethod.bind(waiter),

            waiterId = 'startSocket' + Date.now(),
            socketWaiter = waiter.start(waiterId, {
                title: 'Подключение сокетов',
                timeout : 30000,
                on_cancel : function () {
                    app.socket.disconnect();
                    waiterFail(waiterId, { status : 'socketConnectionCanceled', description : 'Подключение сокетов отменено' });
                },
            })
        ;

        app.socket.connect()
            .then(function(data){
                waiter.done(waiterId, data);
                return data;
                // return vow.Promise.resolve({ status : 'socketsNotPresent', error : e });
            })
            .fail(function(error){
                // auth-fail:
                //  description : "Отказ авторизации сокетов"
                //  error : "socketError"
                //  msg : "redisClient.get("ko:3047134149476200959184219bf69c4.19119989") error: empty reply"
                //  socket : Object
                //  socketToken : "3047134149476200959184219bf69c4.19119989"
                //  socketUrl : "http://localhost:8083"
                //  trace : Array(1)
                //  type : "socketAuthError"
                console.error( '_startSocket fail', error );
                /*DEBUG*//*jshint -W087*/debugger;
                var result = { status : 'socketsAbsent', description : 'Отсутствует подключение к сокетам', error : error };
                waiterFail(waiterId, result);
            })
        ;

        return socketWaiter;

    },/*}}}*/
    /** _stopSocket() ** {{{ Останавливаем работу с сокетами
     * @returns {Promise}
     */
    _stopSocket : function () {

        var app = this,
            params = this.params
        ;

        if ( !app.socket.isConnected() ) {
            return vow.Promise.resolve({ status : 'nothingToDisconnect' });
        }

        return app.socket.disconnect()
            // .then(function(data){
            //     return data;
            // })
            .fail(function(e){
                // return app.error(e);
                return app.__error(e, '_stopSocket:Promise');
            })
        ;

    },/*}}}*/

    /** register_channel_event() ** {{{ Устанавливаем и сохраняем для последующего автоматического сброса при закрытии страницы событие канала.
     * @param {string} channel_id
     * @param {string} event_id
     * @param {callback} callback
     * @param {boolean} is_once
     */
    register_channel_event : function (channel_id, event_id, callback, is_once) {

        typeof this.registered_channel_events[channel_id] === 'undefined'
            && ( this.registered_channel_events[channel_id] = [] );
        this.registered_channel_events[channel_id].indexOf(event_id) === -1
            && this.registered_channel_events[channel_id].push(event_id);

        if ( is_once ) {
            channels(channel_id).once(event_id, callback);
        }
        else {
            channels(channel_id).on(event_id, callback);
        }

    },/*}}}*/

    /** init_window_actions() ** {{{ (???) Инициализируем глобальные функции (для работы модульной системы).
     *
     */
    init_window_actions : function () {

        var app = this;

        /** TODO: Функции обратных вызовов пока не используются */

    },/*}}}*/

    /** load_asset(asset_params) ** {{{ Загружаем ресурс
     *
     * TODO 2016.11.02, 12:25 -- Переделать под Promise и все запросы под ajax. (!!!)
     * TODO 2016.08.03, 14:09 -- +dicts (2016.08.16, 19:18 -- ???)
     * TODO 2016.08.16, 19:18 -- +передача данных в запрос
     * TODO 2016.08.17, 14:04 -- Накопление колбеков (повторный вызов во время загрузки)
     *
     * @param {Object} asset_params - Объект описания ресурса.
     * @param {String} asset_params.type - Тип ресурса (package, script, style, json, html)
     * @param {String} [asset_params.kind] - (Для type=package) Тип пакета (browser.js, bemhtml.js, styles.css)
     * @param {String} [asset_params.id] - (Для type=package) Идентификатор пакета
     * @param {String} [asset_params.url] - Адрес загрузки ресурса (Не обязателен для type=package && kind && id).
     * @param {String} [asset_params.get] - Метод загрузки (get, post).
     * @param {Object} [asset_params.data] - Данные для передачи на сервер.
     * @param {Object} [asset_params.expires] - Время жизни данных (если тип 'data' или 'request') -- ???.
     *
     * @param {Callback} [on_success] - Обратный вызов в случае успеха.
     * @param {Callback} [on_error] - Обратный вызов в случае ошибки.
     *
     */
    load_asset : function (asset_params, on_success, on_error) {

        var app = this;
        var params = this.params;

        var id;

        // {{{ Если указан идентификатор (ресурс был загружен ранее -- в описании не указываем прямо)...
        if ( asset_params.id ) {
            id = asset_params.id;
        }// }}}
        // {{{ ...иначе созадаём идентификатор...
        else {
            id = asset_params.type || 'data';
            // Для пакета
            if ( asset_params.type === 'package' ) {
                // Если указан адрес
                if ( asset_params.url ) {
                    var no_min_url = asset_params.url.replace(/\.min\b/, '');
                    var res = no_min_url.match(/([\w\.-]+)\.(bemhtml\.(js)|browser\.(js)|styles\.(css))$/);
                    if ( !res ) {
                        console.error('Не указан идентификатор пакета для загрузки:', asset_params);
                        typeof on_error === 'function' && on_error('Не указан идентификатор пакета для загрузки: '+asset_params.url);
                        return false;
                    }
                    if ( !asset_params.name ) { asset_params.name = res[1]; }
                    if ( !asset_params.kind ) { asset_params.kind = res[2]; }
                }
                // ... иначе, если нет адреса, но указаны тип и имя пакета, собираем адрес:
                else if ( asset_params.name && asset_params.kind ) {
                    var root_prefix;
                    // Если локальный enb-server, запрашиваем из папки бандлов: '/pages/<bundle>/<bundle>.<kind>'
                    if ( project.config.LOCAL_ENB ) {
                        root_prefix = '/pages/'
                            + asset_params.name
                            + '/'
                            ;
                    }
                    // Иначе из стандартной серверной локации: '.../{js,css}/bem/<bundle>.<kind>
                    else {
                        root_prefix = project.config.coreUrl
                            + asset_params.kind.replace(/(bemhtml|browser|styles)\./,'')
                            + '/bem/'
                            ;
                    }
                    asset_params.url = root_prefix
                        + asset_params.name
                        + '.'
                        + asset_params.kind
                        ;
                    // ???
                    // Для enb-server запрашиваем переупакованные пакеты (.bemhtmlx.js, .browserx.js, .stylesx.css)
                    if ( project.config.LOCAL_ENB ) {
                        // asset_params.url = asset_params.url.replace(/(bemhtml|browser|styles)(\.js|\.css)/,'$1x$2');
                        asset_params.url = asset_params.url.replace(/(bemhtml|browser|styles)(\.(?:js|css))/,'$1x$2');
                    }
                    // ???
                    // Для рабочего сервера запрашиваем минимизированную версию, если не режим отладки
                    if ( !project.config.LOCAL_ENB && project.useMinifiedPackets && project.config.MINEXT ) {
                        asset_params.url = asset_params.url.replace(/(\.(?:js|css))$/, project.config.MINEXT+'$1');
                    }
                }
                // ...Иначе невозможно сформировать id
                else {
                    console.error('Невозможно сформировать идентификатор пакета: ', asset_params);
                    typeof on_error === 'function' && on_error('Невозможно сформировать идентификатор пакета: '+asset_params);
                    return false;
                }
                id += ':'+asset_params.kind+':'+asset_params.name;
            }
            // ...для обычного ресурса (скрипт, стили и т.д.)
            else {
                id += ':'+asset_params.url;
            }
            // Сохраняем идентификатор в описании
            asset_params.id = id;
        }// }}}

        var current_time = Date.now(),
            loaded_asset = params.loaded_assets[id],
            on_success_cb,
            on_error_cb
        ;

        // {{{ Создаём объект отслеживания ресурса, если не создан ранее...
        if ( typeof loaded_asset === 'undefined' ) {
            loaded_asset = params.loaded_assets[id] = {
                params : asset_params,
                on_success_stack : [],
                on_error_stack : [],
            };
        }// }}}

        if ( !loaded_asset.on_success_stack ) { loaded_asset.on_success_stack = []; }
        if ( !loaded_asset.on_error_stack ) { loaded_asset.on_error_stack = []; }
        typeof on_success === 'function' && loaded_asset.on_success_stack.push(on_success);
        typeof on_error === 'function' && loaded_asset.on_error_stack.push(on_error);

        // TODO 2016.08.17, 13:59 -- +Проверка на таймаут?
        // {{{ Если установлен флаг загруженности и период актуальности не истёк, то загружен ранее -- завершаемся с успехом.
        if ( loaded_asset.loaded
          && loaded_asset.time
          && ( !asset_params.expires || current_time - loaded_asset.time < asset_params.expires ) ) {
            if ( loaded_asset.on_success_stack ) {
                while ( on_success_cb = loaded_asset.on_success_stack.shift() ) {
                    on_success_cb();
                }
            }
            delete loaded_asset.on_success_stack;
            delete loaded_asset.on_error_stack;
            return true;
        }// }}}

        // Заменяем переменные пути
        asset_params.url = project.helpers.expand_path(asset_params.url);

        // {{{ Если урл не абсолютный (или ссылающийся на верхний уровень иерархии?)
        // -- не для пакетов, для них путь формируем отдельно (см.выше)...
        if ( !asset_params.url.startsWith('http://')
          && !asset_params.url.startsWith('../')
          && !asset_params.url.startsWith('/')
          && project.config.staticUrl ) {
            // ...считаем, что файл располагается в папке со статическими ресурсами
            asset_params.url = project.config.staticUrl + asset_params.url;
        }// }}}

        // Анти-кэш
        if ( app.config.bem.hashTag && asset_params.url.match(/\.(css|js|htm|html|txt|json)$/) ) {
            asset_params.url += '?--' + app.config.bem.hashTag;

        }

        // Для локального enb-сервера (и режима эмуляции) пакеты не загружаем
        // -- в демо-режиме указываем всё необходимое в зависисмостях
        // при генерации страницы из bem-xjst (чтобы сформировать заодно и bemjson страницы).
        if ( app.getMod('emulate') && asset_params.type === 'package' && asset_params.name === app.params.pageId ) {
            if ( loaded_asset.on_success_stack ) {
                while ( on_success_cb = loaded_asset.on_success_stack.shift() ) { // jshint ignore:line
                    on_success_cb();
                }
            }
            delete loaded_asset.on_success_stack;
            delete loaded_asset.on_error_stack;
            return;
        }

        // Иначе загружаем ресурс:

        // {{{ Стили загружаем без отслеживания результата процесса.
        if ( asset_params.type === 'style' || asset_params.kind === 'styles.css' ) {
            loaded_asset.loaded = true;
            loaded_asset.time = current_time;
            var link = document.createElement('link');
            link.setAttribute('rel', 'stylesheet');
            link.setAttribute('type', 'text/css');
            link.setAttribute('href', asset_params.url);
            var head = document.getElementsByTagName('head')[0];
            head.insertBefore(link, head.firstChild);
            if ( loaded_asset.on_success_stack ) {
                while ( on_success_cb = loaded_asset.on_success_stack.shift() ) { // jshint ignore:line
                    on_success_cb();
                }
            }
            delete loaded_asset.on_success_stack;
            delete loaded_asset.on_error_stack;
        }// }}}
        // {{{ ... Иначе загружаем скрипт...
        else /* if ( false ) */ {
            // Если уже загружается...
            if ( loaded_asset.waiting ) {
                // ...ничего не делаем.
                return true;
            }
            // {{{ Подготавливаем...
            // Устанавливаем флаг ожидания...
            loaded_asset.waiting = true;
            // ...и увеличиваем счётчик ожидания.
            app.load_waiting++;
            // Идентификатор ожидателя:
            var waiter_id = ('app_asset_load_'+id).replace(/[^A-z0-9]+/g,'_')+'_'+Date.now();
            // }}}
            // {{{ Код для окончания загрузки:
            var done_loading = function (error) {

                // Обработка ошибок
                if ( error ) {
                    if ( loaded_asset.on_error_stack ) {
                        while ( on_error_cb = loaded_asset.on_error_stack.shift() ) { // jshint ignore:line
                            on_error_cb(error);
                        }
                    }
                    delete loaded_asset.on_success_stack;
                    delete loaded_asset.on_error_stack;
                }

                // Если очередь загружающихся ресурсов пуста и всё ещё ждём...
                if ( !--app.load_waiting ) { // XXX!!!
                    // ...завершаем ожидание.
                    waiter.finish('app_load_assets_and_dicts');
                }

            };// }}}
            // {{{ Стартуем ожидатель:
            waiter.start(waiter_id, {
                title : 'Загрузка ресурса '+id,
                timeout : app.params.asset_load_timeout,
                timeout_break : true,
                on_timeout : function () {
                    // jsdoc error: Delete of an unqualified identifier in strict mode. -- ???
                    // delete loaded_asset; // ERROR: Delete of an unqualified identifier in strict mode ???
                    done_loading('Превышено время ожидания для загрузки ресурса '+id);
                },
                on_cancel : function () {
                    // Завершаем ожидание
                    waiter.finish(waiter_id);
                    // jsdoc error: Delete of an unqualified identifier in strict mode. -- ???
                    // delete loaded_asset; // ERROR: Delete of an unqualified identifier in strict mode ???
                    done_loading('Отменена загрузка ресурса '+id);
                },
                on_finish : function () {
                    done_loading();
                },
            });// }}}
            // {{{ В зависимости от типа: ... Если данные (html, json, запрос)...
            if ( typeof asset_params.type === 'undefined' || asset_params.type === 'request' || asset_params.type === 'data' ) {
                requestor.promiseRequest(asset_params)
                    .then(function(data){

                        waiter.finish(waiter_id);
                        delete loaded_asset.waiting;
                        loaded_asset.loaded = true;
                        loaded_asset.time = current_time;

                        params.assets_data[id] = data;

                        if ( loaded_asset.on_success_stack ) {
                            while ( on_success_cb = loaded_asset.on_success_stack.shift() ) {
                                on_success_cb(data);
                            }
                        }
                        delete loaded_asset.on_success_stack;
                        delete loaded_asset.on_error_stack;

                    })
                    .fail(function(data){
                        console.error( 'asset_load fail', id, data );
                        /*DEBUG*//*jshint -W087*/debugger;

                        waiter.finish(waiter_id, data);

                        if ( loaded_asset.on_error_stack ) {
                            while ( on_error_cb = loaded_asset.on_error_stack.shift() ) {
                                on_error_cb(data);
                            }
                        }

                        delete loaded_asset.on_success_stack;
                        delete loaded_asset.on_error_stack;
                    })
                ;

            }// }}}
            // {{{ Если скрипт (пакет или сам по себе)...
            else if ( asset_params.type === 'script' || asset_params.kind === 'browser.js' || asset_params.kind === 'bemhtml.js' ) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.charset = 'utf-8';
                script.src = loaded_asset.params.url;
                script.onload = function script_onload () {
                    var script_loaded = function script_loaded (result) {
                        waiter.finish(waiter_id);
                        if ( loaded_asset ) {
                            delete loaded_asset.waiting;
                            loaded_asset.loaded = true;
                            loaded_asset.time = current_time;
                            if ( loaded_asset.on_success_stack ) {
                                while ( on_success_cb = loaded_asset.on_success_stack.shift() ) {
                                    on_success_cb();
                                }
                            }
                            delete loaded_asset.on_success_stack;
                            delete loaded_asset.on_error_stack;
                        }
                    };
                    if ( true || script.src.endsWith('browser.js') || script.src.endsWith('browser.min.js') ) {
                        modules.require([
                            'i-bem-dom__init',
                        ], function(){
                            script_loaded();
                        });
                    }
                    else {
                        script_loaded();
                    }
                };
                var headTag = document.getElementsByTagName('head')[0];
                headTag.insertBefore(script, headTag.firstChild);
            }// скрипт }}}
        }// }}}

        return true;

    },/*}}}*/

    /** load_dicts_queue_request(...) ** {{{ Загружаем данные/словари по списку и типу кеша
     *
     * @param {String[]} idlist - Список идентификаторов данных/словарей для загрузки
     * @param {String} lifetime_id - Идентификатор типа кеширования.
     *   См. `$_CONSTANTS['cache']['_DATA_TYPES']`
     *   в `WEB_TINTS/core/scripts/php/app/config/config_constants.php`
     * @param {Callback} on_success - Выполняем в случае успеха.
     * @param {Callback} on_error - Выполняем в случае ошибки.
     * @param {String} load_waiting_waiter_id - Идентификатор ожидателя для завершения,
     *   если счётчик загружаемых ресурсов ({@link app#load_waiting}) равен нулю.
     *   Напр., 'app_load_assets_and_dicts'.
     */
    load_dicts_queue_request : function (idlist, lifetime_id, on_success, on_error, load_waiting_waiter_id) {

        var app = this,
            params = this.params;

        var op_id = 'app_load_dicts_queue',
            idlist_s = idlist.join(','),
            idlist_sx = idlist_s.replace(/,\s*/g, '_'),
            idlist_ss = idlist.join(', '),
            request_id = op_id + '_' + idlist_sx + Date.now()
        ;

        app.load_waiting++;

        var ajax_url = project.helpers.get_remote_url(op_id),
            ajax_method = project.helpers.get_remote_method(op_id),
            ajax_data = {
                lifetime : lifetime_id,
                idlist : idlist_s,
            },
            load_dicts_waiter = requestor.waiterRequest({
                request_id : request_id,
                title : 'Загрузка параметров приложения: '+idlist_ss,
                method : ajax_method,
                url : ajax_url,
                data : ajax_data,
            }),
            DONE
        ;

        load_dicts_waiter
            .then(function(data){

                // Если очередь загружающихся ресурсов пуста и всё ещё ждём... -- ???
                if ( !--app.load_waiting && load_waiting_waiter_id ) {
                    // ...завершаем ожидание.
                    waiter.finish(load_waiting_waiter_id);
                }

                if ( typeof on_success === 'function' ) {
                    on_success(data);
                }

            })
            .fail(function (error) {

                console.error( 'app_load_dicts_queue error', error, idlist );
                /*DEBUG*//*jshint -W087*/debugger;

                // waiter.finish(waiter_id);

                // app.load_waiting--;
                if ( typeof on_error === 'function' ) {
                    on_error(error);
                }

            })
        ;

        return load_dicts_waiter;

    },/*}}}*/

    /** load_dicts(...) {{{ Загружаем данные/словари по списку.
     *
     * @param {String[]} idlist - Список идентификаторов данных/словарей для загрузки
     * @param {Callback} on_success - Выполняем в случае успеха.
     * @param {Callback} on_error - Выполняем в случае ошибки.
     * @param {String} load_waiting_waiter_id - Идентификатор ожидателя для завершения,
     *   если счётчик загружаемых ресурсов ({@link app#load_waiting}) равен нулю. Передаётся напрямую в
     *   {@link app#load_dicts_queue_request}. Напр., 'app_load_assets_and_dicts'.
     *
     * @returns {Promise}
     *
     */
    load_dicts : function (idlist, on_success, on_error, load_waiting_waiter_id) {

        var app = this,
            params = this.params,

            idlist_s = idlist.join(','),
            idlist_sx = idlist_s.replace(/\W+/g, '_'),
            idlist_ss = idlist.join(', '),
            current_time = Date.now(), // Получаем текущее время (msec)

            // Подготовка данных для колбэка
            /** ** {{{*/get_all_data = function () {
                var all_data = {};
                idlist.forEach(function _idlist_map (dict_id) {
                    if ( typeof params.dicts[dict_id] === 'undefined' ) {
                        params.dicts[dict_id] = {}; // WTF???
                    }
                    all_data[dict_id] = params.dicts[dict_id];
                });
                return all_data;
            },/*}}}*/

            undef
        ;

        var load_dicts_promise = new vow.Promise(function _load_dicts_promise (resolve,reject) {

            // Если нечего загружать, возвращаем пустой набор словарей
            if ( !idlist || !Array.isArray(idlist) || !idlist.length ) {
                return resolve({});
            }

            idlist.sort();

            var
                waiter_id = 'app_load_dicts_' + idlist_s.replace(/,/g, '_') + '_' + current_time,
                waiter_title = 'Загрузка данных ('+idlist_ss+')',
                waiter_timeout = 2000,
                load_queues = {}, // Сюда складываем формируемые очереди (группируем по времени жизни)
                errors = [], // Накапливаем сообщения об ошибках
                waiting_dicts_count = 0, // Общее количество словарей для загрузки
                failed_dicts_count = 0, // Количество незагруженных словарей
                result_dicts = {}, // Набор словарей для возврата в случае удачного выполнения

                // Общая функция завершения, -- если все словари/очереди отработаны
                on_done = function () {
                    // Успешное завершение
                    if ( !errors || !errors.length ) {
                        var all_data = get_all_data();
                        resolve(all_data);
                        typeof on_success === 'function' && on_success(all_data);
                    }
                    // Ошибки
                    else {
                        reject(errors);
                        typeof on_error === 'function' && on_error(errors);
                    }
                },
                // Функции обратного вызова для загрузки словарей.
                // Служат для обслуживания множественных запросов на один и тот же словарь:
                // если словарь уже загружается, то в его очередь колбеков
                // (on_success_stack, on_error_stack) добавляется ещё один вызов.
                //
                on_dict_success = function on_dict_success (dict_id) {
                    --waiting_dicts_count || on_done();
                },
                on_dict_error = function on_dict_error (dict_id, error) {
                    ++failed_dicts_count;
                    var error_text = 'Невозможно загрузить словарь '+dict_id;
                    if ( error ) { error_text += ': '+error; }
                    errors.push(error_text);
                    --waiting_dicts_count || on_done();
                },
                // queues_waiting_count = 0,
                done
            ;

            // Формируем очереди запросов для устаревших или отсутствующих данных
            // в соотв. с типами кеширования
            Array.isArray(idlist)
              && idlist.map(function process_load_dicts (dict_id) {

                var dict_info = params.config.cache._DATA_TYPES[dict_id],
                    on_success_cb,
                    on_error_cb
                ;

                if ( !dict_info ) {
                    var error_text = 'Некорректный идентификатор словаря: '+dict_id;
                    console.warn( 'app:load_dicts:map error', error_text );
                    /*DEBUG*//*jshint -W087*/debugger;
                    typeof on_error === 'function' && on_error(error_text);
                    // load_dicts_waiter.Error(error_text);
                    // return false;
                    return reject(error_text);
                }

                var

                    type = dict_info.type,
                    loaded_dict = params.loaded_dicts[dict_id],

                    lifetime = dict_info.lifetime,

                    // Таймаут в настройках на сервере хранится в секундах - ???
                    // lifetime_timeout = params.config.cache['lifetime_'+lifetime] * 1000,
                    lifetime_timeout = params.config.cache['lifetime_'+lifetime] || 0,

                    undef
                ;

                // Если объекта трассировки словаря нет, то создаём его...
                if ( typeof loaded_dict === 'undefined' ) {
                    loaded_dict = params.loaded_dicts[dict_id] = {
                        // on_success_stack : [],
                        // on_error_stack : [],
                    };
                }
                // ...иначе, если уже загружен, вообще ничего не делаем.
                else if ( loaded_dict.loaded
                  && ( loaded_dict.time && current_time - loaded_dict.time < lifetime_timeout  )
                ) {
                    return;
                }

                // Устанавливаем колбеки для каждого словаря
                if ( !loaded_dict.on_success_stack ) { loaded_dict.on_success_stack = []; }
                if ( !loaded_dict.on_error_stack ) { loaded_dict.on_error_stack = []; }
                typeof on_dict_success === 'function' && loaded_dict.on_success_stack.push(on_dict_success);
                typeof on_dict_error === 'function' && loaded_dict.on_error_stack.push(on_dict_error);

                waiting_dicts_count++;

                // Если уже загружается, то ещё раз не загружаем, ждём чужой загрузки на колбеке
                if ( loaded_dict.loading ) {
                    return;
                }

                // Добавляем в очередь для загрузки
                if ( typeof load_queues[lifetime] === 'undefined' ) { load_queues[lifetime] = []; }
                if ( load_queues[lifetime].indexOf(dict_id) === -1 ) {
                    load_queues[lifetime].push(dict_id);
                    loaded_dict.loading = true;
                }

            });

            // Если нечего загружать
            if ( !waiting_dicts_count ) {
                return on_done();
            }

            var
                on_success_cb,
                on_error_cb
            ;

            // Загружаем очереди
            var promises = [];
            Object.keys(load_queues).map(function(lifetime_id) {
                var queue = load_queues[lifetime_id],
                    queue_s = queue.join(', ');
                var queue_promise = app.load_dicts_queue_request(queue, lifetime_id, null, null, load_waiting_waiter_id);
                promises.push(queue_promise);
                queue_promise
                    .then(function _on_success (data) {

                        // Обнуляем состояния ожидания и сохраняем данные
                        for ( var dict_id in data ) {
                            if ( data.hasOwnProperty(dict_id) ) {
                                var loaded_dict = params.loaded_dicts[dict_id];
                                if ( typeof loaded_dict !== 'undefined' && loaded_dict ) {
                                    params.dicts[dict_id] = data[dict_id] || {};
                                    loaded_dict.time = current_time;
                                    loaded_dict.loaded = true;
                                    delete loaded_dict.loading;
                                    if ( loaded_dict.on_success_stack ) {
                                        while ( on_success_cb = loaded_dict.on_success_stack.shift() ) {
                                            on_success_cb(dict_id);
                                        }
                                    }
                                    delete loaded_dict.on_success_stack;
                                    delete loaded_dict.on_error_stack;
                                }
                            }
                        }

                    })
                    .fail(function _on_error (error) {

                        // Обнуляем состояния ожидания
                        for ( var n=0; n<queue.length; n++ ) {
                            var dict_id = queue[n];
                            var loaded_dict = params.loaded_dicts[dict_id];
                            if ( typeof loaded_dict !== 'undefined' && loaded_dict ) {
                                delete loaded_dict.loading;
                                if ( loaded_dict.on_error_stack ) {
                                    while (  on_error_cb = loaded_dict.on_error_stack.shift() ) {
                                        on_error_cb(dict_id, error);
                                    }
                                }
                                delete loaded_dict.on_success_stack;
                                delete loaded_dict.on_error_stack;
                            }
                        }

                    })
                ;
            });

        });

        return load_dicts_promise;

    },/*}}}*/

    /** get_loaded_assets_list() ** {{{ Список загруженных ранее данных
     * @return {array}
     */
    get_loaded_assets_list : function () {

        return Object.keys(this.params.loaded_assets);

    },/*}}}*/
    /** get_stored_assets_list() ** {{{ Список загруженных и сохранённых данных
     * @return {array}
     */
    get_stored_assets_list : function () {

        return Object.keys(this.params.assets_data);

    },/*}}}*/
    /** get_stored_dicts_list() ** {{{ Список загруженных ранее словарей
     * @return {array}
     */
    get_stored_dicts_list : function () {

        return Object.keys(this.params.dicts);

    },/*}}}*/
    /** get_stored_dict_data() ** {{{ Данные загруженного ранее словаря
     * @param {string} dict_id
     * @return {*}
     */
    get_stored_dict_data : function (dict_id) {

        return this.params.dicts[dict_id];

    },/*}}}*/
    /** get_stored_asset_data() ** {{{ Данные загруженного ранее словаря
     * @param {string} asset_id
     * @return {*}
     */
    get_stored_asset_data : function (asset_id) {

        return this.params.assets_data[asset_id];

    },/*}}}*/

    /** is_asset_loaded() ** {{{ Проверка состояния загруженности элемента ресурсов (данных).
     * @param {String} asset_id Идентификатор ресурса
     * @return {Boolean}
     */
    is_asset_loaded : function (asset_id) {

        var app = this,
            params = this.params;

        return params.loaded_assets[asset_id] && params.loaded_assets[asset_id].loaded || false;

    },/*}}}*/
    /** is_dict_loaded() ** {{{ Проверка состояния згруженности словаря.
     * @param {String} dict_id Идентификатор словаря.
     * @returns {Boolean}
     */
    is_dict_loaded : function (dict_id) {

        var app = this,
            params = this.params;

        return params.loaded_dicts[dict_id] && params.loaded_dicts[dict_id].loaded || false;

    },/*}}}*/

    /** callback_dicts() ** {{{ Колбэк для словарей.
     * @param {String[]|String} idlist - Идентификаторы (идентификатор) необходимых словарей
     * @param {Callback} [on_success] - Колбэк для случая, если словари присутствуют или загружены.
     * @param {Callback} [on_error] - Колбэк для ошибки загрузки.
     * @param {String} [waiter_id] - Идентификатор ожидателя для завершения.
     * @return none
     */
    callback_dicts : function (idlist, on_success, on_error, waiter_id) {

        var app = this;
        var params = this.params;

        // Функция-колбэк успешного завершения (успешная загрузка или данные уже готовы)
        // -- подготавливаем требуемые данные (словари) и вызываем пользовательский колбек (`on_success`), если задан.
        // Если передан идентификатор (`waiter_id`, завершаем ожидатель.
        var apply_promise = function apply_promise () {
            if ( typeof on_success === 'function' ) {
                var all_data = {},
                    apply_data = idlist.map(function idlist_map (dict_id) {
                        if ( typeof params.dicts[dict_id] === 'undefined' ) {
                            params.dicts[dict_id] = {}; // WTF???
                        }
                        all_data[dict_id] = params.dicts[dict_id];
                        return params.dicts[dict_id];
                    });
                apply_data.unshift(all_data);
                on_success.apply(this, apply_data);
            }
            typeof waiter_id !== 'undefined' && waiter.finish(waiter_id);
        };

        if ( typeof idlist === 'string' ) { idlist = [ idlist ]; }

        if ( !Array.isArray(idlist) ) {
            typeof on_error === 'function' && on_error('app.callback_dicts(): Параметр `idlist` должен быть списком.');
            typeof waiter_id !== 'undefined' && waiter.finish(waiter_id);
            return false;
        }

        var not_loaded_count = 0;
        idlist.forEach(function process_load_dicts (dict_id) {
            if ( !app.is_dict_loaded(dict_id) ) {
                not_loaded_count++;
            }
        });

        if ( !not_loaded_count ) {
            apply_promise();
        }
        else {
            app.load_dicts(idlist, function _on_success () {
                apply_promise();
            }, function _on_error (status) {
                typeof on_error === 'function' && on_error(status);
                typeof waiter_id !== 'undefined' && waiter.finish(waiter_id);
            });//, 'app_load_assets_and_dicts');
        }

    },/*}}}*/
    /** resolve_dicts() ** {{{ Получаем данные/словари с проверкой загруженности через промис
     * @param {string[]} dicts_list - Список словарей для загрузки
     * @return {Promise} promise
     */
    resolve_dicts : function (dicts_list) {

        var promise = this.load_dicts(dicts_list);

        return promise;

    },/*}}}*/

    /** load_assets() {{{ Загружаем ресурсы
     *
     * @param {Object[]} assets - Список описаний ресурсов к загрузке.
     * @param {Callback} [on_success] - Обратный вызов в случае успеха.
     * @param {Callback} [on_error] - Обратный вызов в случае ошибки.
     *
     * @returns {waiter/Promise}
     *
     * TODO 2016.10.10, 14:23 -- Возвращать данные в callback/promise?
     *
     */
    load_assets : function (assets, on_success, on_error) {

        var app = this,
            params = this.params;

        if ( typeof assets === 'undefined' || !Array.isArray(assets) || !assets.length ) {
            typeof on_success === 'function' && on_success();
            return vow.Promise.resolve({ status : 'no assets to load' });
        }

        var expected_count = 0,
            assets_to_load = assets,
            errors_count = 0,
            errors = [],
            current_time = Date.now(),
            waiter_id = 'app_load_assets_' + current_time,
            waiter_title = 'Загрузка ресурсов',
            waiter_timeout = 2000,
            load_assets_waiter = waiter.start(waiter_id, { // Запускаем ожидатель
                title : waiter_title,
                timeout : waiter_timeout,
            }),
            on_done = function on_done (asset) {
                // TODO 2016.10.10, 14:27 -- Создавать набор данных для передачи в callback/promise?
                if ( !errors_count ) {
                    typeof on_success === 'function' && on_success();
                    return load_assets_waiter.Done();
                }
                else {
                    typeof on_error === 'function' && on_error(errors);
                    return load_assets_waiter.Error(errors);
                }
                // waiter.finish(waiter_id);
            }
        ;

        // Фильтруем ресурсы (только для запуска в режиме разработки на enb-сервере
        if ( app.getMod('emulate') ) {
            assets_to_load = [];
            assets.forEach(function filter_assets_to_load (asset) {
                // Если эмуляция в bem/enb, то "свои" пакеты не загружаем
                if ( asset.type === 'package' && asset.name === params.emulateId ) {
                    return vow.Promise.resolve({ status : 'skip base page assets in emulate mode' });
                }
                // Иначе добавляем в очередь
                assets_to_load.push(asset);
            });
        }

        // Заранее (!) вычисляем количество ресурсов для загрузки
        expected_count = assets_to_load.length;

        assets_to_load.forEach(function process_load_assets (asset) {

            // Если эмуляция в bem/enb, то "свои" пакеты не загружаем
            if ( app.getMod('emulate') && asset.type === 'package' && asset.name === params.emulateId ) {
                return 'emulate: ignore';
            }

            // Инициируем загрузку ресурса
            app.load_asset(asset,
                function on_asset_success () {

                    --expected_count || on_done(asset);

                },
                function on_asset_error (error) {

                    errors_count++;
                    if ( error ) {
                        var new_errors = Array.isArray(error) ? error : [ error ];
                        new_errors.forEach(function(error) {
                            errors.push(error);
                        });
                    }

                    --expected_count || on_done(asset);

                }
            );
        });

        return load_assets_waiter;

    },/*}}}*/

    /** load_page_assets() {{{ Загружаем все ресурсы для текущей страницы.
     *
     * @param {String} id - Идентификатор страницы
     *
     */
    load_page_assets : function (id) {

        var app = this,
            params = this.params,
            pageData = params.config.appdata.pages[id];

        if ( pageData && pageData.required && Array.isArray(pageData.required.assets) ) {

            return app.load_assets(pageData.required.assets,
                function _on_success() {
                },
                function _on_error (error) {

                    var new_errors = Array.isArray(error) ? error : [ error ];
                    new_errors.forEach(function(error) {
                        app.load_errors.push(error);
                        app.error(error);
                    });

                }
            );

        }

        return null;

    },/*}}}*/

    /** callback_assets() ** {{{ Загружаем ресурсов с обратными вызовами.
     * @param {Object[]} assets_list - Список объектов описателей запросов для загрузки.
     * @param {Callback} on_success - Колбэк для случая, если данные присутствуют или загружены.
     * @param {Callback} on_error - Колбек для ошибки загрузки.
     */
    callback_assets : function (assets_list, on_success, on_error) {

        var app = this;
        var params = this.params;

        if ( !Array.isArray(assets_list) ) {
            if ( typeof assets_list === 'undefined' ) {
                assets_list = [];
            }
            else {
                assets_list = [ assets_list ];
            }
            // typeof on_error === 'function' && on_error('app.callback_assets(): Параметр `assets_list` должен быть определён.');
            // return false;
        }

        // // TODO 2016.08.17, 13:36 -- ??? Проверять таймаут?
        // var not_loaded_count = 0;
        // assets_list.forEach(function process_load_data (asset) {
        //     var id = asset.id || 'data:' + asset.url;
        //     if ( !app.is_asset_loaded(id) ) {
        //         not_loaded_count++;
        //     }
        // });

        var apply_success_data = function apply_success_data () {
            if ( typeof on_success === 'function' ) {
                var all_data = {},
                    apply_data = assets_list.map(function assets_list_map (asset) {
                        var id = asset.id || 'data:' + asset.url;
                        if ( typeof params.assets_data[id] === 'undefined' ) {
                            params.assets_data[id] = {}; // WTF???
                        }
                        all_data[id] = params.assets_data[id];
                        return params.assets_data[id];
                    });
                apply_data.unshift(all_data);
                on_success.apply(this, apply_data);
            }
        };

        // if ( !not_loaded_count ) {
        //     apply_success_data();
        // }
        // else {
            app.load_assets(assets_list, function load_assets_apply_promise () {
                apply_success_data();
            }, on_error);
        // }

    },/*}}}*/
    /** resolve_assets() ** {{{ Загружаем ресурсы с отработкой через Promise
     *
     * @param {Object[]} assets_list            - Список объектов описателей запросов для загрузки.
     *
     * Пример описания одного ресурса:
     *
     * ```
     * {
     *   id : 'data:test_data',
     *   url : '{{approot}}core/js/otchet/test_data.json',
     *   method : 'GET',
     *   expires : app.config.cache.lifetime_long,
     * }
     * ```
     * @param {string}   assets_list[].id       - Идентификатор ресурса. По этому ключу элемент данных можно найти в общем хранилище, если ресурс сохраняемый (данные).
     * @param {string}   assets_list[].url      - Адрес ресурса.
     * @param {string}   assets_list[].method   - HTTP-метод запроса (GET, POST).
     * @param {number}   assets_list[].expires  - Таймаут времени актуальности ресурса (времени жизни), мс. См. предопределённые значения в {@link project__config} (`app.config.cache.lifetime_*`).
     *
     * @return {Promise} promise
     */
    resolve_assets : function (assets_list) {

        var app = this,
            params = this.params,

            promise = new vow.Promise(function (resolve, reject) {

                app.callback_assets(assets_list,
                    function _on_success (data) {
                        resolve(data);
                    },
                    function _on_error (error) {
                        reject(error);
                    }
                );

            })
        ;

        return promise;

    },/*}}}*/

    /** load_page_dicts() {{{ Загружаем все ресурсы для текущей страницы.
     *
     * @param {String} id - Идентификатор страницы
     *
     * @returns {Promise|null}
     *
     */
    load_page_dicts : function (id) {

        var app = this,
            params = this.params,
            pageData = params.config.appdata.pages[id];

        if ( pageData && pageData.required && Array.isArray(pageData.required.dicts) ) {
            return app.load_dicts(pageData.required.dicts, function success () {
                // done
              }, function error (error) {
                app.load_errors.push(error);
                app.error(error);
              },
              'app_load_assets_and_dicts'
            );
        }

        return null;

    },/*}}}*/

    /** release_resources() ** {{{ Освобождаем ресурсы
     *
     * @param {String[]} list - Список идентификаторов вида: `{data:<data_id>|dict:<dict_id>|<dict_id>}`.
     */
    release_resources : function (list) {

        var app = this;
        var params = this.params;

        Array.isArray(list) && list.forEach(function release_resource_item (id) {
            // Если `data:*`, удаляем ресурс...
            if ( id.startsWith('data:') ) {
                if ( params.loaded_assets[id] && params.loaded_assets[id].loaded ) {
                    delete params.assets_data[id];
                    // delete params.loaded_assets[id];
                    params.loaded_assets[id].loaded = false;
                }
            }
            // Если явное указание `dict:*` ...
            if ( id.startsWith('dict:') ) {
                id = id.substr('dict:'.length);
            }
            // ...Или идентификатор, то удаляем словарь...
            if ( id.match(/^\w+$/) ) {
                if ( params.loaded_dicts[id] && params.loaded_dicts[id].loaded ) {
                    delete params.dicts[id];
                    // delete params.loaded_dicts[id];
                    params.loaded_dicts[id].loaded = false;
                }
            }
        });

    },/*}}}*/

    /** _closePage() ** {{{ Сбрасываем текущую страницу.
     * @param {boolean} [clearEmulate=false] - Очищать статус эмулирования bemhtml контента (для enb)
     * @returns {Promise}
     * Сбрасываем все (возможные?) данные (?), вызываем обработчики на закрытие.
     */
    _closePage : function (clearEmulate)
    {

        var app = this,
            params = this.params,

            pageId = params.pageId,

            undef
        ;

        // Очищаем статус эмулирования bemhtml контента (для enb)
        if ( clearEmulate && app.getMod('emulate') ) {
            app.delMod('emulate');
        }

        // Если нет открытой страницы
        if ( pageId ) {

            if ( typeof app.on_page_close_callbacks !== 'undefined'
              && Array.isArray(app.on_page_close_callbacks)
              && app.on_page_close_callbacks.length ) {
                // TODO 2017.03.16, 21:40 -- Накапливать Promises?
                var callback;
                while ( callback = app.on_page_close_callbacks.shift() ) {
                    callback();
                }
            }

            // Удаляем зарегистрированные поллеры на закрытие страницы
            app.before_page_close_pollers = [];

            // Удаляем зарегистрированные каналы событий
            for ( var channel_id in this.registered_channel_events ) {
                if ( this.registered_channel_events.hasOwnProperty(channel_id) ) {
                    var event_id;
                    while ( event_id = this.registered_channel_events[channel_id].shift() ) {
                        channels(channel_id).un(event_id);//, callback);
                    }
                    delete this.registered_channel_events[channel_id];
                }
            }

            delete params.pageId;
            delete params.pageData;
            app.delMod('pageId');

            return vow.Promise.resolve({ status : 'pageClosed', pageId : pageId, description : 'Страница закрыта' });

        }

        // TODO: Создавать событие?

            return vow.Promise.resolve({ status : 'noPageToClose', description : 'Нет открытой страницы' });

    },/*}}}*/
    /** _clearPageContainer() ** {{{ Очищаем контент старой страницы. Технические синхронные процедуры.
     * Вызывается после {@link #_closePage} (?) pageId не проверяем.
     *
     */
    _clearPageContainer : function () {

        var app = this;

        // Если не эмулируем создание bemhtml контента в enb
        if ( !app.getMod('emulate') ) {

            // Удаляем "висячие" объекты в корне (выбор дат)

            // См.
            // WEB_TINTS/source/blocks/libs/datetimepicker/datetimepicker.js
            $('.xdsoft_datetimepicker_control').map(function(n,item){
                $(item).datetimepicker('destroy');
            });
            // $('body > .xdsoft_datetimepicker').remove();

            var container = $('.app > .app__container');
            if ( container && container.length ) {
                BEMDOM.destruct(container, true);
            }

        }

        return vow.Promise.resolve({ status : 'containerCleared', description : 'Контейнер очищен' });

    },/*}}}*/

    /** registerPageReadyAction() ** {{{ Зарегистрировать действие на открытие страницы.
     * @param {Callback} callback - Обратный вызов функции на открытие страницы.
     * TODO: Failback на случай, если метод вызывается после того, как страница уже была готова?
     */
    registerPageReadyAction : function (callback) {

        var app = this;

        app.register_channel_event('app', 'pageReady', callback, true); // once-event

    },/*}}}*/
    /** register_close_action() ** {{{ Зарегистрировать действие на закрытие страницы.
     *
     * @param {Callback} callback - Обратный вызов функции на закрытие.
     *
     */
    register_close_action : function (callback) {

        var app = this,
            params = this.params;

        app.on_page_close_callbacks.push(callback);

    },/*}}}*/

    /** poll_before_close() ** {{{ Зарегистрировать хэндлер на опрос перед закрытием страницы.
     *
     * @param {Callback} close_promise - Промис закрытия.
     *
     */
    poll_before_close : function (close_promise) {

        var app = this,
            params = this.params;

        if ( !this.before_page_close_pollers || !this.before_page_close_pollers.length ) {
            return close_promise.resolve('no close pollers');
        }

        var defers_list = [];

        this.before_page_close_pollers.forEach(function(poll_callback, n) {
            if ( typeof poll_callback !== 'function' ) { return; }
            var defer = vow.defer();
            defers_list.push(defer.promise());
            poll_callback(defer);
        });

        vow.all(defers_list)
            .then(function () {
                close_promise.resolve('all pollers allow close');
            })
            .fail(function (reason) {
                close_promise.reject(reason);
            })
        ;

        /*
        for ( var i in app.before_page_close_pollers ) {
            var poll_callback = app.before_page_close_pollers[i];
            // Не функция? WTF?
            if ( typeof poll_callback !== 'function' ) {
                poll_callback_done();
                continue;
            }
            poll_callback(poll_callback_done, poll_callback_cancel);
        }
        */

    },/*}}}*/
    /** register_close_poller() ** {{{ Зарегистрировать хэндлер на опрос перед закрытием страницы.
     *
     * @param {Callback} callback - Колбек поллера (параметром передаётся два колбека: (1) разрешение на закрытие, (2) запрет).
     *
     */
    register_close_poller : function (poll_callback) {

        var app = this,
            params = this.params;

        app.before_page_close_pollers.push(poll_callback);

    },/*}}}*/

    /** screenholderAnimationDone() ** {{{ Промис на завершение анимации заставки экрана
     * @returns {Promise}
     */
    screenholderAnimationDone : function () {

        var app = this,
            that = this,
            params = this.params,
            undef
        ;

        if ( app.screenholder.status === 'show:animation' ) {
            var promise = new vow.Promise(function(resolve,reject){
                app.screenholder.registerShowCallback(function(){
                    return resolve({ status : 'animation done' });
                });
            });
            return promise;
        }
        else {
            return vow.Promise.resolve({ status : 'no animation' });
        }

    },/*}}}*/

    /** _openPageStart() ** {{{ Подготовка открытия страницы (Шаг 0, sync)
     *
     * @param {string} id - Идентификатор страницы
     * @returns {boolean}
     *
     * Проверка на возможность открытия страницы.
     * (Только в sync режиме! Все async действия -- в `openPage()`).
     *
     * Проверяет и изменяет свойства `params`:
     * - params.openingPage
     * - params.openingPageId
     * - params.queuedPageId
     *
     * Устанавливает заставку в режим ожидания.
     *
     * Если открытие страницы невозможно, возвращает false
     *
     * TODO 2017.04.07, 15:59 -- Возвращать Promise?
     *
     */
    _openPageStart : function (id) {

        var app = this,
            that = this,
            params = this.params,
            undef
        ;

        // Проверка: если страница открывается в данный момент...
        if ( params.openingPage ) {
            // Если открывается не та же страница, то запоминаем id
            if ( params.openingPageId !== id ) {
                params.queuedPageId = id;
            }
            return false;
        }

        // Иначе устанавливаем флаг "страница загружается".
        params.openingPage = true;
        // И сбрасываем "следующую" страницу.
        delete params.queuedPageId;

        // window.location.hash = '';
        // app._clearLocationHash();

        // Проверка на непустой идентификатор страницы
        if ( !id ) {
            app.openPageError('Ошибка подготовки открытия экрана - не задан идентификатор страницы');
            return false;
        }
        // Проверка на наличие страницы
        if ( ( params.config && params.config.appdatat && !params.config.appdata.pages[id] ) && !this._isSpecialPageId(id) ) {
            app.openPageError('Ошибка подготовки открытия экрана (<u>'+id+'</u>) - описание страницы не найдено');
            return false;
        }

        // Сохраняем ID открываемой страницы (позже станет `pageId`).
        params.openingPageId = id;

        // Устанавливаем режим ожидания.
        app.screenholder.waiting(); // XXX 2017.04.07, 15:50 -- Ср. appholder?

        // Подтверждаем возможность открытия страницы.
        return true;

    },/*}}}*/

    /** _openPageLoadResources(id) ** {{{ Загружаем ресурсы из зависимостей страницы (Шаг 1, async)
     * @param {string} id - Идентификатор страницы
     * @returns {Promise}
     */
    _openPageLoadResources : function (id) {

        var app = this,
            that = this,
            params = this.params,

            promises_list = [
                app.load_page_assets(id),
                app.load_page_dicts(id),
            ],

            promise = vow.all(promises_list),

            undef
        ;

        promise
            .fail(function(error){
                console.error(error);
                /*DEBUG*//*jshint -W087*/debugger;
            })
        ;

        return promise;

    },/*}}}*/
    /** _openPagePrepare(id) ** {{{ Подготавливаем окружение для загрузки страницы. (Шаг 2, async)
     *
     * Вызывается из `_openPageRender`
     *
     * @param {String} id Идентификатор страницы
     *
     */
    _openPagePrepare : function (id)
    {

        var app = this,
            that = this,
            params = this.params,

            undef
        ;

        var promise = new vow.Promise(function(resolve,reject){

            var errorText;

            if ( !params.config || !params.config.appdata || !params.config.appdata.pages ) {
                errorText = 'Не задана конфигурация страниц (config.appdata.pages)';
            }
            else if ( !params.config.appdata.pages[id] ) {
                errorText = 'Не найдено описание страницы <u>'+id+'</u>';
            }

            if ( errorText ) {
                console.error( '_openPagePrepare error', errorText );
                /*DEBUG*//*jshint -W087*/debugger;
                return reject({ error : errorText });
            }

            var pageData = params.config.appdata.pages[id];

            // // Очищаем контейнер страницы
            // app._clearPageContainer();

            // Устанавливаем параметры страницы
            params.pageId = id;
            params.pageData = pageData;
            store.set('appPageId', id);
            // app.setMod('pageId', app.params.pageId);
            app.domElem.attr('id', app.params.pageId);

            // Если указано, устанавливаем дополнительный waiter для отработки в самой странице
            if ( params.pageData.setPageReadyWaiter ) {
                waiter.start('pageReady', {
                    title : 'Готовность страницы',
                    timeout : app.params.asset_load_timeout,
                    timeout_break : true,
                    on_timeout : function () {
                        // app.screenholder.error('Отсутствие кода завершения инициализации экрана.');
                        // waiter.finish('pageReady');
                        app.error('Отсутствие подтверждения готовности экрана ('+id+').');
                    },
                    on_finish : function () {
                        app.screenholder.ready();
                    },
                });
            }

            resolve( { status : 'pagePrepared', pageId : id, description : 'Подготовлено открытие страницы' });

        });

        return promise;

    },/*}}}*/
    /** _openPageRender(id) ** {{{ Отображаем страницу не экране (Шаг 3, async)
     * @param {string} id - Идентификатор страницы
     * @returns {Promise}
     */
    _openPageRender : function (id) {

        var app = this,
            that = this,
            params = this.params,

            pageData = params.config.appdata.pages[id],

            undef
        ;

        var promise = new vow.Promise(function(resolve,reject){

            // Дёргаем инициализатор -- для свежеподгруженных модулей с классами блоков
            modules.require([
                'i-bem-dom__init',
            ], function _render_require_ () {

                var asset_id, html, error_text, container, dom;

                // {{{ Вариант 0: Эмуляция (enb-сервер) -- ничего не делаем (контент уже готов)...
                if ( app.getMod('emulate') ) {
                    // app.init_page();
                    return resolve({ status : 'pageRenderEmulate', pageId : id, description : 'Страница не отрисовывалась - режим эмуляции' });
                }// }}}
                // {{{ Вариант 1: Выводим статический контент...
                else if ( typeof pageData.open.html !== 'undefined' ) {
                                        // ??? === 'html' || pageData.open.method === 'html_asset' )

                    html = pageData.open.html;

                    if ( typeof html === 'string' && html.startsWith('data:') ) {
                        asset_id = html;
                        html = params.assets_data[asset_id];
                        if ( !html ) {
                            error_text = 'Ошибка открытия экрана <u>'+id+'</u>: Не найден элемент данных "<u>'+asset_id+'</u>" (статика)';
                            console.error( error_text, app );
                            app.load_errors.push(error_text);
                            return reject({ error : error_text });
                        }
                    }
                    else if ( typeof html === 'object' && Array.isArray(html) ) {
                        html = html.join('\n');
                    }
                    if ( !html ) {
                        error_text = 'Ошибка открытия экрана <u>'+id+'</u>: не верно задан шаблон содержимого "<u>'+id+'</u>" (статика)';
                        console.error( error_text, app );
                        app.load_errors.push(error_text);
                        return reject({ error : error_text });
                    }
                    else {
                        container = $('.app > .app__container');
                        dom = BEMDOM.update(container, html);
                        // Инициализируем параметры для созданной страницы (???)
                        return resolve({ status : 'pageRenderedFromStatic', pageId : id, description : 'Страница отрисована из статики' });
                    }

                }// }}}
                // {{{ Вариант 2: Разворачиваем из шаблона...
                else if ( typeof pageData.open.bemhtml !== 'undefined' ) {
                                // ??? ... pageData.open.method === 'bemhtml' || pageData.open.method === 'bemhtml_asset' )

                    var bemhtml = pageData.open.bemhtml;
                    if ( typeof bemhtml === 'string' && bemhtml.startsWith('data:') ) {
                        asset_id = bemhtml;
                        bemhtml = params.assets_data[bemhtml];
                        if ( !bemhtml ) {
                            error_text = 'Ошибка открытия экрана <u>'+id+'</u>: Не найден элемент данных "<u>'+asset_id+'</u>" (шаблон)';
                            app.load_errors.push(error_text);
                            return reject({ error : error_text });
                        }
                    }
                    if ( !bemhtml ) {
                        error_text = 'Ошибка открытия экрана <u>'+id+'</u>: Не верно задан шаблон содержимого "<u>'+asset_id+'</u>" (шаблон)';
                        app.load_errors.push(error_text);
                        return reject({ error : error_text });
                    }
                    else {
                        // Если эмулируем (в enb), то шаблон не загружаем
                        if ( !app.getMod('emulate') ) {
                            // Разворачиваем шаблон
                            html = BEMHTML.apply(bemhtml);
                            container = $('.app > .app__container');
                            dom = BEMDOM.update(container, html);
                        }
                        // Инициализируем параметры для созданной страницы (???)
                        return resolve({ status : 'pageRenderedFromTemplate', pageId : id, description : 'Страница отрисована из шаблона' });
                    }

                }// }}}

                // Вариант X: Ошибка...
                return reject({ error : 'Ошибка открытия экрана <u>'+id+'</u> - не задан шаблон содержимого' });

            });

        });

        return promise;

    },/*}}}*/
    /** _openPageInit(id) ** {{{ Инициализируем новую страницу (Шаг 4, async)
     * @param {string} id - Идентификатор страницы
     * return {Promise}
     */
    _openPageInit : function (id) {

        var app = this,
            that = this,
            params = this.params,

            pageData = params.config.appdata.pages[id],

            undef
        ;

        var promise = new vow.Promise(function(resolve,reject){

            try {

                // Если указано, освобождаем ресурсы после загрузки...
                if ( pageData.release_on_init ) {
                    app.release_resources(pageData.release_on_init);
                }

                document.title = pageData.title || id;
                if ( ( project.config.LOCAL_DEV || project.config.LOCAL_ENB ) && pageData.title) {
                    document.title = '#'+id+' - '+pageData.title;
                }

                channels('app').emit('pageReady', { pageId : id });

                return resolve({ status : '_openPageInit ok', pageId : id });

            }
            catch (error) {
                console.error('_openPageInit error', error);
                /*DEBUG*//*jshint -W087*/debugger;
                return reject('Ошибка инициализации страницы ('+id+') - Ошибка кода выполнения: '+error);
            }

        });

        return promise;

    },/*}}}*/

    /** _openPageDone() ** {{{ Успешное завершение открытия страницы (sync)
     *
     */
    _openPageDone : function () {

        var app = this,
            that = this,
            params = this.params,
            undef
        ;

        try {

            if ( !params.pageData ) {
                return vow.Promise.reject({ error : 'Не определен набор данных описания страницы (pageData) для '+params.openingPageId });
            }

            // Если ещё ждём, то снимаем ожидатель открытия страницы
            if ( waiter.is_waiting('open_page_'+params.openingPageId) ) {
                waiter.finish('open_page_'+params.openingPageId);
            }

            // Снимаем заставку
            if ( !params.pageData.setPageReadyWaiter ) {
                app.screenholder.ready();
            }

            // Снимаем флаг и идентификатор открытия страницы
            delete params.openingPageId;
            delete params.openingPage;

            // this.setMod('pageId', app.params.pageId);

            // params.queuedPageId // ??? Циклический (повторный?) запуск открытия страницы, если установлена следующая страниа на открытие?

        }
        catch (error) {
            console.error(error);
            /*DEBUG*//*jshint -W087*/debugger;
        }

        return { status : '_openPageDone ok' };

    },/*}}}*/
    /** openPageError() ** {{{ Аварийное Завершение открытия страницы (sync)
     * @param {string|array} error - Сообщение об ошибке (массив сообщений)
     */
    openPageError : function (error) {

        var app = this,
            that = this,
            params = this.params,
            undef
        ;

        // Если ещё ждём, то снимаем ожидатель открытия страницы (с ошибкой)
        if ( waiter.is_waiting('open_page_'+params.openingPageId) ) {
            waiter.finish('open_page_'+params.openingPageId, error);
        }

        // // Устанавливаем ошибку (делается на финальном отлове reject)
        // app.error(error);

        // Снимаем флаг и идентификатор открытия страницы
        delete params.openingPageId;
        delete params.openingPage;

        // params.queuedPageId // ???

    },/*}}}*/

    /** _doOpenPage() ** {{{ Открываем страницу (версия II, Promises)
     * @param {string} id - Идентификатор страницы
     * @returns {Promise}
     *
     * Вызывается из `openPage`
     *
     */
    _doOpenPage : function (id) {

        // ПРОВЕРКА: Если страницу невозможно сейчас открыть...
        if ( !this._openPageStart(id) ) {
            // Возвращаем null (на случай Promise.cast etc)
            return null; // ??? Promise?
        }

        if ( this._isSpecialPageId(id) ) {
            this.showSpecialPage(id);
            return { status : 'showSpecialPage', description : 'Показана спецстраница '+id  };
        }

        var app = this,
            that = this,
            params = this.params,

            waiter_timeout = 30000,

            open_page_waiter = waiter.start('open_page_'+id, {
                title : 'Открытие страницы '+id,
                waiter_timeout : waiter_timeout,
            }),

            undef
        ;

        var promise = app._closePage()
            .then(function(data){

                // Очищаем контейнер
                return app._clearPageContainer();

            })
            // Загружаем ресурсы и ждём завершения анимации заставки...
            .then(function(data){

                return vow.all([
                    app._openPageLoadResources(id),
                    app.screenholderAnimationDone(), // ??? Возможно, надо предусматривать ожидание appholder?
                ]);
            })
            // Подготавливаем страницу...
            .spread(function(loadResult,animationResult){

                return app._openPagePrepare(id);
            })
            // Отрисовываем...
            .then(function(data){

                return app._openPageRender(id);
            })
            // Инициализируем...
            .then(function(data){

                return app._openPageInit(id);
            })
            // Завершаем...
            .then(function(data){
                return app._openPageDone(id);
            })
            .fail(function(data){
                console.error( '_doOpenPage fail', promise, data );
                /*DEBUG*//*jshint -W087*/debugger;
                app.openPageError(data);
                return vow.Promise.reject(data);
            })
        ;

        return promise;
        // return open_page_waiter;

    },/*}}}*/

    /** ask_allow_cancel_waiter() ** {{{ Запрос на прерывание текущей операции
     * @param {Object} promise
     */
    ask_allow_cancel_waiter : function (promise) {

        if ( !waiter.is_waiting() ) {
            return promise.resolve('no waiters to cancel');
        }

        popup_controller.msgbox({
            options :  {
                title : 'Прервать ожидание?',
                buttons: [ 'yes', 'no' ], // По умолчанию всегда показывается кнопка "Ok"
            },
            content : '<p>Система находится в состоянии ожидания выполнения.'
            +'<p>Хотите прервать ожидание?',
            callback : function (id, self) {
                if ( id === 'yes' ) {
                    waiter.reset(); // TODO 2016.09.16, 16:47 -- Check to clean progressbar items in waiter
                    promise.resolve('waiters cancelled');
                }
                else {
                    promise.reject('waiters canceling declined');
                }
            },
        });

    },/*}}}*/

    /** openPage(...) ** {{{ Пробуем открыть другую страницу.
     *
     * TODO: Отслеживать операции со страницей (открытие и т.д.)?
     *
     * @param {String} pageId Идентификатор страницы
     *
     */
    openPage : function (pageId) {

        var app = this,
            params = this.params
        ;

        // Если какая-то страница загружается. XXX Нужно ли?
        if ( app.params.loadingPageFlag ) { return false; }

        // Обрабатываем идентификатор
        pageId = this._prepareTargetPageId(pageId);

        // Текст ошибки
        var errorText = '';

        // Если не задан идентификатор...
        if ( !pageId ) {
            errorText = 'Не задан идентификатор страницы';
        }
        // Или если некорректный идентификатор...
        else if ( !pageId.match(/^\w+$/) ) {
            errorText = 'Некорректный идентификатор страницы: '+pageId;
        }

        // Проверяем и возвращаем ошибку
        if ( errorText ) {
            console.error( '_afterInit error', errorText );
            /*DEBUG*//*jshint -W087*/debugger;
            return vow.Promise.reject({ error : errorText });
        }

        // Снимаем эмуляцию для enb (см. System.app), если указана страница, отличная от эмулированной
        if ( app.getMod('emulate') && app.params.emulateId !== pageId ) {
            app.delMod('emulate');
            delete app.params.emulateId;
        }

        // Если есть активная страница, то спрашиваем, можно ли её закрывать,
        // если да, то сбрасываем её и пробуем открыть новую.
        var promise;
        if ( app.params.pageId ) {
            // try promises here -- 2016.09.16, 15:52
            var cancel_waiting = vow.defer();
            var can_close = vow.defer();

            app.ask_allow_cancel_waiter(cancel_waiting);
            app.poll_before_close(can_close);

            promise = vow.all([
                    cancel_waiting.promise(),
                    can_close.promise(),
                ])
                .then(function (reason) {
                    return app._doOpenPage(pageId);
                })
                // .fail(function (reason) {
                // })
            ;

        }
        // Если страниц нет,
        else {
            // ...просто пробуем открыть новую страницу.
            promise = app._doOpenPage(pageId);
        }

        return promise;

    },/*}}}*/

    /** changeAuthType ** {{{ Сменить тип авторизации
     */
    changeAuthType : function () {

        try {

            var app = this,

                appholder = this._appholder,

                ajaxUrl = project.config.app_params_url,

                title = 'Смена типа авторизации...',

                authTypeChangeRequestParams = {
                    id : 'authTypeChange',
                    title : title,
                    method : 'GET',
                },

                authTypeChangeWaiter = null,

                undef
            ;

            appholder.loaderStatusSet(title);

            var promise =
                // Показываем заставку приложения
                appholder.showScreenLoader()
                // Сбрасываем состояние приложения
                .then(function(data){
                    authTypeChangeWaiter = waiter.start('authTypeChangeWaiter', {
                        title : title,
                        timeout: 30000,
                    });
                    return app._resetApp();
                })
                // Запрашиваем смену авторизации через secureAjax
                .then(function (data) {
                    return requestor.promiseRequest(authTypeChangeRequestParams);
                })
                .then(function (data) {
                    if ( authTypeChangeWaiter && !authTypeChangeWaiter.isFinished() ) {
                        authTypeChangeWaiter.Done(data);
                    }
                    return app._initApp();
                })
                // Окончание действий
                .then(function (data) {
                    appholder.loaderStatusRemove(title);
                    authTypeChangeWaiter && authTypeChangeWaiter.Done(data);
                })
                // Ошибка
                .fail(function (data) {
                    console.error( 'changeAuthType fail', data );
                    /*DEBUG*//*jshint -W087*/debugger;
                    appholder.loaderStatusRemove(title);
                    authTypeChangeWaiter && authTypeChangeWaiter.Error(data);
                    app.error(data);
                })
            ;

            return authTypeChangeWaiter;

        }
        catch (data) {
            console.error(data);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _initDom() ** {{{ Разворачиваем внутреннюю структуру контейнера и окружение.
     *
     * Инициализируем вложенные и внешние сущности, необходимые для работы SPA/APP.
     *
     */
    _initDom : function () {

        var app = this,
            params = this.params,

            // Внешний DOM-элемент
            outerVlayout = this._vlayout = this.findParentBlock(BEMDOM.entity('vlayout')),

            undef
        ;

        // Создаём свой контейнер, если отсутствует
        if ( !this._elem('container') ) {
            var elemsBemhtml = [
                { block : 'app', elem : 'container' },
                { block : 'screenholder' },
            ];
            var elemsHtml = BEMHTML.apply(elemsBemhtml);
            var elemsDom = BEMDOM.append(this.domElem, elemsHtml);
        }

        // Если progressbar отсутствует на странице, добавляем его перед нашим блоком
        // Внимание на первый progressbar в appholder!
        var progressbarMain = outerVlayout.findChildBlock({ block : BEMDOM.entity('progressbar'), modName : 'main', modVal : true });
        if ( !progressbarMain ) {
            var progressbarBemhtml = [
                { block : 'progressbar', mods : { main : true }, cls : 'vlayout__item_fixed'/* , mods : { hidden : true } */ },
            ];
            var progressbarHtml = BEMHTML.apply(progressbarBemhtml);
            progressbarMain = $(this.domElem).before(progressbarHtml);
        }
        this._progressbarMain = progressbarMain;

        // Находим заставку экрана...
        //
        // app.screenholder = app.findChildBlock(screenholder);
        // workaround: findChildBlock находит первый screenholder,
        // который может быть внутри контайнера,
        // если эмулируем и контент уже загружен
        //
        var screenholder_dom = $(app.domElem).children('.screenholder');
        app.screenholder = $(screenholder_dom).bem(BEMDOM.entity('screenholder'));

    },/*}}}*/

    /** _initDomEvents ** {{{ События DOM.
     *
     */
    _initDomEvents : function () {

        var app = this,
            params = this.params
        ;

        // Перехватываем изменение хеша в адресе страницы
        $(window).on('hashchange', function(e) {
            if ( app.params.loadingPageFlag ) { return false; } // TODO 2017.03.22, 16:20 -- Сохранять, открвать позже?
            var pageId = app._getPageIdToOpen();
            app.delMod('emulate');
            app.openPage(pageId);
        });

    },/*}}}*/

    /** _acceptAppParams() ** {{{ Получаем и обрабатываем данные конфигурации
     * @param {object} data - Данные конфигурации
     */
    _acceptAppParams : function (data, textStatus, jqXHR) {

        var app = this,
            params = this.params
        ;

        return new vow.Promise(function (resolve, reject) {

            // Проверка валидности данных
            if ( !data || typeof data !== 'object' || typeof data.config !== 'object' ) {
                var error = 'Получены некорректные данные (app._acceptAppParams)';
                console.error(error, data);
                error = [ error, data ];
                /*DEBUG*//*jshint -W087*/debugger;
                return reject(error);
            }

            var id;

            // Преобразуем значения задержек из php-представления (секунды) в js (милисекунды)
            if ( data && data.config && data.config.cache ) {
                for ( id in data.config.cache ) {
                    if ( data.config.cache.hasOwnProperty(id) ) {
                        id.startsWith('lifetime_') && ( data.config.cache[id] *= 1000 );
                    }
                }
            }
            if ( data && data.config && data.config.token ) {
                for ( id in data.config.token ) {
                    if ( data.config.token.hasOwnProperty(id) ) {
                        id.endsWith('_time') && ( data.config.token[id] *= 1000 );
                    }
                }
            }

            // Перестраховка на случай реинициализации (удаляем старую конфигурацию)
            params.config = {};
            params.user = {};
            // Сохраняем полученные данные
            $.extend(true, params, data);

            app.config = params.config;

            return resolve(data);

        });

    },/*}}}*/
    /** _loadAppParams() ** {{{ Загружаем конфигурационные данные
     */
    _loadAppParams : function () {

        try {

            var app = this,
                that = this,
                params = this.params,

                opId = 'app_params',

                ajaxUrl = project.config.app_params_url,

                title = 'Загрузка данных приложения...',

                loaderStatus = this._appholder && this._appholder.loaderStatusSet(title),

                undef
            ;

            var requestParams = {
                id : opId,
                title : title,
                method : 'GET',
                url : ajaxUrl,
            };

            var appParamsPromise;
            // DEBUG! (Отладочное) Выбор загрузчика -- старый или новый в зависимости от параметра конфигурации.
            if ( project.config.useAppholder && this._appholder ) {
                appParamsPromise = requestor.promiseRequest(requestParams);
            }
            else {
                appParamsPromise = request_controller.do_waiter_request(requestParams);
            }

            return appParamsPromise
                .then(function (data) {
                    that._appholder && that._appholder.loaderStatusRemove(title);
                    return that._acceptAppParams(data);
                })
            ;
        }
        catch (data) {
            console.error(data);
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /** _initDefaultParams() ** {{{ Инициализируем параметры по умолчанию
     * ??? См. _getDefaultParams
     */
    _initDefaultParams : function ()
    {

        var app = this,
            params = this.params
        ;

        Object.assign(params, defaultParams);

        // // Параметры по умолчанию, если не передано в dom-элементе
        // for ( var param_id in defaultParams ) {
        //     if ( typeof params[param_id] === 'undefined' ) {
        //         params[param_id] = defaultParams[param_id];
        //     }
        // }

    },/*}}}*/

    /** _afterInit() ** {{{ Действия после инициализации (открытие первой страницы)
     * @param {boolean} [dontForceHash=false] - Не использовать принудительно идентификатор страницы, переданный в url (#hash)
     * @returns {Promise} - (из openPage)
     */
    _afterInit : function (dontForceHash) {

        var app = this,
            params = this.params,
            appdata = app.config.appdata,
            undef
        ;


        return vow.all([

                // Запускаем обновление сессии
                app._startRenewSession(),

                // Запускаем сокеты. TODO: Проверять статус выполнения (Promise)?
                app._startSocket(),

            ])
            .spread(function(sessionResult, socketResult){

                // ??? TODO: Отлавливать некоторые типы ошибок (авторизация?)
                if ( socketResult && socketResult.error ) {
                    console.warn( '_afterInit:_startSocket error (socketResult):', socketResult );
                    /*DEBUG*//*jshint -W087*/debugger;
                }

                // Запомненная страница или страница по умолчанию
                var pageId = params.emulateId || store.get('appPageId') || appdata.defaultPage;

                // Если не указан флаг запрета приоритета
                // или не найдена страница по умолчанию или сохранённая...
                if ( ( !pageId || !dontForceHash ) && window.location ) {
                    pageId = app._getPageIdToOpen(pageId);
                }

                // Открываем страницу, возвращаем Promise
                return app.openPage(pageId);

            })
        ;

    },/*}}}*/

    /** getAppholder ** {{{ Получить объект `appholder` (???)
     */
    getAppholder : function () {

        return project.config.useAppholder ? this._appholder : null;

    },/*}}}*/

    /** _clearAppData ** {{{ Очищаем все загруженные данные приложения
     * TODO: Очищать в той же переменной, без замены (все сохранённые ссылки будут тоже "очищены"?)
     */
    _clearAppData : function () {

        this.params.loaded_dicts = {};

        this.params.loaded_assets = {};

        this.params.dicts = {};

        this.params.assets_data = {};

        // config?

    },/*}}}*/

    /** _resetApp ** {{{ Сбрасываем состояние приложения (полная очистка)
     * @returns {Promise}
     */
    _resetApp : function () {

        var app = this,
            undef
        ;

        // Закрываем страницу (и снимаем флаг эмуляции)
        return app._closePage(true)
            .then(function(){

                // Снимаем флаг эмуляции bemhtml контента
                app.delMod('emulate');
                delete app.params.emulateId;

                // Очищаем контейнер
                app._clearPageContainer();

                // Останавливаем повторяющийся вызов обновления сессии
                app._stopRenewSession();

                // Останавливаем сокеты
                app._stopSocket();

                // Очищаем все загруженные данные
                app._clearAppData();

                return { status : 'app state reseted' };

            })
        ;

    },/*}}}*/

    /** _isSpecialPageId ** {{{ Является ли страница спецстраницей?
     * @param pageId
     * @returns {boolean}
     */
    _isSpecialPageId : function (pageId) {

        return !!( pageId && this._specialPages[pageId] );

    },/*}}}*/

    /** _getSpecialPageId ** {{{ Показывать ли спецстраницу (SignedOut) без загрузки параметров и инициализации?
     * @return {string|boolean}
     */
    _getSpecialPageId : function () {

        var pageId = this._getPageIdToOpen();

        return this._isSpecialPageId(pageId) ? pageId : false;

    },/*}}}*/

    /** setSpecialAuthErrorTitle ** {{{ Установить заголовок (тело) для ошибки авторизации */
    setSpecialAuthErrorTitle : function (title) {

        // TODO: Использовать поиск внутри объекта!
        app._specialPages.AuthError.content.content[0].content = title;

    },/*}}}*/

    /** showSpecialPage ** {{{ Показываем спецстраницу
     * @param specialId - Идентификатор спецстраницы
     */
    showSpecialPage : function (specialId) {

        var
            app = this,
            specialCtx = app._specialPages[specialId],
            bemjson = specialCtx ? specialCtx.content: 'Неизвестная страница: '+specialId,
            html = BEMHTML.apply(bemjson),
            icon = specialCtx ? specialCtx.icon : 'ti-close',
            undef
        ;

        app._appholder.hideScreenLoader(); // ???
        app._appholder.error(html, icon)
            // Спецстраница создана и анимация завершена
            .then(function(data){
                var acceptDom = specialCtx.acceptDom || app._specialPagesAcceptDom
                ;
                // Вызов колбека действий с DOM спецстраницы
                if ( typeof acceptDom === 'function' ) {
                    acceptDom.call(app, specialId, specialCtx, data.domElem);
                }
            })
        ;

    },/*}}}*/

    /** _initConfig ** {{{ Дополняем конфигурацию приложения переданными параметрами */
    _initConfig : function () {

        try {
            var queryParams = querystring.parse(window.location.search);
            Object.keys(queryParams).map(function(id){
                var val = queryParams[id];
                // Вариант 1: парсим переданные данные (опасно)
                // val = eval(val, { // jshint ignore:line
                //     __builtins__ : {},
                // });
                // Вариант 2: разбираем булевы и числовые значения
                if ( !isNaN(val) ) {
                    val = Number(val);
                }
                else if ( val === 'true' ) {
                    val = true;
                }
                else if ( val === 'false' ) {
                    val = false;
                }
                queryParams[id] = val;
            });
            Object.assign(project.config, queryParams);
            console.info( 'project.config extended with', queryParams, '=>', project.config );
            return { status : 'configInited' };
        }
        catch (error) {
            console.error( '_initConfig error:', error );
            /*DEBUG*//*jshint -W087*/debugger;
            return app.__error([ 'Некорректно задан параметр: ', error ], '_initConfig');
        }

    },/*}}}*/

    /** _initApp ** {{{ Инициализируем приложение
     * @param {boolean} skipSpecials - Принудительно используем станадртную процедуру инициализации (не показываем спецстраницы)
     * @returns {Promise}
     */
    _initApp : function (skipSpecials) {

        var app = this,
            that = this,

            // Внешний DOM-элемент
            outerVlayout = this._vlayout,

            // Заставка приложения
            appholder = this._appholder = project.config.useAppholder ? ( outerVlayout && outerVlayout.findChildBlock(BEMDOM.entity('appholder')) ) : null,

            // Название первой фазы загрузки
            title = 'Инициализация приложения...',

            // Выводим информацию в заставку приложения
            loaderStatus = appholder && appholder.loaderStatusSet(title),

            // Стартуем основной waiter
            appInitWaiter = waiter.start('app_init_'+Date.now(), {
                title : title,
            }),

            undef
        ;

        // Не требуется загрузка параметров, просто показываем контент (SignedOut)
        var specialPageId = this._getSpecialPageId();
        if ( !skipSpecials && specialPageId ) {
            // Показываем контент спецстраницы
            appInitWaiter.Done();
            this.showSpecialPage(specialPageId);
            return null;
        }

        // Иначе идём на стандартную процедуру загрузки параметров и инициализации

        return vow.cast(null)

            // Дополняем конфигурацию
            .then(app._initConfig, app)

            // Загружаем параметры
            .then(app._loadAppParams, app)

            // Завершаем подготовку: открываем страницу
            .then(app._afterInit, app)

            .then(function(data) {

                appInitWaiter.Done();

                if ( data.status !== 'showSpecialPage' ) {
                    if ( appholder ) {
                        appholder.loaderStatusRemove(title);
                        appholder.closeLoaderAndDisappear(true);
                    }
                }

            })
            .fail(function(error) {

                console.error( 'app._loadAppParams error', error );
                /*DEBUG*//*jshint -W087*/debugger;

                app.error(error);
                appInitWaiter.Error(error);

            })
        ;


    },/*}}}*/

    /** initialize() ** {{{ Инициализируем объект.
     */
    initialize : function initialize () {

        var app = this,
            that = this,
            // __callee = arguments.callee.name,
            // __calleeCaller = arguments.callee.caller.name,
            params = this.params
        ;

        // Устанавливаем подмодули
        app.modules = {
            socket : socket,
            session : session,
        };
        Object.assign(app, app.modules);

        // Сохраняем ссылку на `app` в глобальном DOM // ???
        window && ( window.app = this );

        // Параметры
        app._initDefaultParams();

        // DOM
        app._initDom();
        app._initDomEvents();

        // Инициализируем приложение
        app._initApp();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     *
     * @method
     *
     */
    onSetMod : {

        /** js:inited ** {{{ Модификатор `js:inited` -- при инициализации блока системой.
         */
        'js' : {
            'inited' : function () {
                this.initialize();
            },
        },/*}}}*/

    },/*}}}*/

} ));

});
