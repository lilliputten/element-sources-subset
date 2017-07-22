/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules */
/**
 *
 * @module project__config
 * @overview project__config
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * @since 2016.09.19, 14:12
 * @version 2017.05.03, 21:37
 *
 * $Date: 2017-07-18 13:08:08 +0300 (Tue, 18 Jul 2017) $
 * $Id: project__config.js 8778 2017-07-18 10:08:08Z miheev $
 *
 */

modules.define('project__config',
    [
        'objects',
        'project__root',
        'dateformatter',
    ], function(provide,
        objects,
        root,
        dateformatter,
    __BASE) {

var

    // Глобальный объект
    __global = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : typeof module !== 'undefined' ? module : this,

    MINEXT = root.DEBUG ? '' : '.min',

    /** USE_ENB_URLS ** {{{ Используем ссылки на ресурсы в стиле ENB
     *
     * Рекомендуется включать только для генерации страниц в standalone режиме, без nginx.
     *
     * TODO 2017.03.06, 22:28 -- Определять по окружению? Как можно определить, что на страница отдаётся через nginx?
     *
     * layout.html
     * -----------
     *
     *     (REAL) http://localhost/release/core/application/layout.html
     *
     *     (ENB) http://localhost:8080/pages/App/App.beauty.html
     *
     * css/browser.js/bemhtml.js пакеты
     * --------------------------------
     *
     *     (REAL) http://localhost/release/core/css/bem/SHARED.css
     *     (REAL) http://localhost/release/core/js/bem/SHARED.bemhtml.js
     *     (REAL) http://localhost/release/core/js/bem/SHARED.browser.js
     *
     *     (ENB) http://localhost:8080/pages/App/App.css
     *     (ENB) http://localhost:8080/pages/App/App.bemhtml.js
     *     (ENB) http://localhost:8080/pages/App/App.browser.js
     *
     * Библиотеки (на примере jquery)
     * ------------------------------
     *
     *     (REAL) http://localhost/release/core/libs/bem/jquery/dist/jquery.min.js
     *
     *     (ENB) http://localhost:8080/libs/jquery/dist/jquery.min.js
     *
     * Статика (eg logo.png)
     * ---------------------
     *
     *     (REAL) http://localhost/release/core/i/NavHeader/logo.png
     *
     *     (ENB) http://localhost:8080/core/i/NavHeader/logo.png
     *
     */
    USE_ENB_URLS = true && root.LOCAL_ENB && root.YENV !== 'inject' && !root.LOCAL_NGINX,
    /*}}}*/

    FAKE_DATA_PATH = '/fake-data/',
    FAKE_CORE_PATH = '/fake-core/', // XXX 2017.06.30, 12:12 ???
    USE_FAKE_DATA = true && ( root.LOCAL_ENB ),

    // Страница фреймворка приложения (SPA)
    appPage = 'App',

    // Переменные пути (?)
    rootUrl = USE_ENB_URLS ? '/' : '../', // '/WEB_TINTS/',
    coreUrl = USE_ENB_URLS ? '/' : '',
    assetsUrl = USE_ENB_URLS ? '/core/' : '',
    libsUrl = USE_ENB_URLS ? '/libs/' : coreUrl + 'libs/bem/',
    libsDevUrl = USE_ENB_URLS ? '/libs-dev/' : coreUrl + 'libs/bem/',
    fakeUrl = USE_ENB_URLS ? '/' : coreUrl + 'fake-data/',

    coreCssUrl = '../../',
    libsCssUrl = coreCssUrl + 'libs/bem/',
    blocksCssUrl = coreCssUrl + 'libs/bem-blocks-assets/',

    // NOTE: М.б., реализовать ещё тип пакет (`bem.json`?)
    bemjsonUrl = USE_ENB_URLS ? '/pages/{{pageId}}/{{pageId}}.json' : coreUrl + 'js/bemjson/',

    // ???
    appRootUrl = rootUrl, // USE_ENB_URLS && USE_FAKE_DATA ? FAKE_DATA_PATH : rootUrl,
    appCoreUrl = coreUrl, // USE_ENB_URLS && USE_FAKE_DATA ? FAKE_CORE_PATH : rootUrl+'core/',

    undef
;

var config = objects.extend(root, /** @lends project__config.prototype */{

    MINEXT : MINEXT,

    USE_ENB_URLS : USE_ENB_URLS,
    USE_FAKE_DATA : USE_FAKE_DATA,

    FAKE_DATA_PATH : FAKE_DATA_PATH,

    appPage : appPage,

    // Пути...

    rootUrl : rootUrl,
    coreUrl : coreUrl,
    assetsUrl : assetsUrl,
    libsUrl : libsUrl,
    libsDevUrl : libsDevUrl,
    bemjsonUrl : bemjsonUrl,
    bemjson : bemjsonUrl,
    approot : appRootUrl,
    appcore : appCoreUrl,

    coreCssUrl : coreCssUrl,
    libsCssUrl : libsCssUrl,
    blocksCssUrl : blocksCssUrl,

    jqueryLibPath : 'jquery/dist/',
    // jqueryLibPath : 'jquery-2.1.4/dist/',
    // jqueryLibPath : 'jquery-3.1.0/dist/',

    /** libs{} ** {{{ Библиотеки для загрузки через модули-загрузчики */
    libs : {
        jsrtf : {
            // deps : ['FileSaver'],
            js : '{{libsDevUrl}}jsrtf/dist/jsrtf'+MINEXT+'.js',
        },
        RTFReport : {
            deps : [ 'jsrtf' ],
            js : '{{libsDevUrl}}RTFReport/dist/RTFReport'+MINEXT+'.js',
        },
        themifyicons : {
            css : '{{libsUrl}}themify-icons/css/themify-icons.css',
        },
        fontawesome : {
            // css : 'https://maxcdn.bootstrapcdn.com/font-awesome/4.6.3/css/font-awesome.min.css',
            css : '{{libsUrl}}font-awesome/css/font-awesome.min.css',
        },
        socketio : {
            js :  '{{libsUrl}}socket.io-client/dist/socket.io'+MINEXT+'.js',
        },
        store : {
            js :  '{{libsUrl}}store.js/dist/store.modern.min.js',
        },
        // datetimepicker : {
        //     css : '{{libsUrl}}datetimepicker/build/jquery.datetimepicker.min.css',
        //     js : '{{libsUrl}}datetimepicker/build/jquery.datetimepicker.full.min.js',
        // },
        nicescroll : {
            // NOTE: Этот модуль требует патчинга. См. WEB_TINTS/_docs/BEM/!Patches/jquery.nicescroll/
            // NOTE: Старая версия:
            // js : '{{libsUrl}}jquery.nicescroll-3.6.8/jquery.nicescroll'+MINEXT+'.js',
            // Новая версия:
            js : '{{libsUrl}}jquery.nicescroll/jquery.nicescroll'+MINEXT+'.js',
            // Отладочная версия:
            // js : '{{libsUrl}}jquery.nicescroll/jquery.nicescroll.DEBUG.js',
        },
        mousewheel : {
            js : '{{libsUrl}}jquery-mousewheel/jquery.mousewheel'+MINEXT+'.js',
        },
        // Библиотека для сохранения pdf
        pdfmake : {
            js : [
                '{{libsUrl}}pdfmake/build/pdfmake'+MINEXT+'.js',
                '{{libsUrl}}pdfmake/build/vfs_fonts.js',
            ]
        },
        // Зависимость для WordExport
        FileSaver : {
            js : '{{libsUrl}}file-saver/FileSaver'+MINEXT+'.js',
        },
        // Используется для сохранения отчётов в Report
        WordExport : {
            js : '{{libsUrl}}jQuery-Word-Export/jquery.wordexport.js',
        },
        md5 : {
            js : '{{libsUrl}}jquery-md5/jquery.md5.js',
        },
        // resizable_columns : {
        //     js : '{{staticUrl}}js/bem-static/resizable-columns/resizable-columns.hacked.js',
        // },
        // pdfmake : {
        //     js :  [
        //         '{{libsUrl}}pdfmake/build/pdfmake.min.js',
        //         '{{libsUrl}}pdfmake/build/vfs_fonts.js',
        //     ],
        // },
        // bootstrap : {
        //     js : 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js',
        //     // js : '{{libsUrl}}bootstrap-stylus/js/bootstrap.js',
        // },
        // owlcarousel : {
        //     js : '{{libsUrl}}OwlCarousel2/dist/owl.carousel.min.js',
        //     css : [
        //         '{{libsUrl}}OwlCarousel2/dist/assets/owl.carousel.min.css',
        //         '{{libsUrl}}OwlCarousel2/dist/assets/owl.theme.default.min.css',
        //     ],
        // },
    },/*}}}*/

    /** (Отладочное) Использовать общую экранную заставку */
    useAppholder : true,

    /** Модификаторы app для автоматического подключения */
    appModules : {
        NavMenu : true,
        controllers : true,
    },

    /** Логотип проекта */
    prjLogo : '{{assetsUrl}}i/NavHeader/logo.png',
    /** Заголовок проекта */
    prjTitle : 'ВНУТРЕННИЕ ВОЙСКА МВД РОССИИ',
    /** Краткий заголовок проекта */
    prjTitleBrief : 'ВВ МВД РФ',
    /** Описание проекта */
    prjReference : 'АИС АСММ 14Ц884',
    /** Служебная информация проекта */
    prjCredits : '© 2017, АО «СОКБ «Вектор»',

    /** Имя cookie для авторизации */
    authCookieName : 'ElementToken',

    /** Адрес для запроса на обновление токена сессии */
    renew_session_url : '{{approot}}application/Auth/renewNodejsSession',

    /** Запрос параметров приложения */
    app_params_url : '{{approot}}application/Layout/get_AppParams_',

    /** Адрес для перенаправления на авторизацию (OBSOLETTE; адреса передаются только с сервера; удалить) */
    auth_url : '{{approot}}application/User/signin',

    /** Использовать secureAjax */
    useSecureAjax : true,

    /** Загружать пакеты как `.min` файлы */
    useMinifiedPackets : false,

    /** Строка пути, по которому лежат подготовленные данные для fake_server */
    fake_server_path : '/fake-data/',

    /** Путь запросов по умолчанию (Используется только в get_request_path?) */
    default_request_path : 'application/Layout/',

    /** Перехватывать ошибку соединения с сокетами. false: Игнорировать ошибку и продолжать работу. */
    catchSocketsError : false,

    /** Использовать ли сокеты для получения данных (в отчётах) */
    useSockets : true && !root.LOCAL_ENB && !root.LOCAL_NGINX,

    /** Максимально допустимое количество пакетов для приёма в отчётах (асинхронная передача) */
    maxReportPackets : 1000,

    /** Показывать отчёт, составленный из частично загруженных данных в случае отмены загрузки пользователем */
    showCanceledReport : true,

    /** Кол-во милисекунд в сутках (для расчётов) */
    datetime_day : 1000*60*60*24,

    /** {object} dateformatter_options ** {{{ Опции для dateformatter по умолчанию
     */
    dateformatter_options : {
        dateSettings : {
            days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
            daysShort: [ 'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб' ],
            months: [
                'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль',
                'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
            ],
            monthsShort: [
                'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл',
                'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
            ],
        },
    },/*}}}*/

    /** formats{} ** {{{ Форматы основных типов данных */
    formats : {

        /** Общий формат даты/времени
         * @see {@link http://php.net/manual/en/function.date.php}
         * Eg:
         *  'H:m:s d.m.Y', // 16:32:27 18.07.2016
         *  'Y.m.d H:i:s', // 2016.09.15 16:32:27
         * DateFormatter usage examples:
         *  project.helpers.dateformatter.formatDate(new Date(), 'Y.m.d H:i:s')
         *  project.helpers.dateformatter.parseDate('2016.09.14', 'Y.m.d')
         */
        date : 'd.m.Y',
        datetime : 'd.m.Y H:i',
        time : 'H:i:s',
        duration : 'DD Hч. iм. sс.', // ???

        zeroDurationString : '(нет)',

    },/*}}}*/

    /** requests{} ** {{{ Параметры общих запросов (OBSOLETE?)
     *
     * @see project_config:get_remote_url()
     * @see project_config:get_remote_method()
     *
     */
    requests : {

        app_params : {
            url : 'get_AppParams_',
            // path : '/application/Layout/',
        },

        app_load_dicts_queue : {
            url : 'get_DictsQueue_',
            // path : '/application/Layout/',
        },

        objects_list_fetch_dict : {
            url : 'get_ControlObjects_Dict_',
            path : '/element-tcm/TCMAdministration/',
        },

        object_details_datadef : {
            url : 'get_ControlObjectDetails_Datadef_',
            path : '/element-tcm/TCMAdministration/',
        },

        objects_list_delete : {
            url : 'post_ControlObjectDetails_Delete_',
            path : '/element-tcm/TCMAdministration/',
            method : 'POST',
        },

        object_details_save : {
            url : 'post_ControlObjectDetails_Save_',
            path : '/element-tcm/TCMAdministration/',
            method : 'POST',
        },

        object_details_object_data : {
            url : 'get_ControlObjectDetails_ObjectData_',
            path : '/element-tcm/TCMAdministration/',
        },

        objects_list_fetch_columns : {
            url : 'get_ControlObjects_DataColumns_',
            path : '/element-tcm/TCMAdministration/',
        },

        // objects_list_fetch_initial_columns : {
        //     url : 'get_ControlObjects_DataColumns_',
        //     path : '/element-tcm/TCMAdministration/',
        // },

        objects_list_fetch_initial_data : {
            url : 'get_ControlObjects_InitialData_',
            path : '/element-tcm/TCMAdministration/',
        },

    },/*}}}*/

    /** buttons_data{} ** {{{ Параметры кнопок по умолчанию
     */
    buttons_data : {
        yes: {
            title: 'Да',
            // hint: 'Подтвердить',
            icon: 'ti ti-check',
        },
        no: {
            title: 'Нет',
            // hint: 'Нет',
            icon: 'ti ti-close',
        },
        apply: {
            title: 'Применить',
            hint: 'Применить',
            icon: 'ti ti-check',
        },
        ok: {
            title: 'Ок',
            hint: 'Подтвердить',
            icon: 'ti ti-check',
        },
        target_selected_object: {
            title: 'Показать',
            hint: 'Показать выбранный объект',
            icon: 'ti ti-target',
        },
        reset_value: {
            title: 'Сбросить',
            hint: 'Сбросить текущее значение',
            icon: 'ti ti-na',
        },
        append_object: {
            title: 'Добавить',
            hint: 'Добавить объект',
            icon: 'ti ti-plus',
        },
        accept: {
            title: 'Выбрать',
            hint: 'Выбрать',
            icon: 'ti ti-check',
        },
        select_all: {
            title: 'Выделить все',
            hint: 'Выделить все объекты',
            icon: 'fa fa-circle',
        },
        select_none: {
            title: 'Снять выделение',
            hint: 'Отменить всё выделение',
            icon: 'fa fa-circle-o',
        },
        print: {
            title: 'Печатать',
            hint: 'Печатать',
            icon: 'ti ti-printer',
        },
        save: {
            title: 'Сохранить',
            hint: 'Сохранить',
            icon: 'ti ti-save',
        },
        cancel: {
            title: 'Отменить',
            hint: 'Отменить изменения',
            icon: 'ti ti-close',
        },
        close: {
            title: 'Закрыть',
            hint: 'Закрыть окно',
            icon: 'ti ti-close',
        },
        // options: {
        //     title: 'Настройки',
        //     hint: 'Настройки параметров панели',
        //     icon: 'fa fa-cog',
        // },
        refresh: {
            title: 'Обновить',
            hint: 'Обновить все данные',
            icon: 'ti ti-reload',
        },
        edit: {
            title: 'Изменить',
            hint: 'Редактировать данные для выбранного объекта',
            icon: 'ti ti-pencil',
        },
        edit_object: {
            title: 'Изменить',
            hint: 'Редактировать данные для выбранного объекта',
            icon: 'ti ti-pencil',
        },
        delete_selected: {
            title: 'Удалить выделенное',
            hint: 'Удалить выделенные объекты',
            icon: 'ti ti-trash',
        },
        delete_object: {
            title: 'Удалить',
            hint: 'Удалить объект',
            icon: 'ti ti-trash',
        },
        delete: {
            title: 'Удалить',
            hint: 'Удалить',
            icon: 'ti ti-trash',
        },
        hide_left: {
            title: 'Спрятать',
            hint: 'Спрятать панель',
            icon: 'ti ti-angle-left',
        },
        unhide_left: {
            title: 'Показать',
            hint: 'Показать панель',
            icon: 'ti ti-angle-right',
        },
        hide_right: {
            title: 'Спрятать',
            hint: 'Спрятать панель',
            icon: 'ti ti-angle-right',
        },
        unhide_right: {
            title: 'Показать',
            hint: 'Показать панель',
            icon: 'ti ti-angle-left',
        },
        prev_page: {
            title: 'Предыдущая',
            hint: 'На страницу назад',// (Ctrl ←)',
            icon: 'fa fa-angle-left',
        },
        next_page: {
            title: 'Следующая',
            hint: 'На страницу вперёд',// (Ctrl →)',
            icon: 'fa fa-angle-right',
        },
    },/*}}}*/

});

provide(config);

});


