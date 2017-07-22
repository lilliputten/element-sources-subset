/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module tableview_mode_static
 * @overview __INFO__
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.05.22 14:21:44
 * @version 2017.05.22 14:21:44
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: tableview_mode_static.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */

modules.define('tableview', [
        'i-bem-dom',
        'vow',
        'project',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        vow,
        project,
        $,
    tableview) {

/**
 *
 * @exports
 * @class tableview_mode_static
 * @bem
 * @classdesc __INFO__
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

var tableview_mode_static = /** @lends tableview_mode_static.prototype */ {

    /** getColumns ** {{{ */
    getColumns : function () {
        var columns = this._columns_list || this._elem('headrow').findChildElems('headcell').map(function(cell,n){
            var
                id = cell.params.id, // column && column.getMod('id'),
                isShow = cell.domElem.hasClass('show'),
                dom = cell.domElem.find('.title')
            ;
            if ( !dom || !dom.length ) { dom = cell.domElem; }
            return {
                id : id,
                title : dom.html(),
                show : isShow,
            };
        });
        return columns;
    },/*}}}*/

    /** exportData ** {{{
     * @param {Object} [conditions] - Усовия экспорта (вида { print : true, ... })
     * @param {Object[]} [columns] - Описание колонок для экспорта. Если не заданы, собираем из существущего html-кода.
     * @param {Boolean} [onlyVisible=true] - Если колонки не заданы, то из таблицы выбираем только видимые колонки
     */
    exportData : function (conditions, columns, onlyVisible) {

        // Если передан onlyVisible без columns
        if ( typeof columns === 'boolean' && arguments.length === 2 ) {
            onlyVisible = columns;
            columns = undefined;
        }

        typeof onlyVisible === 'boolean' || ( onlyVisible = true );

        columns = Array.isArray(columns) ? columns : this.getColumns();

        var tableview = this,
            params = this.params,
            that = this,

            bodyrows = this.findChildElems('bodyrow'),

            rowsData = bodyrows.reduce(function(rowsData, row, row_no){
                rowsData.push(row.findChildElems('bodycell')
                    .filter(function(cell,n){
                        return !onlyVisible || columns[n].show;
                    })
                    .map(function(cell,n){
                        return cell.domElem.html();
                    }))
                ;
                return rowsData;
            }, []),

            columnsData = columns
                .filter(function(column){
                    return !onlyVisible || column.show;
                })
                .map(function(column){
                    return column.title;
                })

        ;

        return {
            columns : columnsData,
            rows : rowsData,
        };

    },/*}}}*/

    /** _create_content ** {{{ Нулевая функция обновления таблицы (для статики не нужно) */
    _create_content : function () {

        var tableview_mode_static = this,
            params = this.params
        ;

    },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок */
    onInited : function () {

        var tableview_mode_static = this,
            that = this,
            params = this.params,
            undef
        ;

        this.__base.apply(this, arguments);

        this.initialize();

        this._update_data();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока */
        js : {

            inited : function () {

                this.onInited();

            }

        },/*}}}*/

    },/*}}}*/

};

provide(tableview.declMod({ modName : 'mode', modVal : 'static' }, tableview_mode_static)); // provide

}); // module


