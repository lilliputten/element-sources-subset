/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @module socket
 * @overview Реализация WebSockets
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.04.18, 12:53
 * @version 2017.04.18, 12:53
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: socket.js 8746 2017-07-13 17:12:11Z miheev $
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 * См.:
 *
 *     https://github.com/socketio/socket.io-client/blob/master/docs/API.md
 *     https://github.com/socketio/socket.io-client
 *     https://github.com/socketio/socket.io
 *
*/

modules.define('socket', [
        // 'i-bem-dom',
        // 'SecureAjax',
        'project',
        'socketio',
        'vow',
        'waiter',
        // 'md5',
        'jquery',
    ],
    function(provide,
        // BEMDOM,
        // SecureAjax,
        project,
        socketio,
        vow,
        waiter,
        // md5,
        $,
    __BASE) {

/*
 * @exports
 * @class socket
 * @bem
 */

/**
 *
 * @class socket
 * @classdesc Реализация WebSockets
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

// Ссылка на описание модуля
var __module = this;

var socket = /** @lends socket.prototype */ {

    // Данные...

    // TODO: Перенести данные в params.

    /** Экземпляр socket.io */
    io : socketio,

    /** Рабочий сокет */
    transport : null,

    /** Флаг состояния сокета: true = доступен, функционирует и авторизован; иначе -- сокеты не использовать!  */
    inited : false,

    // Методы...

    /** __error ** {{{ Обработка ошибки
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

        var socket = this,
            errorId = __module.name + ':' + methodName;

        console.error( errorId, error );
        /*DEBUG*//*jshint -W087*/debugger;

        ( typeof error === 'object' ) && ( error.trace || ( error.trace = [] ) ).push(errorId);

        return vow.Promise.reject(error);

    },/*}}}*/

    /** isConnected ** {{{ Инициализирован ли и подключён транспорт сокетов
     * @returns {Boolean}
     */
    isConnected : function () {

        return ( this.inited && this.transport && this.transport.id ) ? true : false;
    },/*}}}*/

    /** getSocketId ** {{{ Идентификатор подключённого сокета
     * @returns {String|null}
     */
    getSocketId : function () {

        return ( this.inited && this.transport && this.transport.id ) || null;

    },/*}}}*/

    /** __OLD_CODE__ ** {{{ Код только для референса. НЕ ИСПОЛЬЗОВАТЬ!
     */
    __OLD_CODE__ : function () {

        // DEBUG!
        localStorage.debug = '*';

        /* globals io, debug_add, websocketUrl, node_token, element_list */
        var socket = io(websocketUrl, {
            'transports': ['websocket']
        });
        socket.on('connect', function() {
            debug_add('Подключение к веб-сокету успешно');
            socket.emit('auth', {
                'token': node_token
            });
            socket.on('auth-false', function() {
                debug_add('В авторизации отказано. Прерываем сессию веб-сокета.');
                socket.disconnect();
            });
            socket.on('auth-ok', function(data) {
                debug_add(data.msg);
            });

            socket.on('msg', function(data) {
                debug_add(data.msg);
            });
            socket.on('modata', function(data) {
                if (data.ID) {
                    element_list.updateListLineHTML(data);
                }
            });
        });
        socket.on('disconnect', function() {
            debug_add('Соединение сокета разорвано');
        });
        socket.on('reconnect', function() {
            debug_add('Соединение сокета восстановлено');
        });

    },/*}}}*/

    /** disconnect ** {{{ Разрываем соединение с сервером
     * @returns {Promise}
     */
    disconnect : function () {

        var socket = this;

        try {

            if ( this.transport ) {
                this.transport.disconnect();
                delete this.transport;
            }

            return vow.Promise.resolve({ status : 'disconnected' });

        }
        catch (e) {
            return this.__error(e);
        }

    },/*}}}*/
    /** connect ** {{{ Устанавливаем соединение с сервером
     * @returns {Promise}
     */
    connect : function () {

        try {

            var socket = this,
                socketUrl = app.params.config.websocketUrl,
                socketToken = app.params.config.nodeToken,

                waiterId = 'socketConnect' + Date.now(),
                socketWaiter = waiter.start(waiterId, {
                    title : 'Запуск сокетов',
                    timeout : 10000,
                    timeout_break : false,
                }),

                undef

            ;

            // Делаем что-то иное в случае работы на локальном сервере? (TODO)
            // if ( !project.config.LOCAL_ENB ) { // ???
            // }

            // Сбрасываем флаг инициализации
            socket.inited = false;

            // Параметры для socket.io (???)
            // localStorage.debug = '*';

            // Инициализируем транспорт, если не установлен
            if ( !socket.transport ) {
                socket.transport = socket.io(socketUrl, { 'transports' : [ 'websocket' ] });
            }

            // Если ошибка...
            if ( typeof socket.transport !== 'object' || typeof socket.transport.on !== 'function' ) {
                return socket.__error({
                    error : 'socketTransportUndefined',
                    description : 'Невозможно инициализировать транспорт сокетов',
                    socket : socket,
                });
            }

            return new vow.Promise(function(resolve,reject){

                // Ошибка соединения
                socket.transport && socket.transport.on('connect_error', function(error) {
                    console.warn( 'socket: connect_error', socket, error );
                    /*DEBUG*//*jshint -W087*/debugger;
                    // Если ошибка транспорта, отключаем сокет
                    if ( error.type === 'TransportError' ) {
                        socket.transport.disconnect();
                        delete socket.transport;
                    }
                    reject(error);
                });

                // socket.transport.on('connect_failed', function(data) {
                //     console.warn( 'socket: connect_failed', socket, data );
                //     /*DEBUG*//*jshint -W087*/debugger;
                // });

                // socket.transport.on('error', function(data) {
                //     console.warn( 'socket: error', socket, data );
                //     /*DEBUG*//*jshint -W087*/debugger;
                // });

                socket.transport && socket.transport.on('disconnect', function(data) {
                    console.warn( 'socket: disconnect', socket, data );
                    // /*DEBUG*//*jshint -W087*/debugger;
                });
                socket.transport && socket.transport.on('reconnect', function(data) {
                    console.warn( 'socket: reconnect', socket, data );
                    // /*DEBUG*//*jshint -W087*/debugger;
                });

                socket.transport && socket.transport.on('connect', function(){

                    // Запрос авторизации
                    socket.transport.emit('auth', { 'token' : socketToken });

                    // Подтверждение авторизации
                    socket.transport.on('auth-ok', function(data) {
                        socket.inited = true;
                        resolve({
                            status : 'socketAuthOk',
                            description : 'Успешная авторизация сокетов',
                            socket : socket,
                            msg : data.msg,
                            socketUrl : socketUrl,
                            socketToken : socketToken,
                        });
                    });
                    // Отказ авторизации
                    socket.transport.on('auth-fail', function(data) {
                        console.warn( 'socket: auth-fail', socket, data );
                        /*DEBUG*//*jshint -W087*/debugger;
                        reject({
                            error : 'socketError',
                            type : 'socketAuthError',
                            description : 'Отказ авторизации сокетов',
                            socket : socket,
                            msg : data.msg,
                            socketUrl : socketUrl,
                            socketToken : socketToken,
                        });
                        // socket.transport.disconnect();
                    });

                    // Сообщения сервера
                    // socket.transport && socket.transport.on('msg', function(data) {
                    // });

                    // // Данные отчётов: ТЕСТ!
                    // socket.transport && socket.transport.on('reportpart', function(data) {
                    //     console.log( 'socket reportpart (socket module)', data ); // !!!
                    // });

                    // // Данные по перемещению КО. TODO: вынести в модуль работы с картами.
                    // socket.transport && socket.transport.on('modata', function(data) {
                    //     // console.log( 'socket modata (socket module)', data ); // !!!
                    //     // if ( data.ID ) {
                    //     //     // console.log(Date.now() + ': Получены данные КО:' + data.ID);
                    //     //     // console.log(data);
                    //     //     // $('#ko-' + data.ID + ' .time').html(element_list.formatTimeToHTML(data.actualTime));
                    //     //     // $('#ko-' + data.ID).effect("highlight");
                    //     //     element_list.updateListLineHTML(data);
                    //     // }
                    // });

                });

            })
            .always(function(data){
                // Завершаем ожидатель при любом исходе
                socketWaiter.Done(data);
                return data;
            })
            .fail(function(e) {
                return socket.__error(e);
            })
        ;

        }
        catch (e) {
            return this.__error(e);
        }

    },/*}}}*/

    /** initialize ** {{{ ??? */
    initialize : function () {

        var socket = this;

        return vow.Promise.resolve({ status : 'inited' });

    },/*}}}*/

};

provide(socket); // provide

}); // module

