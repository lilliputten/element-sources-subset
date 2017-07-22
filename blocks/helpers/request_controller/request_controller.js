/* jshint camelcase: false */
/* jshint unused: false */
/* globals modules, applyCtx, content, applyNext, block, elem, attrs, def, tag, js, wrap */

/**
 *
 * @overview request_controller
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.08.16
 * @version 2016.10.20, 19:34
 *
*/

/*
 * @module request_controller
 */
modules.define('request_controller', [
        'i-bem-dom',
        'waiter',
        // 'popup_controller',
        'project',
        'vow',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        waiter,
        // popup_controller,
        project,
        vow,
        $
    ) {

/*
 * @exports request_controller
 * @class request_controller
 * @bem
 */

/**
 *
 * @class request_controller
 * @classdesc Обработка и передача запросов к серверу
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * @see http://api.jquery.com/jquery.ajax/
 *
 */

provide(/** @lends request_controller.prototype */ {

    /** Объединение ошибок */
    errPlus : '\n',

    // /** _isAuthError ** {{{ */_isAuthError : function (data) {
    //
    //     if ( typeof data === 'object' && data.error ) {
    //         if ( data.error === 'AuthError' ) {
    //             return data.error;
    //         }
    //         else if ( data.error.indexOf('Ошибка авторизации') !== -1 ) {
    //             return 'AuthReferenced';
    //         }
    //     }
    //
    //     return '';
    //
    // },/*}}}*/

    /** _request_error() ** {{{ Обработка ошибок запроса
     */
    _request_error : function (settings, jqXHR, textStatus, error) {

        var errorText = app.error2string(error),
            request_name = settings.title || settings.request_id || settings.url || 'undefined_request'
        ;

        // Неизвестная ошибка (возможно, COSR, если LOCAL_DEV)
        if ( !errorText && ( !textStatus || textStatus === 'error' ) && !jqXHR.responseText ) {
            errorText = 'Ошибка сервера или доступа к серверу ('+request_name+')';
        }

        if ( !settings.no_serverside_errors && typeof jqXHR.responseText === 'string' ) {
            if ( jqXHR.responseText.indexOf('Error') === 0 ) {
                // errorText && ( errorText += this.errPlus );
                errorText = 'Ошибка на стороне сервера:\n' + this.errPlus;
                errorText += jqXHR.responseText.replace(/\s*<br[^<>]*>[\n\r\s]*/g,'\n');
            }
            // EG:
            // <b>Fatal error</b>:  Uncaught exception 'Phalcon\Cache\Exception' with message 'Failed storing the data in redis' in phalcon/cache/backend/redis.zep:244
            // ...
            //   thrown in <b>phalcon/cache/backend/redis.zep</b> on line <b>244</b><br />
            var fatalErrorFound = jqXHR.responseText.match(/(<b>Fatal error<\/b>[\s\S]* on line <b>\d*<\/b>)<br/mi)
            if ( fatalErrorFound && fatalErrorFound.length ) {
                errorText = 'Ошибка сервера:' + fatalErrorFound[1];
            }
        }
        if ( errorText.indexOf('Auth') === 0 ) {// == 'auth' ) {
            var auth_url = project.helpers.expand_path(project.config.auth_url);
            errorText = 'Ошибка авторизации (' + request_name + ')'//: ' + errorText
            ;
        }
        if ( errorText == 'timeout' ) {
            errorText = 'Истекло время ожидания запроса ('+request_name+')';
        }
        if ( jqXHR.status && jqXHR.status != 200 ) {
            errorText && ( errorText += this.errPlus );
            jqXHR.status == 404 && ( errorText += '(404) Адрес не найден: '+settings.url );
        }

        console.error(errorText, settings, jqXHR, textStatus, error);
        /*DEBUG*//*jshint -W087*/debugger;

        // // Обработка ошибок -- ???
        // // TODO 2016.10.25, 11:49 -- `error_controller`?
        // if ( !settings.silent_errors ) {
        //     if ( settings.error_callback === 'function' ) {
        //         error_callback(errorText);
        //     }
        //     else {
        //         var error_controller = settings.error_controller || app;
        //         if ( typeof error_controller === 'object' ) {
        //             if ( typeof error_controller.error === 'function' ) {
        //                 error_controller.error(errorText);
        //             }
        //             // /*DEBUG*//*jshint -W087*/debugger;
        //         }
        //     }
        // }

        return errorText;

    },/*}}}*/

    /** do_waiter_request() ** {{{
     * @param {object} settings - Параметры запроса, см. {@link #do_jqXHR_request}
     */
    do_waiter_request : function (settings) {

        var request_controller = this,
            that = this,

            op_id = settings.id || ( 'request_' + String(settings.url).replace(/\W+/g, '_') ),
            request_id = settings.request_id || ( op_id + '_' + Date.now() ),
            // request_waiter = waiter.start(request_id, {
            //     title : settings.title || 'Запрос ' + settings.url,
            // }),
            request_waiter = waiter.start(request_id, $.extend({ timeout : settings.waiter_timeout }, settings)),
            jqXHR = this.do_jqXHR_request(settings),

            undef
        ;

        jqXHR
            .done(function(data, textStatus, jqXHR){

                if ( typeof data === 'string' ) {
                    // Ошибка PHP
                    if ( data.match(/^((<[^<>]*>[\n\r\s]*))*<b>(Fatal error|Notice|Parse error)<\/b>/gi) ) {
                        var errorData = request_controller._request_error(settings, jqXHR, textStatus, data);
                        // var errorData = {
                        //     error : error,
                        //     textStatus : textStatus,
                        //     jqXHR : jqXHR,
                        // };
                        console.error(errorData, data);
                        /*DEBUG*//*jshint -W087*/debugger;
                        request_waiter.Error(errorData);
                        return errorData;
                    }
                }

                // Явная ошибка в JSON
                if ( data && typeof data === 'object' && data.error ) {
                    // var errorData = request_controller._request_error(settings, jqXHR, textStatus, data);

                    console.error('Error:', data.error, data);
                    request_waiter.Error(data);
                    /*DEBUG*//*jshint -W087*/debugger;

                    return 'error: '+data.error;
                }

                // Иначе возвращаем данные
                return request_waiter.Done(data);
            })
            .fail(function(jqXHR, textStatus, error){
                var errorData = request_controller._request_error(settings, jqXHR, textStatus, error);
                // var errorData = {
                //     error : error,
                //     textStatus : textStatus,
                //     jqXHR : jqXHR,
                // };
                if ( !settings.ignore_errors ) {
                    request_waiter.Error(errorData);
                }
                else {
                    request_waiter.Done(errorData);
                }
                return errorData;
            })
        ;

        return request_waiter;

    },/*}}}*/

    /** do_jqXHR_request() ** {{{ Делаем запрос (новый).
     *
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
     *  jqXHR.done(function( data, textStatus, jqXHR ) {});
     *  jqXHR.fail(function( jqXHR, textStatus, errorThrown ) {});
     *  jqXHR.always(function( data|jqXHR, textStatus, jqXHR|errorThrown ) { });*
     *  jqXHR.then(function( data, textStatus, jqXHR ) {}, function( jqXHR, textStatus, errorThrown ) {});
     *
     */
    do_jqXHR_request : function (settings) {

        var request_controller = this;

        // Если локальный dev-сервер, то разрешаем CORS
        if ( LOCAL_ENB ) { // TODO 2016.10.24, 20:33 -- Закрывать при разработке на локальном сервере + ответную часть в серверном коде
            settings.crossDomain = true;
            settings.xhrFields = $.extend({ withCredentials: true }, settings.xhrFields);
        }

        // Ключ авторизации
        var authToken = getCookie(project.config.authCookieName);
        if ( authToken ) {
            ( settings.headers || ( settings.headers = {} ) )['element-token'] = authToken;
        }

        settings.request_timeout && ( settings.timeout = settings.request_timeout );

        var jqXHR = $.ajax(settings);

        return jqXHR;

    },/*}}}*/

    /** do_request() ** {{{ Запрашиваем данные через AJAX
     *
     * @param [{string}] request_id - Идентификатор запроса для отладки и вывода в сообщениях
     * @param {string} method - Метод запроса (`POST` или `GET`)
     * @param {string} ajax_url - Адрес ресурса
     * @param {string} ajax_data - Данные передаваемые с запросом
     * @param {callback} callback - Обработчик успешного завершения
     * @param {callback} failback - Обработчик ошибочного завершения (параметром передаётся текстовый статус ошибки, если возможно)
     *
     */
    do_request : function (request_id, method, ajax_url, ajax_data, callback, failback) {

        var request_controller = this;

        var request_promise = this.do_waiter_request({
            request_id : request_id,
            method : method,
            url : ajax_url,
            data : ajax_data,
        })

        request_promise
            .fail(function(error){
                typeof failback === 'function' && failback(error);
            })
        ;

        return request_promise
            .then(function(data){
                typeof callback === 'function' && callback(data);
            })
        ;

    },/*}}}*/

    /** do_request_promise() ** {{{ Запрашиваем данные через AJAX, возвращаем Promise
     *
     * @param [{string}] request_id - Идентификатор запроса для отладки и вывода в сообщениях
     * @param {string} method - Метод запроса (`POST` или `GET`)
     * @param {string} ajax_url - Адрес ресурса
     * @param {string} ajax_data - Данные передаваемые с запросом
     *
     * return {Promise}
     *
     */
    do_request_promise : function (request_id, method, ajax_url, ajax_data) {

        var request_controller = this;

        return this.do_waiter_request({
            request_id : request_id,
            method : method,
            url : ajax_url,
            data : ajax_data,
        });

        /* OLD CODE -- 2016.10.24, 21:21
        return new vow.Promise(function (resolve, reject) {
            request_controller.do_request(request_id, method, ajax_url, ajax_data,
                resolve,
                reject
            );
        });
        */

    },/*}}}*/

}); // provide

}); // module
