/**
 *
 * @module app.deps
 * @overview Зависимости приложения
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.03.30 14:44:08
 * @version 2017.04.13, 14:06
 *
 * $Date: 2017-07-10 16:21:20 +0300 (Mon, 10 Jul 2017) $
 * $Id: app.deps.js 8722 2017-07-10 13:21:20Z miheev $
 *
 * Всё, что используется динамическими страницами, должно быть перечислено здесь,
 * т.к. общие бандлы (App) теперь не собираются из всех других бандлов, как раньше SHARED,
 * а используется готовый App, за вычетом исключений в *repack* (см. `.enb/make.js`).
 *
*/

({
    mustDeps : [
        { block : 'i-bem' },
        { block : 'BEMHTML' },
        { block : 'loader', mods : { type : 'js' } },
        { block : 'i-bem', elem : 'dom', mods : { init : 'auto' } },
    ],
    shouldDeps : [

        /*{{{ Дополнения app... */

        { mods : [ 'NavMenu', 'controllers' ] },

        /*}}}*/

        /*{{{ Системный уровень... */
        { block : 'bootstrap-components' },
        { block : 'project' },
        { block : 'appholder' },
        /*}}}*/

        /*{{{ Импорт из bem-components... */

        { block : 'checkbox-group', mods : { theme : ['islands', 'simple'], type : ['button', 'line'] } },
        { block : 'select', mod: 'theme', val: 'islands', mods : { mode : ['radio', 'radio-check', 'check'] } },
        // { tech : 'bemhtml', block : 'input', mods : { type : ['textarea', 'password', 'search'], 'has-clear' : true } },
        { block : 'input', mods : { type : ['textarea', 'password', 'search'], theme : ['islands'], 'has-clear' : true } },
        { block : 'textarea', mods : { theme : ['islands'] } },
        // { block : 'input', mod: 'theme', val: 'islands', mods : { mode : ['radio', 'radio-check', 'check'] } },
        { block : 'radio-group', mods : { theme : ['islands', 'simple'], type : ['button', 'line'] } },
        { block : 'button', mods : { theme : 'islands', type : ['link'] } },

        /*}}}*/

        /*{{{ Модификации библиотечных блоков... */

        { block : 'ua' },

        { block : 'input', mods : { date : true } },
        { block : 'select', mods : { nicescroll : true, tree : true } },
        { block : 'menu', mods : { nicescroll : true, tree : true, popup : true } },
        // { block : 'menu', elem : 'item', mods : { tree : true } },
        { block : 'popup', mods : { menu : true } },
        { block : 'dropdown', mods : { switcher : true, opened : true, theme : 'islands' } },
        // { block : 'menu', mods : { nicescroll : true } },

        /*}}}*/

        /*{{{ Импорт из bem-core... */

        // { block : 'events' },
        { block : 'events', elem : 'channels' },
        { block : 'jquery' },
        { block : 'vow' },
        { block : 'uri', elem : 'querystring' },

        /*}}}*/

        /*{{{ Ключевые библиотеки... */

        { block : 'socket' },

        { block : 'session' },

        { block : 'requestor' },

        // { block : 'authorizer' }, // Удалить, когда будет закончен secureAjax

        /*}}}*/

        /*{{{ Vendor-Библиотеки... */

        { block : 'store' },
        { block : 'browserdetect' },

        { block : 'WordExport' },

        { block : 'fontawesome' },
        { block : 'themifyicons' },

        { block : 'datetimepicker' },

        { block : 'nicescroll' },
        { block : 'mousewheel' },

        /*}}}*/

        /*{{{ Разметка и дизайн... */

        { block : 'body' },
        { block : 'link' },
        { block : 'a' },
        { block : 'page_message' },

        /*}}}*/

        /*{{{ Разметка... */

        { block : 'NavMenu' },
        { block : 'NavHeader' },

        { block : 'vlayout' },

        /*}}}*/

        /*{{{ Специфичное для отдельных элементов */

        { block : 'box_group', mods : { type : 'ObjectsSelector' } },

        /*}}}*/

        /*{{{ Хелперы */

        { block : 'waiter' },
        { block : 'progressbar' },

        { block : 'datasets' },

        // { block : 'loader_indicator' },
        { block : 'screenholder' },

        { block : 'request_controller' }, // OBSOLETTE!

        { block : 'popup_dialog' },
        { block : 'popup_controller' },

        /*}}}*/

        /*{{{ Интерфейс */

        { block: 'box' },
        { block: 'boxset' },
        // Старые блоки интерфейса:
        { block: 'box_group' },
        // { block: 'box_actions' },
        { block: 'box_actions', mods : { filters : true } },
        { block: 'panelbox' },
        { block: 'split_view' },
        { block : 'boxing' },
        { block : 'boxing_sync' }, // Заглушка
        { block : 'boxing_curtain' },
        // { block : 'panelbox', mods : { selected : true } },
        { block : 'view_panel_tabs' },

        { block: 'box_columns_selector' },
        { block: 'ObjectsSelector' },

        /*}}}*/

        /*{{{ Данные... */
        { block : 'content_box' },
        { block : 'columns_selector' },
        { block : 'dataloader', mods : { src : [ 'local', 'servercolumns' ] } },
        { block : 'pager_controller' },
        // { block : 'table_view' },
        // { block : 'table_view', mods : { resizable : true, hoverable : true, checkable : true, selectable : true } },
        { block : 'tableview', mods : {
            // vpadded : true,
            vpadded : [ 'both', 'top', 'bottom' ],
            resizable : true,
            hoverable : true,
            checkable : true,
            selectable : true,
            // static : true,
            mode : [ 'static' ],
        } },

        // { block: 'object_filters' },

        /*}}}*/

        /*{{{ Разное... */

        { block : 'demo' },

        { block : 'test' },
        // { block : 'test2' },

        // Временно включаем для поддержки форм в fake-pages:

        { block : 'object_details' },

        // Эмулируем работу закладок для демо

        { block : 'tabswitch' },

        /*}}}*/
    ]
})
