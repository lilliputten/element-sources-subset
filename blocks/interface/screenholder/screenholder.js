/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module screenholder
 * @overview screenholder
 * @author lilliputten <lilliputten@yandex.ru>
 * @version 2016.07.27, 17:24
 *
*/

modules.define('screenholder', [
        'i-bem-dom',
        // 'events__channels',
        // 'store',
        'nicescroll',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        // channels,
        // store,
        nicescroll,
        $
    ) {

/*
 *
 * @exports
 * @class screenholder
 * @bem
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends screenholder.prototype */ {

    _timeout : 1000,

    _show_callbacks : [],

    status : '',

    /*{{{ ** onSetMod... */
    /**
     *
     * События на установку модификаторов...
     *
     */
    onSetMod : {

        /*{{{ ** js:inited */
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
        },/*}}}*/

        /*{{{ ** ready... */
        /**
         *
         * Показываем готовность:
         * становимся прозрачными и не отсвечиваем,
         * сбрасываем сообщение об ошибке.
         *
         */
        'ready' : {
            true : function () {

                // // this.delMod('show');
                // this.setMod('show','none');
                // // this.set_error_text('');

            },
            false : function () {

                // this.delMod('show');
                this.set_error_text('');

            },
        },/*}}}*/

    },/*}}}*/

    is_ready : function () { return this.getMod('ready') || false; },
    is_error : function () { return this.getMod('show') === 'error'; },
    is_waiting : function () { return this.getMod('show') === 'spin'; },

    /** registerShowCallback ** {{{ */
    registerShowCallback : function (cb) {

        this._show_callbacks.push(cb);

    },/*}}}*/
    /** resolveShowCallbacks ** {{{ */
    resolveShowCallbacks : function () {

        var cb;
        while ( cb = this._show_callbacks.shift() ) {
            typeof cb === 'function' && cb(this);
        }
    },/*}}}*/

    /*{{{ ** show() */
    /**
     *
     */
   show : function (show) {

        var screenholder = this;

        show = show || 'spin';

        if ( this.getMod('show') === 'none' ) {
            screenholder.status = 'show:animation';
            $(screenholder.domElem).css({
                opacity : 0,
                // 'z-index' : -10,
                // 'pointer-events' : 'none',
            });
            screenholder.setMod('show', show );
            $(screenholder.domElem).stop().animate({
                opacity : 1,
                // 'z-index' : 10,
                // 'pointer-events' : 'auto',
            }, this._timeout, function () {
                screenholder.status = 'show:done';
                screenholder.resolveShowCallbacks();
            });
        }
        else {
            screenholder.setMod('show', show );
            screenholder.status = 'show:done';
            screenholder.resolveShowCallbacks();
        }

    },/*}}}*/
    /*{{{ ** hide() */
    /**
     *
     */
   hide : function (show, no_animation) {

        var screenholder = this,
            timeout = no_animation ? 0: this._timeout;

        show = show || 'none';

        if ( screenholder.getMod('show') !== 'none' ) {
            $(screenholder.domElem).stop().animate({
                opacity: 0,
                // 'z-index' : -10,
                // 'pointer-events' : 'none',
            }, this._timeout, function () {
                screenholder.setMod('show', show);
            });
        }
        else {
            screenholder.setMod('show', show);
        }

    },/*}}}*/
    /*{{{ ** waiting() */
    /**
     *
     * Режим ожидания.
     *
     */
   waiting : function () {

        var screenholder = this;

        screenholder.delMod('ready');
        screenholder.show();

    },/*}}}*/
    /*{{{ ** ready() */
    /**
     *
     * Нормальное состояние ("готовность системы") -- заставка скрыта.
     *
     */
   ready : function (no_animation) {

        var screenholder = this;

        screenholder.setMod('ready');
        screenholder.hide(null, no_animation);

    },/*}}}*/
    /** error ** {{{ Показываем ошибку.
     *
     * @param {String} error - Текст/объект сообщения.
     * @param {String} icon_class - Класс иконки значка ошибки.
     *
     * returns {DOM} - HTML контейнер сообщения
     *
     */
    error : function (error, icon_class) {

        var screenholder = this,
            errorHtml = app.error2html(error)
        ;

        screenholder.delMod('ready');

        // Текст сообщения
        var dom = screenholder.set_error_text(errorHtml);

        // Иконка
        icon_class = icon_class || 'icon fa fa-warning';
        if ( icon_class ) {
            icon_class.match(/\bicon\b/) || ( icon_class += ' icon' );
            $(screenholder.domElem).find('span.icon').attr('class',icon_class);
        }

        screenholder.show('error');

        return dom;

    },/*}}}*/
    /*{{{ ** set_error_text(...) */
    /**
     *
     * Устанавливаем текст сообщения об ошибке для режима mode:error.
     *
     * @param {String} text Текст сообщения.
     *
     * returns {DOM} - HTML контейнер сообщения
     *
     */
    set_error_text : function (text) {

        var dom = BEMDOM.update(this._elem('error_text').domElem, text);

        return dom;

    },/*}}}*/

    /*{{{ ** initialize() */
    /**
     *
     * Инициализируем блок.
     *
     */
    initialize : function() {

        /// Сохраняем ссылку на себя.
        var screenholder = this;

        this._nicescroll = nicescroll.init(this.domElem); // ???

    },/*}}}*/

} ));

});

