/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @module menu_nicescroll
 *  @overview Поле `menu` с модифицированным скроллбаром (`nicescroll`).
 *  @author lilliputten <lilliputten@yandex.ru>
 *  @since 2016.09.18, 17:30
 *  @version 2016.09.18, 17:30
 *
 *  @see {@link nicescroll}
 *
*/

modules.define('menu', [
        'nicescroll',
        'jquery',
    ],
    function(provide,
        nicescroll,
        $,
    Menu) {

/*
 * @exports
 * @class menu
 * @bem
 */
provide(Menu.declMod({ modName : 'nicescroll', modVal : true }, /** @lends menu_nicescroll.prototype */{

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        js : {

            inited : function() {

                this.__base.apply(this, arguments);

                var _nicescroll = nicescroll.init(this.domElem);

                this.nicescroll = _nicescroll; // this.domElem[0].nicescroll;

            }

        },

    },/*}}}*/

}));

});
