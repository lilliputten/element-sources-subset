/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @module select_nicescroll
 * @overview Поле `select` с модифицированным скроллбаром (`nicescroll`).
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.18, 17:30
 * @version 2016.09.18, 17:30
 *
 * @see {@link nicescroll}
 *
 * XXX 2017.07.18, 12:32 -- НЕ ИСПОЛЬЗУЕТСЯ?
 *
*/

modules.define('select', [
        'nicescroll',
        'jquery',
        'menu',
    ],
    function(provide,
        nicescroll,
        $,
        Menu,
    Select) {


/*
 * @exports
 * @class select
 * @bem
 */
provide(Select.declMod({ modName : 'nicescroll', modVal : true }, /** @lends select_nicescroll.prototype */{

    // /** onSetMod... ** {{{ События на установку модификаторов...
    //  * @method
    //  */
    // onSetMod : {
    //     js : {
    //         inited : function() {
    //             this.__base.apply(this, arguments);
    //             var menu = this._menu;
    //             /*{{{ OLD WEIRD CODE
    //             // NOTE: См. установку mod:nicescroll для вложенного `menu` в BEMHTML
    //             if ( menu && menu.domElem && menu.domElem[0] ) {
    //                 // Дублируем инициализацию nicescroll (bemhtml select не пропускает mod:nicescroll:true в menu).
    //                 if ( !menu.nicescroll ) {
    //                     nicescroll.init(menu.domElem);
    //                     this.nicescroll = menu.nicescroll = menu.domElem[0].nicescroll;
    //                 }
    //                 if ( !menu.hasMod('nicescroll') ) {
    //                     menu.setMod('nicescroll', true);
    //                 }
    //             }
    //             OLD WEIRD CODE }}}*/
    //         },
    //     },
    // },/*}}}*/

}));

});
