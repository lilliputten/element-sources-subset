/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, laxcomma:true */
/* globals modules, BEMHTML, app, project */
/**
 * @module menu__item_tree
 * @overview Элемент для иерархического меню.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.19, 15:55
 * @version 2017.05.30, 11:51
 *
 * $Date$
 * $Id$
 *
*/

modules.define('menu__item',
[
    'i-bem-dom',
    'next-tick',
    'project',
    'jquery',
], function(provide,
    BEMDOM,
    nextTick,
    project,
    $,
MenuItem) {

/**
 * @exports
 * @class menu__item
 * @bem
 */
provide(MenuItem.declMod({ modName : 'tree', modVal : true }, /** @lends menu__item.prototype */{

    /** _onPointerClick() ** {{{ Перехват метода обработки нажатия на элементе.
     */
    _onPointerClick : function() {
        if ( !this._isToggleClickInProgress ) {
            return this.__base.apply(this, arguments);
        }
    },/*}}}*/

    /** _onTogglePress() {{{ Клик на блоке раскрытия дерева.
     */
    _onTogglePress : function(e) {
        e.pointerType === 'mouse' && e.preventDefault(); // prevents button blur in most desktop browsers
        this._isToggleClickInProgress = true;
        // this.bindToDoc('pointerrelease', this._onToggleRelease);
        this._domEvents(BEMDOM.doc).on('pointerrelease', this._onToggleRelease);
        if ( this.hasMod('has_childs') ) {
            this.toggleMod('open');
            this._emit('tree_toggle', {
                source : 'tree_toggle',//'pointer',
                val : this.getVal(),
                open : this.getMod('open') || false,
            });
        }
    },/*}}}*/

    /** _onToggleRelease() ** {{{ Завершение клика на блоке раскрытия.
     */
    _onToggleRelease : function(e) {
        var that = this;
        nextTick(function() {
            that._isToggleClickInProgress = false;
            that._domEvents(BEMDOM.doc).un('pointerrelease', that._onToggleRelease);
        });
    },/*}}}*/

    /** _onToggleOver() ** {{{ Мышь входит в блок раскрытия дерева.
     */
    _onToggleOver : function() {
        this.setMod('tree_toggle_over');
        this._domEvents(BEMDOM.doc).on('pointerdown', this._onTogglePress);
    },/*}}}*/

    /** _onToggleLeave() ** {{{ Мышь покидает блок раскрытия дерева.
     */
    _onToggleLeave : function() {
        this.delMod('tree_toggle_over');
        this._domEvents(BEMDOM.doc).un('pointerdown', this._onTogglePress);
    },/*}}}*/

    // Модификаторы...

    /** beforeSetMod ** {{{ События перед установкой модификаторов... */
    beforeSetMod : {
        /** hovered ** {{{ Курсор над элементом...  */
        hovered : {
            'true' : function() {
                if ( this._isToggleClickInProgress ) {
                    return false;
                }
                return this.__base.apply(this, arguments);
            }
        }/*}}}*/
    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока */
        js : {

            inited : function() {

                this._isToggleClickInProgress = false;

                this.__base.apply(this, arguments);

                // this.bindTo('tree_toggle', 'pointerleave', this._onToggleLeave);
                this._domEvents(this._elem('tree_toggle')).on('pointerleave', this._onToggleLeave);
                this._domEvents(this._elem('tree_toggle')).on('pointerover', this._onToggleOver);

            }

        },/*}}}*/

    },/*}}}*/

}, /** @lends menu__item */{
    // lazyInit : true,
    // onInit : function() {
    //
    //     // this._domEvents().on('focusin', this.prototype._onFocus);
    //
    //     var ptp = this.prototype;
    //
    //     // this._domEvents(this.findChildElems('tree_toggle')).on('pointerover', ptp._onToggleOver);
    //
    //     return this.__base.apply(this, arguments);
    //
    // }
}));

});
