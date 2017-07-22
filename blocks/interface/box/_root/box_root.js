/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module box_root
 * @overview Верхний уровень вложенности контейнеров (управляющий контейнер)
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.07.18 14:23:55
 * @version 2017.07.18 14:23:55
 *
 * $Date: 2017-07-21 22:01:17 +0300 (Fri, 21 Jul 2017) $
 * $Id: box_root.js 8794 2017-07-21 19:01:17Z miheev $
 *
 */

modules.define('box', [
        'i-bem-dom',
        'vow',
        'project',
        'functions__throttle',
        // 'functions__debounce',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        vow,
        project,
        throttle,
        // debounce,
        $,
    box) {

/**
 *
 * @exports
 * @class box_root
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

/**
 * @exports
 * @class box_root
 * @bem
 *
 */
var box_root = /** @lends box_root.prototype */ {

    /** onWindowResize ** {{{ */
    onWindowResize : function (e) {

        var waitingForChanges = this.waitingForChanges();
        var changing = this.getMod('changing');

        if ( this._resizingNow || waitingForChanges || changing ) {
            if ( this._resizeTimer ) {
                clearTimeout(this._resizeTimer);
            }
            this._resizeTimer = setTimeout(this._onWindowResize, 100);
            return;
        }

        if ( !this._resizingNow ) {
            this._resizingNow = true;

            if ( this._resizeTimer ) {
                clearTimeout(this._resizeTimer);
                delete this._resizeTimer;
            }

            // console.log('box_root:onWindowResize:start');
            var updatePromise = this.updateAllChilds({
                // onlySameLayout : true,
                noAnimation : true,
            });

            updatePromise
                .then(function(changesInfo){
                    this._emit('updatedOnWindowResize', { changesInfo : changesInfo });
                    // console.log('box_root:onWindowResize:end', data);
                    // debugger;
                }, this)
            ;

            delete this._resizingNow;
        }

    },/*}}}*/

    /** onInited() ** {{{ Инициализация блока */
    onInited : function () {

        var box_root = this,
            params = this.params
        ;

        console.log('box_root onInited');

        // Инициализация блока-родителя
        this.__base.apply(this, arguments);

        // Событие на изменение размера окна
        this._onWindowResize = throttle(this.onWindowResize, 50, this);
        this._domEvents(BEMDOM.win)
            .on('resize', this._onWindowResize)
        ;

        // Первичное обновление всех вложенных секций
        // DEBUG!
        console.log('box_root before updatePromise');
        this.initPromise = vow.delay(null, 1000)
        .then(function(){
            console.log('box_root in this.initPromise');
            return this.updateAllChilds({
                // onlySameLayout : true,
                noAnimation : true,
                updateFixed : true,
            });
        }, this);

        this.initPromise
            .then(function(changesInfo){
                console.log('box_root updatedOnInit event!');
                this._emit('updatedOnInit', { changesInfo : changesInfo });
            }, this)
        ;

        return this.initPromise; // ???

    },/*}}}*/

};

provide(box.declMod({ modName : 'root', modVal : true }, box_root)); // provide

}); // module
