/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @module vlayout
 * @overview vlayout
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.12 14:40
 * @version 2016.09.12 14:40
 *
*/

modules.define('vlayout', [
        // 'i-bem',
        'i-bem-dom',
        'events__channels',
        // 'store',
        'objects',
        'jquery',
    ],
    function(provide,
        // BEM,
        BEMDOM,
        channels,
        // store,
        objects,
        $,
    __BASE) {

/*
 *
 * @exports
 * @class vlayout
 * @bem
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends vlayout.prototype */ {

    resizingNow : 0,

    /** recalc_heights ** {{{ Перерасчитывем высоты блоков
     *
     */
    recalc_heights : function () {

        if ( this.resizingNow ) { return; }

        this.resizingNow++;

        var vlayout = this;

        // Находим изменяемые элементы
        var flexItems = this.findChildElems({ elem : 'item', modName : 'flex', modVal : true });
        if ( !flexItems._entities || !flexItems._entities.length ) { this.resizingNow--; return; }

        var totalHeight = this.domElem.height();
        var totalFixedHeight = 0;

        var fixedItems = this.findChildElems({ elem : 'item', modName : 'fixed', modVal : true });
        fixedItems.map(function(elem){
            var height = elem.domElem.outerHeight();
            totalFixedHeight += height;
        });

        // Рассчитываем высоту зоны для изменяемых элементов
        var flexHeight = totalHeight - totalFixedHeight;

        // Взломано (временно?) для работы с одним абсолютным флекс-элементом
        // -- с целью обеспечения работы в мобильных эмуляторах. 2016.08.12, 13:38
        // ПЕРЕДЕЛАТЬ!!!
        flexItems.map(function(elem){
            var height = flexHeight;
            elem.domElem.css({
                top: totalFixedHeight, // ??? Изменяемый элемент -- последний??? Переделать!
            });
        });

        this.resizingNow--;

    },/*}}}*/

    /** update() ** {{{ Обновляем состояние всех блоков.
     *
     * TODO: Возможно, вызывать обновление для всех вложенных блоков (исключать
     * случай реакции на событие `resize` -- только для принудтельных вызовов.
     *
     */
    update : function() {

        var vlayout = this;

        this.recalc_heights();

    },/*}}}*/

    /** initialize() ** {{{ Инициализируем блок.
     *
     */
    initialize : function() {

        var vlayout = this;

        // Перехватываем клик на кнопке вида шапки, чтобы изменить размер рабочей области (для "внешней" шапки)
        $('a#header_toggler').click(function() {
            setTimeout(function(){
                vlayout.update();
            }, 20);
        });
        // app.register_channel_event('header', 'layout_resize', function (e, data) {
        channels('header').on('layout_resize', function _vlayout_resize_event_cb (e, data)  {
            vlayout.update();
            channels('panelbox').emit('layout_resize');
        });
        $(window).resize(function() {
            vlayout.update();
        });
        vlayout.update();

    },/*}}}*/

    /*{{{ ** onSetMod... */
    /**
     *
     * События на установку модификаторов...
     * @method
     *
     */
    onSetMod : {

        /*{{{ ** js:inited */
        /**
         *
         * Модификатор `js:inited` -- при инициализации блока системой.
         *
         */
        'js' : {
            'inited' : function () {
                this.initialize();
            },
        },/*}}}*/

    },/*}}}*/

},

{ live : true }

));

});
