/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, laxcomma:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module menu_tree
 * @overview Поле `menu` с поддержкой иерархичекской организации данных (`tree`).
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.20, 13:57
 * @version 2016.09.20, 13:57
 *
 * @see {@link menu}
 * @see project/libs/bem-components/common.blocks/menu
 * @see project/libs/bem-components/common.blocks/menu/menu.js
 *
*/

// modules.define('menu', function(provide, Menu) {
modules.define('menu', [
        'i-bem-dom',
        // 'events__channels',
        // 'store',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        // channels,
        // store,
        $,
        Menu
    ) {


/*
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.declMod({ modName : 'tree', modVal : true }, /** @lends menu_tree.prototype */{

    /** Время анимации показа/скрытия поддерва */
    default_toggle_duration : 150,

    /** _onTreeToggle() ** {{{ Событие от menu__item -- открытие/закрытие поддерева элемента.
     * @param {Object} data - Данные от элемента, включая идентификатор узла поддерева.
     */
    _onTreeToggle : function (e, data) {

        var that = this,
            val = data.val,
            open = data.open,
            subtree = this._elem({ elem : 'subtree', modName : 'parent', modVal : val }),
            duration = /* this.params('toggle_duration') || */ this.default_toggle_duration;

        that.setMod('resizing');
        subtree && subtree.domElem.slideToggle(duration, function () {
            that.toggleMod(subtree, 'close');
            that.delMod('resizing');
        });

        this.__base.apply(this, arguments);

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        js : {

            inited : function() {
                this.__base.apply(this, arguments);
                this._events(this.findChildElems('item')).on('tree_toggle', this._onTreeToggle);
            }

        },

    },/*}}}*/

}, /** @lends menu */{

    /** live() {{{ Lazy-инициализация. */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //     // this.liveInitOnBlockInsideEvent('tree_toggle', 'menu__item', ptp._onTreeToggle); // TODO: menu__item???
    //
    //     return this.__base.apply(this, arguments);
    // }/*}}}*/

}));

});

