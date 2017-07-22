/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module progressbar
 * @overview Показ прогрессбара на странице.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.07.20 16:09
 * @version 2016.08.01, 16:08
 *
*/
modules.define('progressbar', [
        'i-bem-dom',
        // 'BEMHTML',
        // 'app',
        'button',
        'vow',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // BEMHTML,
        // app,
        Button,
        vow,
        $
    ) {

/*
 *
 * @exports
 * @class progressbar
 * @bem
 *
 */

/**
 *
 * @class progressbar
 * @classdesc Показ прогрессбара на странице.
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends progressbar.prototype */ {

    /*{{{ Данные... */

    // /** Минимальная ширина прогрессбара */
    // minimalWidth : 200,
    //
    // /** Время анимации полоски */
    // animateTimeout : 1000,

    /*}}}*/

    /** _getDefaultParams ** {{{ Параметры (`this.params`) по умолчанию
     */
    _getDefaultParams : function () {
        return {

            /** Минимальная ширина прогрессбара */
            minimalWidth : 200,

            /** Время анимации полоски */
            animateTimeout : 1000,

        };
    },/*}}}*/

    /** details_toggle() ** {{{ Спрятать/показать детализацию
     */details_toggle : function (delay) {

        if ( !this.hasMod('noDetails') ) {
            this._elem('details').domElem.slideToggle(delay || 250);
            this.toggleMod('expanded');
        }

    },/*}}}*/
    /** details_hide() ** {{{ Спрятать детализацию
     */details_hide : function (delay) {

        this._elem('details').domElem.slideUp(delay || 250);
        this.delMod('expanded');

    },/*}}}*/
    /** details_show() ** {{{ Показать детализацию
     */details_show : function (delay) {

        this._elem('details').domElem.slideDown(delay || 250);
        this.setMod('expanded');

    },/*}}}*/

    /*{{{ ** actions() */
    /**
     *
     * Действия пользователя и обработка событий.
     *
     */
    actions : function() {

        var progressbar = this;

        var progress_click = false;

        var toggleDetails = function () {
            progress_click = true;
            progressbar.details_toggle();
        };
        progressbar.progress.domElem.click(toggleDetails);
        var buttonBlock = progressbar.findChildBlock({ block : Button, modName : 'id', modVal : 'details_title_hide' });
        buttonBlock && buttonBlock._domEvents().on('click', toggleDetails);

        $('body').click( function (e) {
            if ( progress_click || !progressbar.getMod('expanded') ) {
                progress_click = false;
                return true;
            }
            var pos = progressbar.domElem.position();
            var pos2 = progressbar.details.domElem.position();
            var top = pos.top;
            var width = progressbar.details.domElem.outerWidth();
            var height = progressbar.details.domElem.outerHeight();
            var bottom = top + pos2.top + height;
            var is_inside = ( e.pageX >= pos.left && e.pageX <= pos.left + width
                  && e.pageY >= top && e.pageY <= bottom );

            if ( !is_inside ) {
                toggleDetails();
                return false;
            }
            return true;
        });

    },/*}}}*/

    /** initialize() {{{ Инициализируем блок. */
    initialize : function() {

        /// Сохраняем ссылку на себя.
        var progressbar = this;

        progressbar.progress = progressbar._elem('progress');
        progressbar.details = progressbar._elem('details');
        progressbar.progress_bar = progressbar._elem('progress_bar');

        progressbar.actions();

    },/*}}}*/

    /** set(percents, auto_deactivate) ** {{{ Установить прогрессбар в сортветствии с процентным значением.
     * @param {Number} percents - Количество процентов.
     * @param {Boolean} auto_deactivate - Сбрасывать ли прогрессбар, если `percents` >= 100.
     */
    set : function (percents, auto_deactivate) {

        var progressbar = this,
            params = this.params
        ;

        if ( progressbar.timeout ) {
            clearTimeout(progressbar.timeout);
            delete progressbar.timeout;
        }

        var is_active = true;
        var was_active = progressbar.progress.getMod('active');

        var last_width = progressbar.progress_bar.domElem.width();
        var max_width = progressbar._elem('progress_show').domElem.width();
        var set_width = Math.round(max_width * percents / 100);
        set_width = Math.max(params.minimalWidth, set_width);

        if ( is_active && !was_active ) {
            progressbar.activate();
        }

        if ( is_active ) {
            this.animatedNow = true;
            progressbar.progress_bar.domElem.stop().animate({
                width : set_width
            }, params.animateTimeout, function(){
                progressbar._emit('animationDone');
                progressbar.animatedNow = false;
                if ( percents >= 100 && auto_deactivate ) {
                    progressbar.deactivate();
                }
            });
        }

    },/*}}}*/

    /*{{{*/deactivate : function () {

        var progressbar = this;

        progressbar.delMod('active');
        progressbar.progress.setMod('done');
        progressbar.setMod('done');
        progressbar.progress.domElem.attr('title','');
        progressbar.timeout = setTimeout(function(){
            progressbar.progress.delMod('active');
            delete progressbar.timeout;
            progressbar.progress_bar.domElem.css('width', 0);
            setTimeout(function(){
                progressbar.delMod('done');
                progressbar.progress.delMod('done');
            },200);
            setTimeout(function(){
                progressbar.details_hide();
                progressbar._emit('deactivated');
            },400);
        }, 600);

    },/*}}}*/

    /*{{{*/activate : function () {

        var progressbar = this;

        if ( !this.hasMod('noDetails') ) {
            progressbar.progress.domElem.attr('title','Показать ожидаемые события');
        }
        progressbar.progress_bar.domElem.css('width', 0);
        progressbar.delMod('done');
        progressbar.setMod('active');
        progressbar.progress.delMod('done');
        progressbar.progress.setMod('active');

    },/*}}}*/

    /** add_details_item(id,options) ** {{{
     *
     * @param {String} id - Идентификатор задачи.
     * @param {Object} options - Параметры.
     *
     * См. описание опций в вызове метода {@link waiter#start}
     *
     */
    add_details_item : function (id, options) {

        var progressbar = this;

        // Создаем элемент для отображения информации о задаче
        var ctx = {
            block : 'progressbar',
            elem : 'details_item',
            id : id,
            options : options,
            // title : 'Отладка',
            // closable : true,
            // percent : '0%',
        };
        var html = BEMHTML.apply(ctx);
        var container = this._elem('details_container');
        var dom = BEMDOM.append(container.domElem, html);

        if ( typeof options.on_cancel === 'function' ) {
            Button._events().on(dom, 'click', function (e, data) {
                options.on_cancel();
            });
        }

    },/*}}}*/
    /** remove_details_item() ** {{{
     *
     * @param {String} id - Идентификатор задачи.
     *
     */
    remove_details_item : function (id) {

        var progressbar = this;

        var elem = this.findChildElem('details_item', 'id', id);

        BEMDOM.destruct(elem.domElem);

    },/*}}}*/
    /** update_details_item(id) ** {{{
     *
     * @param {String} id - Идентификатор задачи.
     * @param {Number} percents - Проценты завершения задачи.
     *
     */
    update_details_item : function (id, percents) {

        var progressbar = this;

        var elem = this.findChildElem('details_item_percents_text', 'id', id);
        BEMDOM.update(elem.domElem, percents+'%');

    },/*}}}*/

    /*{{{ ** onSetMod... */
    /**
     *
     * События на установку модификаторов...
     *
     */
    onSetMod : {

        /**
         *
         * Модификатор `js:inited` -- при инициализации блока
         * системой.
         *
         */
        'js' : {
            'inited' : function () {
                this.initialize();
            },
        },

    },/*}}}*/

} ));

});
