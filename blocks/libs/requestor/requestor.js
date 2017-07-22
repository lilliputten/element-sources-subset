/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */

/**
 *
 * @module requestor
 * @overview Организация ajax запросов со сквозной проверкой безопасности и интегрированной авторизацией
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.02.08 17:50:06
 * @version 2017.02.08 17:50:06
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: requestor.js 8733 2017-07-11 16:47:15Z miheev $
 *
*/

modules.define('requestor', [
        'i-bem-dom',
        'SecureAjax',
        'uri',
        'uri__querystring',
        'project',
        'vow',
        'waiter',
        'md5',
        'next-tick',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        SecureAjax,
        uri,
        querystring,
        project,
        vow,
        waiter,
        md5,
        nextTick,
        $
    ) {

/*
 * @exports
 * @class requestor
 * @bem
 */

/**
 *
 * @class requestor
 * @classdesc Загрузка ресурсов
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * Модуль без DOM-представления для проведения авторизации.
 *
 * Обеспечивает различные интерфейсы для динамической загрузки данных.
 *
 */

var requestor = /** @lends requestor.prototype */ {

    /** getMinimalAjaxSettings ** {{{ Минимальный набор данных для передачи запросу ajax */
    getMinimalAjaxSettings : function (settings) {

        var ajaxSettings = {
            // url : settings.url,
            method : settings.method || 'GET',
            // data : settings.data,
        };

        if ( settings.url ) {
            ajaxSettings.url = settings.url;
            if ( ajaxSettings.url.includes('{{') ) {
                ajaxSettings.url = project.helpers.expand_path(ajaxSettings.url);
            }
        }

        var passProps = [
            'data',
            'processData',
        ];
        passProps.map(function(prop){
            if ( settings[prop] !== undefined ) {
                ajaxSettings[prop] = settings[prop];
            }
        });

        return ajaxSettings;

    },/*}}}*/

    /** makeStoreRequestFilename ** {{{ Преобразуем урл в имя файла для сохранения данных демо-запроса
     * @param {object} settings - Данные запроса
     * @param {string} settings.url - Адрес запроса. Сюда же сохраняется преобразованный адрес.
     * @param {object} settings.data - данные запроса. Используются для создания демо-адреса. В случае успеха удалается (параметры не передаются).
     * Изменяет `settings.url`. В случае успеха удаляет `settings.data`.
     * См. ответную часть в серверном коде:
     *   WEB_TINTS/release/core/scripts/php/app/library/Library/Helper.php
     */
    makeStoreRequestFilename : function (settings) {

        var url = settings.url;
        var origUrl = url;

        if ( !url || ( project.config.LOCAL_ENB && url.match(/^\/(pages|core|libs|blocks)\//) ) ) {
            return;
        }

        url = url.replace(/[#].*$/, '');

        var data = {};

        // Собираем параметры из строки запроса
        if ( url.includes('?') ) {
            data = querystring.parse(url);
            url = url.replace(/[?].*$/, '');
        }

        url = url.replace(/^\/(WEB_TINTS|release|fake-data|root)/, '');
        url = url.replace(/^\//, '');

        var method = settings.method || 'GET';
        // var data = settings.data || {};
        Object.assign(data, settings.data);
        var ignoreParams = [
            'socketId',
            'ReportTitle',
            'ReportTime',
            'ReportTimeStr',
            'BeginTimeStr',
            'EndTimeStr',
        ];
        ignoreParams.map(function(param){
            if ( data[param] !== undefined ) {
                data[param] = 'ANY';
            }
        });
        var ser = project.helpers.getSerializedData(data);
        if ( ser.length > 100 ) {
            ser = ser.substr(0,50)+'_'+md5(ser);
        }

        url = url + '_' + method + '_' + ser;

        url = project.config.FAKE_DATA_PATH + url + '.json';

        delete settings.data;
        delete settings.method;

        settings.url = url;

    },/*}}}*/

    /** jqRequest ** {{{ (OBSOLETTE?) Делаем запрос через jqXHR интерфейс. Используется jquery.ajax
     * @param {object} settings - Параметры запроса, в виде,
     *  пригодном для {@link http://api.jquery.com/jquery.ajax/#jQuery-ajax-settings}:
     * @param {string} settings.url - Адрес запроса.
     * @param {string} settings.method - Метод запроса (`POST` или `GET`)
     * @param {object|array|string} settings.data - Данные.
     * @param {object} settings.headers - Заголовки.
     * @param {object} settings.statusCode - Действия для кодов ответа HTTP.
     * @param {callback} settings.success - Обработка успешного завершения. Параметры: Anything data, String textStatus, jqXHR.
     * @param {callback} settings.error - Обработка ошибки. Параметры:  jqXHR, String textStatus, String errorThrown.
     * @param {callback} settings.complete - Завершение запроса (вызывается после всех остальных обработчиков в любом случае). Параметры: jqXHR, String textStatus.
     *
     * @return {jqXHR/Promise}
     *
     * @see Default Promise methods:
     *
     * jqXHR.done(function( data, textStatus, jqXHR ) {});
     * jqXHR.fail(function( jqXHR, textStatus, errorThrown ) {});
     * jqXHR.always(function( data|jqXHR, textStatus, jqXHR|errorThrown ) { });*
     * jqXHR.then(function( data, textStatus, jqXHR ) {}, function( jqXHR, textStatus, errorThrown ) {});
     *
     */
    jqRequest : function (settings) {

        /*{{{ Для CORS-запросов. Сейчас не используется. (Оставить для отладки?)
        // Расширяем параметры флагом `ajax` (`request->isAjax` в phalcon срабатывает не всегда).
        settings.data = $.extend({ ajax : true }, settings.data);
        // Если работаем на демо-сервере, то разрешаем кроссдоменные запросы
        if ( project.config.LOCAL_ENB ) { // TODO 2016.10.24, 20:33 -- Закрывать при разработке на локальном сервере + ответную часть в серверном коде
            settings.crossDomain = true;
            settings.xhrFields = $.extend({ withCredentials: true }, settings.xhrFields);
        }
        // Ключ авторизации
        var authToken = getCookie(project.config.authCookieName);
        if ( authToken ) {
            ( settings.headers || ( settings.headers = {} ) )['element-token'] = authToken;
        }
        }}}*/

        var ajaxSettings = this.getMinimalAjaxSettings(settings);

        // Если демо-сервер, то подменяем url
        if ( project.config.USE_FAKE_DATA && ajaxSettings.url ) {
            this.makeStoreRequestFilename(ajaxSettings);
        }
        // // Если адрес от корня сервера ('/*'),
        // // не статика (не файл с расширением '.*')
        // // и запуск из-под enb-server,
        // // то отдаём запрос на `http://localhost/` (исопльзовать переменную из `config`?)
        // else if ( ajaxSettings.url && ajaxSettings.url.indexOf('/') === 0 && ajaxSettings.url.indexOf('.') === -1 && project.config.LOCAL_ENB ) {
        //     ajaxSettings.url = 'http://localhost' + ajaxSettings.url;
        // }
        // // ВНИМАНИЕ: Без CORS работать не будет!!!

        return new vow.Promise(function(resolve,reject){
            $.ajax(ajaxSettings)
                .then(function(data, textStatus, jqXHR){
                    return resolve(data);
                })
                .fail(function(jqXHR, textStatus, error){
                    console.error( 'jqRequest error', ajaxSettings, '->', jqXHR, textStatus, error );
                    /*DEBUG*//*jshint -W087*/debugger;
                    return reject({
                        settings : settings,
                        jqXHR : jqXHR,
                        textStatus : textStatus,
                        error : error,
                    });
                })
            ;
        });

    },/*}}}*/

    /** secureRequest ** {{{ Запрос через SecureAjax.
     * @returns {Promise}
     */
    secureRequest : function (settings) {

        var requestor = this,
            that = this,

            deferredAction = vow.defer(),

            appholder = app._appholder,

            authFormId = 'formAuthLogin',

            undef
        ;

        try {

            var ajaxSettings = this.getMinimalAjaxSettings(settings);

            Object.assign(ajaxSettings, {

                /** success ** {{{ */
                success: function (data, textStatus, jqXHR) {

                    deferredAction.resolve(data);

                },/*}}}*/

                /** error ** {{{ */
                error: function (jqXHR, textStatus, error) {

                    var throwError = {
                        jqXHR : jqXHR,
                        textStatus : textStatus,
                        error : error,
                    };

                    if ( ( typeof error === 'object' && error.error === 'AuthError' ) || ( textStatus === 'canceled' ) ) {

                        console.warn( 'secureRequest AuthError:', settings, '->', jqXHR, textStatus, error );
                        /*DEBUG*//*jshint -W087*/debugger;

                        var errorHtml = app.error2html(throwError);
                        app.setSpecialAuthErrorTitle(errorHtml);
                        app.showSpecialPage('AuthError');
                        // throwError.processed = true;
                        deferredAction.reject( Object.assign({ processed : true }, throwError) );

                    }
                    else {

                        console.warn( 'secureRequest error:', settings, '->', jqXHR, textStatus, error );
                        /*DEBUG*//*jshint -W087*/debugger;

                        deferredAction.reject(throwError);

                    }

                },/*}}}*/

                /** state ** {{{ */
                state: function (state, query, description) {

                    if ( appholder && appholder.getMod('show') && appholder.loaderStatusUpdate ) {
                        if ( description.startsWith('Целевой запрос') ) {
                            description = 'Запрос данных...';
                        }
                        appholder.loaderStatusUpdate(description);
                    }

                },/*}}}*/

                /** getLoginForm ** {{{ */
                getLoginForm: function (cbSubmit, cbCancel, cbChangeAuth) {

                    var formId = authFormId;

                    appholder.showScreen(formId, {

                        deferredAction : deferredAction,

                        /** onSubmit_formAuthLogin ** {{{ Пытаемся войти в систему */
                        onSubmit_formAuthLogin : function (e, params) {
                            var
                                // Экран с формой
                                screenElem = params.screenElem,
                                // Форма
                                splashform = params.splashform,
                                // Параметры, сохранённые в форме
                                formOptions = splashform && splashform.params && splashform.params.options || {},
                                // Логин
                                inputUsername = splashform && splashform.findChildBlock({ block : BEMDOM.entity('input'), modName : 'id', modVal : 'username' }),
                                username = inputUsername && inputUsername.getVal(),
                                // Пароль
                                inputPassword = splashform && splashform.findChildBlock({ block : BEMDOM.entity('input'), modName : 'id', modVal : 'password' }),
                                password = inputPassword && inputPassword.getVal(),
                                // Параметры для авторизации
                                errors = []
                            ;
                            // Проверяем корректность введённых данных
                            ( username ) || errors.push('Логин не может быть пустым');
                            ( password ) || errors.push('Пароль не может быть пустым');
                            // Если найдены ошибки, то показываем их в форме
                            if ( errors && errors.length ) {
                                appholder.screenFormErrors(formId, errors);
                            }
                            // Иначе запускаем процедуру проверки авторизации
                            else {
                                cbSubmit(username, password);
                            }
                            return false;
                        },/*}}}*/

                        /** onAction_authTypeChange ** {{{ Показываем форму выбора типа авторизации */
                        onAction_authTypeChange : function (e, params) {
                            cbChangeAuth();
                            return false;
                        },/*}}}*/

                        /** onAction_cancel ** {{{ Отмена авторизации (?) */
                        onAction_cancel : function (e, params) {
                            // Не дублируем завершщение промиза -- будет обратный вызов после cbCancel
                            cbCancel();
                            return false;
                        },/*}}}*/

                    });
                },/*}}}*/

                /** changeAuthForm ** {{{ */
                changeAuthForm : function (locations, cbSubmit, cbCancel) {

                    var formId = 'formAuthTypeChange';
                    appholder.showScreen(formId, {

                        locations : locations,

                        deferredAction : deferredAction,

                        /** onSubmit_formAuthTypeChange ** {{{ Завершаем выбор типа авторизации */
                        onSubmit_formAuthTypeChange : function (e, params) {
                            var
                                splashform = params.splashform,
                                inputsElem = splashform && splashform.findChildElem('inputs'),
                                authTypeGroup = splashform && splashform.findChildBlock({ block : BEMDOM.entity('radio-group'), modName : 'id', modVal : 'authType' }),
                                authTypeVal = authTypeGroup && authTypeGroup.getVal(),
                                authTypeUrl = inputsElem && inputsElem.params.locations && authTypeVal && inputsElem.params.locations[authTypeVal]
                            ;
                            // TODO 2017.03.14, 23:10 -- Отлавливать ошибки???
                            // throw отсюда не перехватывается!
                            if (!authTypeVal || !authTypeUrl ) {
                                /*DEBUG*//*jshint -W087*/debugger;
                                throw new Error('Ошибка получения параметров смены типа авторизации');
                            }
                            cbSubmit(authTypeUrl, authTypeVal);
                            return false;
                        },/*}}}*/

                        /** onAction_cancelformAuthTypeChange ** {{{ Отмена выбора типа авторизации -- переход на форму ввода данных пользователя */
                        onAction_cancelformAuthTypeChange : function (e, params) {
                            cbCancel();
                            return false;
                        },/*}}}*/

                    });

                },/*}}}*/

                /** closeChangeAuthForm ** {{{ */
                closeChangeAuthForm : function () {

                    appholder.showScreenLoaderOrDisappear();

                },/*}}}*/

                /** closeLoginForm ** {{{ */
                closeLoginForm : function () {

                    appholder.showScreenLoaderOrDisappear();

                },/*}}}*/

            });

            var func = ( settings.id === 'authTypeChange' ) ? SecureAjax.logOff : SecureAjax.send;

            // Вызов: send | logOff
            func.call(SecureAjax, ajaxSettings);

        }
        catch (e) {
            console.error('secureRequest error:', e);
            /*DEBUG*//*jshint -W087*/debugger;
        }

        return deferredAction.promise();

    },/*}}}*/

    /** doRequest ** {{{ Сделать запрос
     *
     * Базовый метод получения запроса.
     *
     * @param {object} settings
     * @param {defer} settings.defer
     *
     * @see Вызывает {@link jqRequest} для низкоуровнего выполнения запроса.
     * @see Для отработки ошибок (и проведения авторизации) может вызывать {@link app#processAuthError}.
     * @see Вызывается из более высокоуровневых функций
     *  {@link #promiseRequest} (промис), {@link #waiterRequest} (waiter) и т.д.
     * @see Может рекурсивно вызываться из {@link app#authError} и т.п.
     *
     * @returns {jqXHR}
     */
    doRequest : function (settings) {

        var requestor = this,
            that = this,

            // Выбор метода запроса: через secureAjax или jqRequest
            requestMethod = ( project.config.useSecureAjax && !project.config.LOCAL_ENB ) ? this.secureRequest : this.jqRequest,

            // Запрос...
            promise = requestMethod.call(this, settings),

            undef
        ;

        promise
        // jqXHR
            .then(function(data, textStatus, jqXHR){

                if ( data === null ) {
                    /*DEBUG*//*jshint -W087*/debugger; // ???
                }

                // Ошибка в JSON
                if ( data && typeof data === 'object' && data.error ) {

                    // Если возвращен объект с ошибкой авторизации,
                    // "ненулевой" (не -1) код ошибки,
                    // если ошибка не циклическая,
                    // ...
                    if ( data.error === 'AuthError' && data.errorCode !== -1 && !app.isInAuthProcess() ) {

                        console.warn( 'doRequest AuthError:', data, textStatus );//, jqXHR );
                        /*DEBUG*//*jshint -W087*/debugger;

                        // ...запускаем процесс авторизации
                        // (передаём все данные исходного запроса,
                        // чтобы повторить его после авторизации)...
                        var authPromise = app.processAuthError(settings, data);
                        // В штатном случае authPromise = settings.defer
                        // -- тогда промис закрывается в методе ???.closeAuthQueue,
                        // который снова вызывает doRequest и закрывать его нужно уже здесь
                        // ???

                        // // Управление передаётся возвращаемому Promise.
                        // // !!!
                        // if ( settings.defer ) {
                        //     return settings.defer.resolve( authPromise );
                        // }
                        //
                        // return vow.Promise.resolve(authPromise); // ??? Ну, в общем, рекомендуется работать через settings.defer :)

                    }
                    // Иначе возвращаем ошибку через defer/promise
                    else if ( settings.defer ) {

                        console.warn( 'doRequest error:', data, textStatus );//, jqXHR );
                        /*DEBUG*//*jshint -W087*/debugger;

                        return settings.defer.reject(data);

                    }

                    // console.info( 'doRequest done:', data, textStatus, settings );//, jqXHR );
                    /*DEBUG*//*jshint -W087*/debugger;

                    return data;
                }

                // Если вместо данных возвращена строка
                if ( typeof data === 'string' ) {
                    // Ошибка PHP
                    var res;
                    if ( ( res = data.match(/^((<[^<>]*>[\n\r\s]*))*<b>(Fatal error|Notice|Parse error)<\/b>/gi) ) !== null ) {
                        console.warn( 'doRequest server error:', data );
                        /*DEBUG*//*jshint -W087*/debugger;
                        // var errorText = data;//that._request_error(settings, jqXHR, textStatus, data);
                        settings.defer && settings.defer.reject(data);
                        return vow.Promise.reject(data);
                    }
                }

                // Иначе возвращаем данные
                settings.defer && settings.defer.resolve(data);

                return data;

            })
            .fail(function(error){

                console.warn( 'doRequest error:', error );
                /*DEBUG*//*jshint -W087*/debugger;

                settings.defer && settings.defer.reject(error);

                // return throwError;
                // return vow.Promise.reject(throwError);

            })
            // jqXHR ...
            // .fail(function(jqXHR, textStatus, error){
            //
            //     console.warn( 'doRequest error:', jqXHR, textStatus, error );
            //     /*DEBUG*//*jshint -W087*/debugger;
            //
            //     var throwError = {
            //         jqXHR : jqXHR,
            //         textStatus : textStatus,
            //         error : error,
            //     };
            //
            //     settings.defer && settings.defer.reject(throwError);
            //
            //     // return throwError;
            //     // return vow.Promise.reject(throwError);
            //
            // })
        ;

        return promise;
        // return jqXHR;

    },/*}}}*/

    /** processRequest ** {{{ Надостройка на doRequest -- с доп. обработками
     * @param {object} settings
     * @returns {Promise}
     */
    processRequest : function (settings) {

        var requestor = this,
            that = this,

            defer = vow.defer(),

            undef
        ;

        var jqXHR = this.doRequest(settings);

        jqXHR
            .then(function(data, textStatus, jqXHR){

                return defer.resolve(data);

            })
            .fail(function(jqXHR, textStatus, error){

                var throwError = {
                    error : error || 'jqXHR',
                    description : ( textStatus && textStatus !== 'error' ) ? textStatus : 'Ошибка обработки запроса',
                    jqXHR : jqXHR,
                };

                console.warn( 'processRequest fail:', throwError, settings );
                /*DEBUG*//*jshint -W087*/debugger;

                // catch: jqXHR.status = 401, textStatus = 'error', error = 'Unauthorized'
                // не удалось провести оконную (доменную?) авторизацию, переходим по указанному
                // в cookie адресу (шаг не меняем, произойдет переход на оконную авторизацию
                if ( jqXHR.status === 401 ) {
                    // return vow.Promise.resolve({ error : 'unauth' });
                    return defer.resolve($.extend({}, throwError, {
                        error : 'unauth',
                        description : 'Ошибка авторизации (401)',
                    }));
                }

                // throwError = $.extend({}, options, throwError);
                return defer.reject(throwError);

            })
        ;

        return defer.promise();

    },/*}}}*/

    /** deferRequest() ** {{{
     * @param {object} settings - Параметры запроса, см. {@link #do_jqXHR_request}
     * @see Вызывает {@link #doRequest}.
     * @returns {Promise.defer}
     */
    deferRequest : function (settings) {

        var requestor = this,
            that = this,

            defer = vow.defer(),

            undef
        ;

        settings = $.extend({
            // timeout : settings.waiter_timeout,
            defer : defer, // ??? Нужно ли для SecureAjax?
        }, settings);

        var request = this.doRequest(settings);

        return defer;

    },/*}}}*/
    /** promiseRequest ** {{{
     * @param {object} settings - Параметры запроса, см. {@link #do_jqXHR_request}
     * @see Вызывает {@link #doRequest}.
     * @returns {Promise}
     */
    promiseRequest : function (settings) {

        return this.deferRequest(settings).promise();

    },/*}}}*/
    /** waiterRequest() ** {{{
     * @param {object} settings - Параметры запроса, см. {@link #do_jqXHR_request}
     * @see Вызывает {@link #doRequest}.
     */
    waiterRequest : function (settings) {

        // ??? TODO create waiter from defer ... (see promiseRequest)

        var requestor = this,
            that = this,

            op_id = settings.id || ( 'request_' + String(settings.url).replace(/\W+/g, '_') ),
            request_id = settings.request_id || ( op_id + '_' + Date.now() ),

            requestWaiter = waiter.start(request_id, settings),

            undef
        ;

        settings = $.extend({
            // timeout : settings.waiter_timeout,
            requestWaiter : requestWaiter,
        }, settings);

        var request = this.doRequest(settings)
            .then(function(data){
                return requestWaiter.Done(data);
            })
            .fail(function(data){
                console.error( 'waiterRequest error:', data );
                /*DEBUG*//*jshint -W087*/debugger;
                requestWaiter.Error(data);
            })
        ;

        return requestWaiter;

    },/*}}}*/

};

provide(requestor); // provide

}); // module

