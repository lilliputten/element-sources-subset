/**
 *
 *  @overview Управление всплывающими окнами.
 *  @author lilliputten <lilliputten@yandex.ru>
 *  @since 2016.07.12
 *  @version 2016.07.27, 20:00
 *
*/

modules.define('popup_controller', [
        'i-bem-dom',
        // 'popup_dialog',
        // 'store',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // popup_dialog,
        // store,
        $
    ) {

/**
 * Количество активных (одновременно присутствующих на экране) окон.
 * @type {Number}
 */
var popups_count = 0;
/**
 * Стек объектов окон.
 * @type {Array:Object}
 */
var popups_stack = [];

/**
 *
 *  @class popup_controller
 *  @classdesc Управление всплывающими окнами.
 *
 *
 *  TODO
 *  ====
 *
 *  ОПИСАНИЕ
 *  ========
 *
 */

var popup_controller = {

    /*{{{ * stack */
    /**
     * Стек.
     */
    stack : {

        /**
         * Получаем элемент стека.
         *
         * @param pos {Number} Позиция элемента в стеке.
         *
         */
        get : function (pos) {
            return popups_stack[pos];
        },

        count : function () {
            return popups_count;
        },

        remove_last : function () {
            if ( popups_count > 0 ) {
                this.remove(popups_stack[0]);
            }
        },

        remove_by_pos : function (pos) {
            if ( typeof popups_stack[pos] != 'undefined' ) {
                popups_stack.splice(pos, 1);
                if ( ! --popups_count ) {
                    $('body').removeClass('has_popup');
                }
            }
        },

        remove : function (popup_elem) {
            var pos = popups_stack.indexOf(popup_elem);
            if ( pos !== -1 ) {
                this.remove_by_pos(pos);
            }
        },

        add : function (popup_elem) {
            popups_stack.unshift(popup_elem);
            if ( ! popups_count++ ) {
                $('body').addClass('has_popup');
            }
        },

    },/*}}}*/

    /*{{{*/spin : function (params) {

        params = params || {};

        var block = {
            block : 'popup_dialog',
            mix : [
                { block : 'popup_dialog_spin' },
            ],
            // options : params.options,
            options : $.extend(params.options || {}, {
                mode: 'spin',
                // title: 'Сохраняем',
                close_button: false,
                noautoclose : true,
                // buttons: [ 'ok' ]
            }),
            content : {
                block : 'spin_container',
                content : { block : 'spin', mods : { theme : 'islands', size : 'xl', visible : true } },
            },
        };
        var html = BEMHTML.apply(block);
        var bem_root = $('body');
        var dom_elem = BEMDOM.append(bem_root, html);
        var popup_dialog = $(dom_elem).bem(BEMDOM.entity('popup_dialog'));
        if ( typeof params.callback === 'function' ) {
            popup_dialog.params.ask_callback = params.callback;
        }
        else {
            popup_dialog.params.ask_callback = function (id, self) {
                // self.close(true);
                return false;
            };
        }

        if ( !params.dont_show ) {
            popup_dialog.open();
        }

        return popup_dialog;

    },/*}}}*/

    /*{{{*/dialog : function (params) {

        var block = {
            block : 'popup_dialog',
            mix : [
                { block : 'popup_dialog_dialogbox' },
            ],
            options : $.extend( true, {
                autodestroy : true,
            }, params.options),
            content : params.content,
        };
        var html = BEMHTML.apply(block);
        var bem_root = $('body');
        var dom_elem = BEMDOM.append(bem_root, html);
        var popup_dialog = $(dom_elem).bem(BEMDOM.entity('popup_dialog'));
        if ( typeof params.callback === 'function' ) {
            popup_dialog.params.ask_callback = params.callback;
        }

        popup_dialog.open();

        return popup_dialog;

    },/*}}}*/

    /*{{{*/infobox : function (text, title) {
        this.msgbox({
            options :  { title : title || 'Информация' },
            content : text,
        });
    },/*}}}*/

    /*{{{*/errorbox : function (text, title) {
        this.msgbox({
            options :  { title : title || 'Ошибка' },
            content : text,
        });
    },/*}}}*/
    /*{{{*/error : function (text, title) {

        return this.errorbox(text, title);

    },/*}}}*/

    /** msgbox() {{{ Показать сообщение
     *
     * @param {object} params - Параметры
     * @param {object|array|string} [params.content] - Содержимое окна. Будет обработано BEMHTML как содержимое блока `popup_dialog`.
     * @param {object} [params.options] - Опции окна.
     * @param {string} [params.options.title] - Заголовок окна.
     * @param {array} [params.options.buttons] - Кнопки. По умолчанию создаётся кнопка `ok`.
     * @param {boolean} [params.options.close_button=true] - Показывать кнопку "закрыть окно" (крестик справа вверху).
     * @param {boolean} [params.options.autodestroy=true] - Автоматически уничтожать созданный объект popup после закрытия.
     *
     */
    msgbox : function (params) {

        var content = ( typeof params.content === 'string' ) ? params.content : app.error2html(params.content).trim();
        var options = $.extend( true, {
            close_button: true,
            // buttons: [ 'ok' ],
            autodestroy : true,
        }, params.options);
        if ( !options.buttons ) {
            options.buttons = [ 'ok' ];
        }
        var block = {
            block : 'popup_dialog',
            mix : [
                { block : 'popup_dialog_msgbox' },
            ],
            options : options,
            content : {
                elem : 'text',
                content : content,
            },
        };
        var html = BEMHTML.apply(block);
        var bem_root = $('body');
        var dom_elem = BEMDOM.append(bem_root, html);
        var popup_dialog = $(dom_elem).bem(BEMDOM.entity('popup_dialog'));
        if ( typeof params.callback === 'function' ) {
            popup_dialog.params.ask_callback = params.callback;
        }
        // else {
        //     popup_dialog.params.ask_callback = function (id, self) {
        //         self.close(true);
        //     };
        // }

        popup_dialog.open();

        return popup_dialog;

    },/*}}}*/

    /*{{{*/error_request_OLD : function (title, text, data) {

        var message = '';//text || 'Некорректный формат данных';

        if ( typeof text === 'string' ) {
            if ( !text || text === 'error') {
                message = '<h1>Неизвестная ошибка. Возможно, сервер недоступен или неверно задан адрес запроса.</h1>';
            }
            else {
                message = '<p>' + text + '</p>';
            }
        }

        if ( typeof data === 'string' ) {
            if ( data.indexOf('404 Not Found') !== -1 ) {
                message += '<p>404 Ресурс не найден.</p>\n';
            }
            if ( data.indexOf('Вход не выполнен') !== -1 ) {
                message += '<p>Потеря сессии авторизации.</p>\n';
            }
            if ( data.indexOf('<b>Warning') !== -1 ) {
                message += '<p><strong>PHP:</strong><br/>\n'+data+'</p>\n';
            }
            if ( data.indexOf('<b>Notice') !== -1 ) {
                message += '<p><strong>PHP:</strong><br/>\n'+data+'</p>\n';
            }
            if ( !message ) {
                message += '<p>'+data+'</p>\n';
            }
        }
        else if ( typeof data === 'object' ) {
            var str = ''
            if ( data.responseText ) {
                var s = data.responseText.replace(/(<[^<>]*>)+/g, ' ');
                // TODO: parse html respponse
                s = s.replace(/[\n\r\s\t ]+/gm, ' ').trim();
                s = s.replace(/^(.{200}).*$/,'$1...');
                str += '<p><b>responseText:</b> ' + s + '</p>\n';
            }
            if ( data.statusText && data.statusText !== 'error' ) {
                str += '<p><b>statusText:</b> ' + data.statusText.replace(/(<[^<>]*>)+/g, ' ') + '</p>\n';
            }
            if ( str ) {
                message += '<p>Ответ сервера:</p>\n<p>' + str + '</p>';
            }
        }

        if ( !message ) {
            message = '<p>Неизвестная ошибка.</p>';
        }

        this.error_message(title, message, data);

    },/*}}}*/
    /*{{{*/error_message : function (title, message, data) {

        this.msgbox({
            options :  {
                mode: 'content',
                title: title,
                close_button: true,
                buttons: [ 'ok' ]
            },
            content: message,
        });

    },/*}}}*/

};

provide(popup_controller);

});
