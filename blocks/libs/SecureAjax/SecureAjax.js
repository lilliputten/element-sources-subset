/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals $, modules, app, project */
/**
 *
 * @module SecureAjax
 * @overview Объект, позволяющий производить запрос с выполнением авторизации в системе Element. Использует библиотеку JQuery.
 * @author <migunov@vemail.ru>
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: SecureAjax.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * Зависимости
 * ===========
 *
 * - jQuery (global `$`)
 *
 */

(function SecureAjax (global) {

    /**
     * До успешного завершения авторизации нельзя запускать одновременно несколько запросов, иначе может возникнуть
     * несколько цепочек авторизации. Решение: флаг авторизации и очередь, в которой происходит накопление запросов
     * при сброшеном флаге авторизации. Флаг авторизации сбрасывается при загрузке, выходе, смене авторизации, получении
     * требования авторизации и устанавливается при получении подтверждения авторизации.
     */

    var

        /** Флаг авторизации */
        isAuthorized = false,

        /** Флаг обработки очереди */
        queryInProgress = false,

        /** Очередь запросов */
        queryQueue = []

    ;

    /**
     * Интерфейс объекта
     */
    var SecureAjax = /** @lends SecureAjax.prototype */ {

        /**
         * export выход из приложения
         */
        logOut : function () {
            var url = getCookie('ADAuthOKURI');
            if (!url) {
                console.error('Не задан url');
                return false;
            }
            isAuthorized = false;
            url = url.replace('ADAuth', 'signout');
            window.location.assign(url);
        },

        /**
         * export смена типа авторизации
         * Параметры вызова могут содержать функции обратного вызова, аналогичные параметрам $.ajax():
         *      success: function (data, textStatus, jqXHR)
         *      error: function (jqXHR, textStatus, errorThrown)
         * В settings можно указать:
         *  - функцию обратного вызова
         *      state: function (state, query, description)
         *      Компонент будет вызывать эту функцию при каждом старте и завершении запросов (целевого и авторизации)
         *  - функцию для формирования окна авторизации
         *      getLoginForm: function(cbSubmit, cbCancel, cbChangeAuth)
         *      Компонент вызовет эту функцию при необходимости показа диалога авторизации. Функция должна создать
         *      диалог и привязать обработчики к кнопкам авторизации, отмены и смены типа авторизации. Вызовы обработчиков:
         *          cbSubmit(login, password)
         *          cbCancel()
         *          cbChangeAuth()
         *      Если функция не задана, компонент использует собственный метод создания окна
         *  - функцию для закрытия окна авторизации
         *      closeLoginForm: function(){}
         *  - функцию для формирования окна смены типа авторизации
         *      changeAuthForm: function(locations, cbSubmit, cbCancel)
         *      Компонент вызовет эту функцию при необходимости показа диалога авторизации. Функция должна создать
         *      диалог, заполнить список выбора типа авторизации из аргумента locations и привязать обработчики к кнопкам
         *      выбора и отмены. Список locations состоит из элементов вида
         *          {url: "...", type: "...", title: "..."}
         *      Вызовы обработчиков:
         *          cbSubmit(url, type)
         *          cbCancel()
         *      Если функция не задана, компонент использует собственный метод создания окна
         *  - функцию для закрытия окна смены типа авторизации
         *      closeChangeAuthForm: function(){}, ...}
         */
        logOff : function (settings) {
            if (settings == null) { settings = {}; }
            var sec_context = {
                targetSettings: settings,
                queryType: 'logOff'
            };
            if ( !isAuthorized && queryInProgress ) {
                queryQueue.push(sec_context);
            }
            else {
                queryInProgress = true;
                makeChangeAuthType(sec_context);
            }
        },

        /**
         * export запрос с проведением скрытой авторизации.
         * Параметры вызова полностью аналогичны параметрам $.ajax().
         * Дополнительно в settings можно указать:
         *  - функцию обратного вызова
         *      state: function (state, query, description)
         *      Компонент будет вызывать эту функцию при каждом старте и завершении запросов (целевого и авторизации)
         *  - функцию для формирования окна авторизации
         *      getLoginForm: function(cbSubmit, cbCancel, cbChangeAuth)
         *      Компонент вызовет эту функцию при необходимости показа диалога авторизации. Функция должна создать
         *      диалог и привязать обработчики к кнопкам авторизации, отмены и смены типа авторизации. Вызовы обработчиков:
         *          cbSubmit(login, password)
         *          cbCancel()
         *          cbChangeAuth()
         *      Если функция не задана, компонент использует собственный метод создания окна
         *  - функцию для закрытия окна авторизации
         *      closeLoginForm: function()
         *  - функцию для формирования окна смены типа авторизации
         *      changeAuthFormfunction(locations, cbSubmit, cbCancel), ...}
         *      Компонент вызовет эту функцию при необходимости показа диалога авторизации. Функция должна создать
         *      диалог, заполнить список выбора типа авторизации из аргумента locations и привязать обработчики к кнопкам
         *      выбора и отмены. Список locations состоит из элементов вида
         *          {url: "...", type: "..."}
         *      Вызовы обработчиков:
         *          cbSubmit(url, type)
         *          cbCancel()
         *      Если функция не задана, компонент использует собственный метод создания окна
         *  - функцию для закрытия окна смены типа авторизации
         *      changeAuthForm: function()
         */
        send : function (url, settings) {
            if (typeof (url) === 'string') {
                if (settings == null) { settings = {}; }
                settings.url = url;
            } else {
                settings = url;
            }
            // целевой запрос будем выполнять с внутренними коллбеками
            // конечные коллбеки будут вызываться только после анализа
            // объект sec_context будет передаваться через все AJAX вызовы в качестве контекста
            var sec_context = {
                targetSettings: settings,
                step: 'target1',
                queryType: 'send'
            };
            if ( !isAuthorized && queryInProgress ) {
                queryQueue.push(sec_context);
                makeStateCallback(sec_context, 'queue', settings.url, 'Целевой запрос');
            }
            else {
                queryInProgress = true;
                makeTargetCall(sec_context);
            }
        },

    };

    // Приватные методы

    function makeTargetCall(sec_context) {
        // выполняем целевой запрос по данным из sec_context
        if (sec_context.targetSettings.url) {
            var settings = clone(sec_context.targetSettings);
            settings.context = sec_context;
            makeStateCallback(sec_context, 'start', settings.url, 'Целевой запрос');
            makeAJAXCall(settings);
        } else {
            makeCallback(sec_context, false, null, 'empty request url', null);
        }
    }

    /**
     * конечный автомат разбора результатов внутренних запросов
     */
    // шаги авторизации, используемые при построении конечного автомата:
    // target1 - произведен 1-й целевой запрос
    // signin1 - сервер вернул требование авторизации, произведен запрос по указанному сервером адресу
    // target2 - произведен 2-й целевой запрос после авторизации
    // signoff1 - произведен запрос смены типа авторизации
    //
    // порядок прохождения доменной авторизации:
    // target1 - ответ с данными (авторизация уже была)
    // target1 - требуется авторизация - signin1 - ответ с успешной авторизацией - target2 - ответ с данными
    // target1 - требуется авторизация - signin1 - ответ с отказом авторизации (401) - signin1, запрос url из cookie ADAuthFailURI - ответ с требованием оконной авторизации
    //
    // порядок прохождения оконной авторизации:
    // target1 - ответ с данными (авторизация уже была)
    // target1 - требуется авторизация - signin1 - ответ с требованием оконной авторизации - окно запроса логина - signin1, передача пароля - ответ с успешной авторизацией - target2 - ответ с данными
    // target1 - требуется авторизация - signin1 - ответ с требованием оконной авторизации - окно запроса логина - signin1, передача пароля - ответ с отказом авторизации
    //
    // порядок прохождения смены авторизации:
    // signoff1 - ответ со списком ссылок для смены авторизации - окно выбора - signin1, запрос выбранного ресурса

    function onAJAXError(jqXHR, textStatus, errorThrown) {
        var sec_context = this;
        switch (sec_context.step) {
            case 'target1' :
            case 'target2' :
                //ошибка при доступе к целевому ресурсу
                makeStateCallback(sec_context, 'finish', 'target', 'Ошибка выполнения целевого запроса');
                makeCallback(sec_context, true, errorThrown + " [ошибка при доступе к запрошенному ресурсу]", textStatus, jqXHR);
                break;
            case 'signin1' :
                if (Number(jqXHR.status) === 401) {
                    // не удалось провести доменную авторизацию, переходим по указанному
                    // в cookie адресу (шаг не меняем, произойдет переход на оконную авторизацию
                    isAuthorized = false;
                    makeStateCallback(sec_context, 'finish', 'signin', 'Отказ доменной авторизации');
                    var settings = {
                        context: sec_context,
                        url: getCookie('ADAuthFailURI')
                    };
                    makeStateCallback(sec_context, 'start', settings.url, 'Переход на оконную авторизацию');
                    makeAJAXCall(settings);
                } else {
                    //ошибка при доступе к ресурсу авторизации
                    makeStateCallback(sec_context, 'finish', 'signin', 'Ошибка при доступе к ресурсу авторизации');
                    makeCallback(sec_context, true, errorThrown + " [ошибка при доступе к ресурсу авторизации]", textStatus, jqXHR);
                }
                break;
            case 'signoff1' :
                //ошибка при доступе к ресурсу смены типа авторизации
                makeStateCallback(sec_context, 'finish', 'signoff', 'Ошибка при доступе к ресурсу смены типа авторизации');
                makeCallback(sec_context, true, errorThrown + " [ошибка при доступе к ресурсу смены типа авторизации]", textStatus, jqXHR);
                break;
        }
    }

    function onAJAXSuccess(data, textStatus, jqXHR) {
        var sec_context = this;
        switch (sec_context.step) {
            case 'target1' :
                switch (checkAuthError(data)) {
                    case -1 :
                        //результирующий ответ
                        //isAuthorized = true; // XXX Igor 2017.03.28, 18:36 -- Без этого одновременные запросы отваливаются (первый проходит, второй -- нет)
                        makeStateCallback(sec_context, 'finish', 'target', 'Завершение целевого запроса');
                        makeCallback(sec_context, false, data, textStatus, jqXHR);
                        break;
                    case 0 :
                        //требуется авторизация
                        isAuthorized = false;
                        makeStateCallback(sec_context, 'finish', 'target', 'Отказ в доступе для целевого запроса');
                        sec_context.step = 'signin1';
                        var settings = {
                            context: sec_context,
                            url: data.location
                        };
                        makeStateCallback(sec_context, 'start', settings.url, 'Запрос на авторизацию');
                        makeAJAXCall(settings);
                        break;
                    case 1 :
                        //недостаточно прав
                        makeStateCallback(sec_context, 'finish', 'target', 'Недостаточно прав для выполнения целевого запроса');
                        makeCallback(sec_context, true, "недостаточно прав", textStatus, jqXHR);
                        break;
                }
                break;
            case 'signin1' :
                if (data && (typeof (data) === 'object') /*&& (data.result != null)*/ ) {
                    // получен JSON ответ
                    if (data.result) {
                        // авторизация (доменная, оконная) успешно завершена, необходимо отправить целевой запрос
                        makeStateCallback(sec_context, 'finish', 'signin', 'Авторизация завершена');
                        isAuthorized = true;
                        sec_context.step = 'target2';
                        if (sec_context.targetSettings.url) {
                            makeTargetCall(sec_context);
                        } else {
                            makeCallback(sec_context, false, data.description, 'empty request url', null);
                        }
                    }
                    else {
                        // должен быть ответ с требованием провести оконную авторизацию
                        isAuthorized = false;
                        // XXX 2017.04.29, 15:14 -- Нужно возвращать ошибки в случае получения списка ошибок `errorMessages`
                        if ((data.error === 'AuthError') && (data.errorMessages)) {
                            makeCallback(sec_context, true, data, textStatus, jqXHR);
                        }
                        else if ((data.error === 'AuthError') && (data.errorCode === 0) && (data.location)) {
                            // запрашиваем логин и пароль
                            makeStateCallback(sec_context, 'finish', 'signin', 'Запрос авторизации - необходимо ввести логин и пароль');
                            makeLoginForm(data.location, data.method, sec_context, data);
                        }
                        else {
                            // что-то не так
                            makeStateCallback(sec_context, 'finish', 'signin', 'Запрос авторизации - не удалось разобрать ответ');
                            makeCallback(sec_context, true,
                                'не удалось разобрать ответ ресурса авторизации (ожидалось требование оконной авторизации)',
                                textStatus, jqXHR);
                        }
                    }
                }
                else {
                    // что-то не так
                    isAuthorized = false;
                    makeStateCallback(sec_context, 'finish', 'signin', 'Запрос авторизации - неправильный тип ответа ресурса авторизации');
                    makeCallback(sec_context, true, 'неправильный тип ответа ресурса авторизации', textStatus, jqXHR);
                }
                break;
            case 'target2' :
                switch (checkAuthError(data)) {
                    case -1 :
                        //результирующий ответ
                        makeStateCallback(sec_context, 'finish', 'target', 'Завершение целевого запроса');
                        makeCallback(sec_context, false, data, textStatus, jqXHR);
                        break;
                    case 0 :
                        //требуется авторизация
                        isAuthorized = false;
                        makeStateCallback(sec_context, 'finish', 'target', 'Запрос авторизации - повторное требование авторизации');
                        makeCallback(sec_context, true, "ошибка - повторное требование авторизации", textStatus, jqXHR);
                        break;
                    case 1 :
                        //недостаточно прав
                        makeStateCallback(sec_context, 'finish', 'target', 'Недостаточно прав для выполнения целевого запроса');
                        makeCallback(sec_context, true, "недостаточно прав", textStatus, jqXHR);
                        break;
                }
                break;
            case 'signoff1' :
                isAuthorized = false;
                if (data && (typeof (data) === 'object') && (data.result != null)) {
                    // получен JSON ответ
                    if (data.result) {
                        // принят список ссылок на смену авторизации
                        makeStateCallback(sec_context, 'finish', 'signoff', 'Смена типа авторизации - принят список ссылок');
                        makeChangeAuthForm(data.locations, sec_context);
                    } else {
                        // что-то не так
                        makeStateCallback(sec_context, 'finish', 'signoff', 'Смена типа авторизации - получен отказ от ресурса смены типа авторизации');
                        makeCallback(sec_context, true, "получен отказ от ресурса смены типа авторизации", textStatus, jqXHR);
                    }
                } else {
                    // что-то не так
                    makeStateCallback(sec_context, 'finish', 'signoff', 'Смена типа авторизации - не удалось разобрать ответ ресурса смены типа авторизации');
                    makeCallback(sec_context, true, "не удалось разобрать ответ ресурса смены типа авторизации", textStatus, jqXHR);
                }
                break;
        }
    }

    /**
     * обычный AJAX запрос с добавлением заголовка element-token
     */
    function makeAJAXCall(settings) {
        // // XXX 2017.03.13, 16:56 -- Если dev-сервер, то доопределяем параметры для CORS-запроса...
        // if ( window.location.port === '8080' ) {
        //     // Доопределяем заголовки
        //     settings = $.extend({}, settings,
        //         {
        //             crossDomain : true,
        //             xhrFields : $.extend({ withCredentials: true }, settings.xhrFields),
        //             data : $.extend({ ajax: true }, settings.data),
        //         }
        //     );
        //     // Если url не содержит полный адрес (с http и доменом),
        //     // является абсолютным адресом (начинается с '/'),
        //     // домен -- локальный сервер (localhost),
        //     // то подставляем домен без номера порта (отладка)
        //     if ( settings.url
        //       && settings.url.indexOf('http://') === -1
        //       && settings.url.indexOf('/') === 0
        //       && ( parse = window.location.origin.match(/^(http:\/\/localhost):/) ) !== null ) {
        //         settings.url = parse[1] + settings.url;
        //     }
        // }
        // в любой запрос вставляем заголовок ElementToken
        var ElementToken = getCookie('ElementToken');
        if (ElementToken) {
            if (!settings.headers) { settings.headers = {}; }
            settings.headers['element-token'] = ElementToken;
        }
        settings.error = onAJAXError;
        settings.success = onAJAXSuccess;
        try {
            $.ajax(settings);
        }
        catch (e) {
            if (settings.error) {
                 settings.error(null, 'exception', e.toString());
            }
        }

    }

    /**
     * вызов коллбеков с привязкой контекста из первоначального вызова (завершение цепочки внутренних вызовов)
     */
    function makeCallback(sec_context, iserror, data, textStatus, jqXHR) {
        queryInProgress = false;
        var cb = iserror ? sec_context.targetSettings.error : sec_context.targetSettings.success;
        if (cb) {
            var targetContext = sec_context.targetSettings.context;
            if (targetContext == null) {
                targetContext = sec_context.targetSettings;
            }
            if (iserror) {
                cb.call(targetContext, jqXHR, textStatus, data);
            }
            else {
                cb.call(targetContext, data, textStatus, jqXHR);
            }
        }
        // Разгружаем очередь. Если не авторизованы - то по одному, иначе - все
        while ((queryQueue.length > 0) && (isAuthorized || (!queryInProgress))){
            var sc = queryQueue.shift();
            switch (sc.queryType){
                case 'send':
                    queryInProgress = true;
                    makeTargetCall(sc);
                    break;
                case 'logOff':
                    queryInProgress = true;
                    makeChangeAuthType(sc);
                    break;
            }
        }
    }

    /**
     * вызов коллбека изменения состояния запроса с привязкой контекста из первоначального вызова
     */
    function makeStateCallback(sec_context, state, query, description) {
        var cb = sec_context.targetSettings.state;
        if (cb) {
            var targetContext = sec_context.targetSettings.context;
            if (targetContext == null) {
                targetContext = sec_context.targetSettings;
            }
            cb.call(targetContext, state, query, description + ' [queue length = ' + queryQueue.length + ']');
        }
    }

    /**
     * Создает и выводит форму ввода логина и пароля. По окончании ввода вызывает указанный ресурс авторизации с
     * сохраненным контекстом запроса. При отказе от авторизации вызывает коллбек с соответствующей ошибкой. При
     * требовании смены авторизации производит вызов процедуры смены авторизации.
     * serverResponse - это JSON ответ сервера с требованием авторизации
     */
    function makeLoginForm(url, method, sec_context, serverResponse) {
        sec_context.authForm = {
            url: url,
            method: method
        };
        var cbs = onAuthSubmit.bind(sec_context);
        var cbc = onAuthCancel.bind(sec_context);
        var cba = onAuthChange.bind(sec_context);
        if (sec_context.targetSettings.getLoginForm) {
            sec_context.targetSettings.getLoginForm(cbs, cbc, cba, serverResponse);
        }
        else {
            sec_context.targetSettings.closeLoginForm = internalCloseLoginForm.bind(sec_context);
            internalGetLoginForm(cbs, cbc, cba, sec_context);
        }
    }

    function internalGetLoginForm(cbSubmit, cbCancel, cbChangeAuth, sec_context) {
        var auth_dialog = $('<div>').appendTo(document.body);
        sec_context.authForm.auth_dialog = auth_dialog; //для удаления формы
        auth_dialog.css({
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            'background-color': '#888',
            opacity: 0.8,
            'z-index': 60, // XXX 2017.03.14, 23:03 -- Показываем над всеми заставками
        });
        var auth_panel = $('<div>').appendTo(auth_dialog);
        auth_panel.css({
            width: '50%',
            height: '50%',
            'background-color': '#fff',
            position: 'relative',
            margin: 'auto',
            top: '25%',
            'text-align': 'center'
        });
        auth_panel.append('<h2>Требуется авторизация</h2>');
        var auth_table = $('<table width="100%">').appendTo(auth_panel);
        var auth_row1 = auth_table[0].insertRow(-1);
        var auth_row2 = auth_table[0].insertRow(-1);
        var cell = $(auth_row1.insertCell(-1));
        cell.text('Логин').css({
            'text-align': 'end',
            padding: '0.5em'
        });
        cell = $(auth_row1.insertCell(-1)).css({
            'text-align': 'left',
            padding: '0.5em'
        });
        var auth_login = $('<input name="auth_login">').css({
            width: '80%'
        }).appendTo(cell).keypress(onAuthKeyPress);
        auth_login[0].oninput = onAuthCheckBtns;
        auth_login[0].focus();
        cell = $(auth_row2.insertCell(-1));
        cell.text('Пароль').css({
            'text-align': 'end',
            padding: '0.5em'
        });
        cell = $(auth_row2.insertCell(-1)).css({
            'text-align': 'left',
            padding: '0.5em'
        });
        var auth_password = $('<input name="auth_password" type="password">').css({
            width: '80%'
        }).appendTo(cell).keypress(onAuthKeyPress);
        auth_password[0].oninput = onAuthCheckBtns;
        var auth_submit = $('<button name="auth_submit">').text('Авторизация').css({
            margin: '0.5em'
        }).click(function(e){
            var auth_panel = $(e.target).closest("div");
            var auth_login = auth_panel.find('[name=auth_login]');
            var auth_password = auth_panel.find('[name=auth_password]');
            cbSubmit(auth_login.val(), auth_password.val());
        }).appendTo(auth_panel);
        var auth_cancel = $('<button>').text('Отмена').css({
            margin: '0.5em'
        }).click(cbCancel).appendTo(auth_panel);
        var auth_change = $('<button>').text('Смена типа авторизации').css({
            margin: '0.5em'
        }).click(cbChangeAuth).appendTo(auth_panel);
        onAuthCheckBtns({target: auth_password[0]});
    }

    function internalCloseLoginForm() {
        var sec_context = this;
        sec_context.authForm.auth_dialog.remove();
    }

    function onAuthCheckBtns(e) {
        var auth_panel = $(e.target).closest('div');
        var auth_submit = auth_panel.find('[name=auth_submit]');
        var auth_login = auth_panel.find('[name=auth_login]');
        var auth_password = auth_panel.find('[name=auth_password]');
        auth_submit[0].disabled = (auth_login.val() === '') || (auth_password.val() === '');
    }

    function onAuthKeyPress(e) {
        var auth_panel = $(e.target).closest('div');
        var b = auth_panel.find('[name=auth_submit]');
        if ((!b[0].disabled) && (e.keyCode === 13)) {
            b.click();
        }
    }

    function onAuthSubmit(auth_login, auth_password) {
        var sec_context = this;
        sec_context.step = 'signin1';
        var settings = {
            context: sec_context,
            url: sec_context.authForm.url,
            type: sec_context.authForm.method,
            data: {
                username: auth_login,
                password: auth_password
            }
        };
        if (sec_context.targetSettings.closeLoginForm) {
             sec_context.targetSettings.closeLoginForm();
        }
        delete (sec_context.authForm);
        makeStateCallback(sec_context, 'start', settings.url, 'Передача логина и пароля');
        makeAJAXCall(settings);
    }

    function onAuthCancel(e) {
        var sec_context = this;
        if (sec_context.targetSettings.closeLoginForm) {
             sec_context.targetSettings.closeLoginForm();
        }
        delete (sec_context.authForm);
        makeCallback(sec_context, true, 'Авторизация отменена', 'canceled', null);
    }

    function onAuthChange(e) {
        var sec_context = this;
        if (sec_context.targetSettings.closeLoginForm) {
             sec_context.targetSettings.closeLoginForm();
        }
        delete (sec_context.authForm);
        makeChangeAuthType(sec_context);
    }

    function makeChangeAuthType(sec_context) {
        isAuthorized = false;
        var url = getCookie('ADAuthOKURI');
        url = url.replace('ADAuth', 'signoff');
        sec_context.step = 'signoff1';
        var settings = {
            context: sec_context,
            url: url
        };
        makeStateCallback(sec_context, 'start', url, 'Смена типа авторизации');
        makeAJAXCall(settings);
    }

    /**
     * Форма выбора типа авторизации. После выбора вызывает указанный ресурс авторизации с
     * сохраненным контекстом запроса.
     */
    function makeChangeAuthForm(locations, sec_context) {
        sec_context.authForm = {};
        var cbs = onSelectAuthType.bind(sec_context);
        var cbc = onCancelAuthType.bind(sec_context);
        // XXX 2017.03.14, 23:06 -- `changeAuthForm` с маленькой буквы
        if (sec_context.targetSettings.changeAuthForm) {
            sec_context.targetSettings.changeAuthForm(locations, cbs, cbc);
        }
        else {
            sec_context.targetSettings.closeChangeAuthForm = internalCloseChangeAuthForm.bind(sec_context);
            internalChangeAuthForm(locations, cbs, cbc, sec_context);
        }
    }

    function internalChangeAuthForm(locations, cbSubmit, cbCancel, sec_context) {
        var auth_dialog = $('<div>').appendTo(document.body);
        sec_context.authForm.auth_dialog = auth_dialog; //для удаления формы
        auth_dialog.css({
            position: 'fixed',
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            'background-color': '#888',
            opacity: 0.8,
            'z-index': 60, // XXX 2017.03.14, 23:03 -- Показываем над всеми заставками
        });
        var auth_panel = $('<div>').appendTo(auth_dialog);
        auth_panel.css({
            width: '50%',
            height: '50%',
            'background-color': '#fff',
            position: 'relative',
            margin: 'auto',
            top: '25%',
            'text-align': 'center'
        });
        auth_panel.append('<h2>Выбор типа авторизации</h2>');
        for (var key in locations) {
            var location = locations[key];
            var ref = $('<a>').appendTo(auth_panel);
            ref.attr({
                href: location.url,
                'data-auth-type': location.type
            }).text(location.title).click(cbSubmit, internalOnSelectAuthType);
            auth_panel.append('<br>');
        }
        auth_panel.append('<br>');
        var auth_cancel = $('<button>').text('Отмена').css({
            margin: 'auto'
        }).click(cbCancel).appendTo(auth_panel);
    }

    function internalOnSelectAuthType(e) {
        var cb = e.data;
        e.stopPropagation();
        e.preventDefault();
        var url = e.target.href;
        var AuthType = e.target.getAttribute('data-auth-type');
        cb(url, AuthType);
    }

    function internalCloseChangeAuthForm() {
        var sec_context = this;
        sec_context.authForm.auth_dialog.remove();
    }

    function onSelectAuthType(url, type) {
        var sec_context = this;
        var expires = (new Date()).getTime() + 3600 * 24 * 30 * 6 * 1000;
        setCookie('ElementAuthType', type, {
            'expires': expires,
            'path': '/'
        });
        sec_context.step = 'signin1';
        var settings = {
            context: sec_context,
            url: url
        };
        if (sec_context.targetSettings.closeChangeAuthForm) {
            sec_context.targetSettings.closeChangeAuthForm();
        }
        delete (sec_context.authForm);
        makeStateCallback(sec_context, 'start', settings.url, 'Смена типа авторизации');
        makeAJAXCall(settings);
    }

    function onCancelAuthType(e) {
        var sec_context = this;
        if (sec_context.targetSettings.closeChangeAuthForm) {
            sec_context.targetSettings.closeChangeAuthForm();
        }
        delete (sec_context.authForm);
        // XXX TODO: М.б., не выкидывать ошибку, а показывать снова форму авторизации?
        makeCallback(sec_context, true, 'Смена типа авторизации отменена', 'canceled', null);
    }

    /**
     * вспомогательные функции
     */
    function getCookie(name) {
        var matches = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
        return matches ? decodeURIComponent(matches[1]) : undefined;
    }

    function setCookie(name, value, options) {
        options = options || {};
        var expires = options.expires;
        if (typeof expires === 'number' && expires) {
            var d = new Date();
            d.setTime(d.getTime() + expires * 1000);
            expires = options.expires = d;
        }
        if (expires && expires.toUTCString) {
            options.expires = expires.toUTCString();
        }
        value = encodeURIComponent(value);
        var updatedCookie = name + '=' + value;
        for (var propName in options) {
            updatedCookie += '; ' + propName;
            var propValue = options[propName];
            if (propValue !== true) {
                updatedCookie += '=' + propValue;
            }
        }
        document.cookie = updatedCookie;
    }

    function clone(obj) {
        var r = {};
        for ( var key in obj ) {
            r[key] = obj[key];
        }
        return r;
    }

    function checkAuthError(data) {
        if ( typeof data === 'object' && data.error === 'AuthError' ) {
            return data.errorCode;
        }
        else {
            return -1;
        }
    }


    // Экспорт интерфейса

    // CommonJS
    if ( typeof module === 'object' && typeof module.exports === 'object' ) {
        module.exports.SecureAjax = SecureAjax;
    }
    // YModules
    else if ( typeof modules === 'object' ) {
        modules.define('SecureAjax', [], function(provide) { provide(SecureAjax); });
    }
    // global
    else {
        global.SecureAjax = SecureAjax;
    }

})(typeof window !== 'undefined' ? window : global || this);
