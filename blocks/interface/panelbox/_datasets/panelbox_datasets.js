/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module datasets
 * @overview datasets
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.30, 14:54
 * @version 2016.10.04, 13:46
 *
*/

modules.define('panelbox', [
        'i-bem-dom',
        'vow',
        'events__channels',
        'store',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        vow,
        channels,
        store,
        $,
        panelbox
    ) {

/**
 *
 * @class datasets
 * @classdesc panelbox с модификаторами `datasets`.
 *
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

/*
 * @exports
 * @class datasets
 * @bem
 */
provide(panelbox.declMod({ modName : 'datasets', modVal : true }, /** @lends datasets.prototype */{

    /** update_datasets() ** {{{ Обновить классы panelbox в соответствии с установленными datasets
     * @param {string[]} datasets_list - Значение для datasets. Массив строк вида ['TS','LS']
     */
    update_datasets : function (datasets_list) {

        var datasets = this,
            that = this,
            params = this.params,

            dom = this.domElem[0],
            className = dom.className.replace(/\bdataset\w*\b\s*/g, '')

        ;

        if ( Array.isArray(datasets_list) && datasets_list.length ) {
            className += ' dataset dataset_' + datasets_list.map(function(id){ return id; }).join(' dataset_');
        }

        dom.className = className;

        // panelbox!
        // channels(params.id).emit('layout_resize');

        this._emit('datasets_updated', {
            datasets_list : datasets_list,
        });

    },/*}}}*/

    /** init_datasets() ** {{{ Создаём стили для отработки показа полей по значению `dataset`
     * @param {object[]} datasets_dict - Словарь описания наборов данных `datasets`
     */
    init_datasets : function (datasets_dict) {

        var datasets = this,
            params = this.params,
            that = this,

            styles = ''
        ;

        params.datasets = datasets_dict || params.datasets;

        if ( !params.datasets ) {
            var error = 'datasets: Не заданы описания профилей данных (datasets)';
            app.error(error);
            console.error(error);
            /*DEBUG*//*jshint -W087*/debugger;
            return;
        }

        // Для быстрого доступа к словарю `datasets`...
        this._dataset_list = [];
        this._dataset_indices = {};
        this._dataset_values = {};
        this._dataset_indices_val = {};

        // Create dataset style rules
        styles += '.panelbox.dataset .dataset { display: none; }\n';
        this.params.datasets.map(function (dataset,i) {
            that._dataset_list.push(dataset.id);
            that._dataset_values[dataset.id] = dataset.val;
            that._dataset_indices[dataset.val] = dataset.id;
            that._dataset_indices_val[dataset.val] = i;
            styles += '.panelbox.dataset.dataset_' + dataset.id + ' .dataset.dataset_' + dataset.id + ' { display: block; }\n';
            styles += '.panelbox.dataset.dataset_' + dataset.id + ' .dataset.cell.dataset_' + dataset.id + ' { display: table-cell; }\n';
        });

        styles = $('<style>' + styles + '</style>');
        $('html > head').append(styles);

        this._emit('datasets_inited', {
            datasets_dict : datasets_dict,
        });

    },/*}}}*/

    /** _on_init() ** {{{ Инициализируем блок (автоматически).
     */
    _on_init : function() {

        var datasets = this,
            params = this.params;

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация системой.
         */
        js : {
            inited : function() {

                var datasets = this,
                    params = this.params;

                this.__base.apply(this, arguments);

                this._on_init();

            }
        },/*}}}*/

    },/*}}}*/

})); // provide

}); // module

