/* jshint camelcase: false */
/* jshint unused: false */
/* globals modules, app, window, applyCtx, content, applyNext, block, elem, attrs, def, tag, js, wrap */

/**
 *
 *  @overview Работа со списком КО.
 *  @author lilliputten <lilliputten@yandex.ru>
 *  @version 2016.08.12, 18:22
 *
*/

// modules.define('split_view', [ 'i-bem-dom', 'jquery', 'BEMHTML' ], function(provide, BEMDOM, $, BEMHTML)
modules.define('split_view',
[
    'i-bem-dom',
    // 'screenholder',
    // 'panelbox',
    'events__channels',
    'waiter',
    'store',
    'jquery',
],
function(provide,
    BEMDOM,
    // screenholder,
    // panelbox,
    channels,
    waiter,
    store,
    $,
__BASE) {

/**
 * @exports split_view
 * @class split_view
 * @bem
 */

// TODO: save hidden/normal state too (as split_bar pos)
// TODO: set default value for `split_view_pos` (diff for diff windows)

provide(BEMDOM.declBlock(this.name,  /** @lends split_view.prototype */ {

    animate_duartion : 500,

    /*{{{*/get_stored_pos : function (split_view) {

        var container_width = split_view.domElem.width();

        var pos = store.get(split_view.params.store_id+'split_view_pos');
        if ( typeof pos === 'undefined' ) {
            pos = Math.round( container_width / 2 ) + split_view._split_bar_offset; //default_pos;
        }

        return pos;
    },/*}}}*/
    /*{{{*/restore_width : function (split_view) {
        var pos = this.get_stored_pos(split_view);
        this.set_width_by_pos(split_view, pos);
    },/*}}}*/
    /*{{{*/correct_pos : function (split_view, pos) {

        var container_width = $(split_view.domElem).width();

        var left_stop = this.params.left_stop || 0;
        var right_stop = this.params.right_stop || 0;
        var left_margin = left_stop + split_view._split_bar_width;
        var right_margin = container_width - right_stop;

        if ( pos > right_margin ) {
            pos = right_margin;
        }
        if ( pos < left_margin ) {
            pos = left_margin;
        }

        return pos;
    },/*}}}*/
    /*{{{*/set_width_by_pos : function (split_view, pos) {
        // TODO: split_view object unique id?

        var container_width = $(split_view.domElem).width();

        var panel_left = split_view._elem('left');
        var panel_right = split_view._elem('right');

        pos = this.correct_pos(split_view, pos);
        // store.set('split_view_pos', pos);
        store.set(split_view.params.store_id+'split_view_pos', pos);
        panel_left.domElem.css({
            'width': pos,
        });
        panel_right.domElem.css({
            'margin-left': pos,
            'width': container_width - pos,
        });
    },/*}}}*/
    /*{{{*/calc_width_from_event : function (split_view, event) {

        var container_width = split_view.domElem.width();

        var panel_left = split_view._elem('left').domElem;

        var pos = event.pageX - panel_left.offset().left + split_view._split_bar_offset;
        if (pos > 0 && pos < container_width ) {
            this.set_width_by_pos(split_view, pos);
        }
    },/*}}}*/

    /*{{{*/hide_panel : function (split_view, id_hidden) {

        var id_maxxed = ( id_hidden === 'left' ) ? 'right': 'left';

        var hide_props = {
            'width': 0,
            'margin-left': 0,
            'opacity': 0,
        };
        if ( id_hidden === 'right' ) {
            hide_props.right = 0;
        }
        split_view._elem(id_hidden).domElem.animate(hide_props, this.animate_duration);
        split_view._elem(id_maxxed).domElem.animate({
            'width': '100%',
            'margin-left': 0,
        }, this.animate_duration);

    },/*}}}*/
    /*{{{*/unhide_panel : function (split_view) {

        var container_width = $(split_view.domElem).width();

        var pos = this.get_stored_pos(split_view);
        pos = this.correct_pos(split_view, pos);

        split_view._elem('left').domElem.animate({
            'width': pos,
            'opacity': 1,
        }, this.animate_duration);
        split_view._elem('right').domElem.animate({
            'width': container_width - pos,
            'margin-left': pos,
            'opacity': 1,
        }, this.animate_duration);

    },/*}}}*/

    /** ready ** {{{ Окончание подготовки контента (если был задан модификатор `readyWaiter`)
     */
    ready : function () {

        var split_view = this;

        split_view.screenholder && split_view.screenholder.ready();

        waiter.finish('split_view_loading');

    },/*}}}*/

    /** resize ** {{{ при изменении размеров экрана/страницы/внешнего блока
     * @param {number} set_height - Высота блока (если изменяется из panelbox)
     */
    resize : function (set_height) {

        var split_view = this,
            that = this,
            params = this.params,

            $this = $(this.domElem),
            height = set_height || $this.height(),

            panelbox_left = this._panelbox_left = this.findChildElem('left').findChildBlock(BEMDOM.entity('panelbox')),
            panelbox_right = this._panelbox_right = this.findChildElem('right').findChildBlock(BEMDOM.entity('panelbox')),

            undef
        ;

        panelbox_left.recalc_heights(true, height);
        panelbox_right.recalc_heights(true, height);

    },/*}}}*/

    /** _on_inited ** {{{ BEM инициализация
     */
    _on_inited : function () {

        var split_view = this,
            that = this,
            params = this.params,

            $this = $(this.domElem),

            split_bar = this._elem('split_bar'),
            panel_left = this._elem('left'),
            panel_right = this._elem('right'),

            undef
        ;

        params.store_id = params.id+'_';

        this._split_bar_width = split_bar.domElem.width();
        this._split_bar_offset = Math.round( this._split_bar_width / 2 );

        this._panelbox_left = this.findChildElem('left').findChildBlock(BEMDOM.entity('panelbox'));
        this._panelbox_right = this.findChildElem('right').findChildBlock(BEMDOM.entity('panelbox'));

        this.restore_width(this);
        channels('split_view').emit('layout_init');

        // this.bindTo( split_bar, 'mousedown', function(event, data) {
        // this._domEvents().on( split_bar, 'mousedown', function(event, data) {
        split_bar._domEvents().on( 'mousedown', function(event, data) {
            event.preventDefault();
            that.setMod('resizing', true);
        });
        // TODO: several different `split_view` objects on page?
        $(document).mouseup(function (event) {
            if ( that.getMod('resizing') ) {
                that.delMod('resizing');
            }
        });
        $(window).resize(function() {
            if ( !that.hasMod('hide') ) {
                that.restore_width(that);
            }
            channels('panelbox').emit('layout_resize');
        });

        $this.find('.button_hide_left').click( function () {
            that.setMod('hide', 'left');
        });
        $this.find('.button_hide_right').click( function () {
            that.setMod('hide', 'right');
        });
        $this.find('.button_unhide_left, .button_unhide_right').click( function () {
            that.delMod('hide');
        });

        // Безопасный способ находить скринхолдер (через jQuery.children -- не через findChildBlock)
        // this.screenholder = this.findChildBlock(screenholder);
        var screenholder_dom = $(this.domElem).children('.screenholder');
        this.screenholder = $(screenholder_dom).bem(BEMDOM.entity('screenholder'));

        // XXX 2016.08.08, 11:29 -- Убрать, переделать!
        if ( this.getMod('readyWaiter') ) {
            waiter.start('split_view_loading', {
                title : 'Подготовка экрана (split_view)',
            });
        }
        else {
            this.ready();
        }

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока.
         */
        js : {
            inited : function () {

                var split_view = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._on_inited();

            },
        },/*}}}*/

        /*{{{*/'resizing' : {
            true : function() {
                var split_view = this;
                $(document).mousemove(function (event) {
                    event.preventDefault();
                    split_view.calc_width_from_event(split_view, event);
                    channels('panelbox').emit('layout_resize');
                });

            },
            '' : function() {
                $(document).unbind('mousemove');
            },
        },/*}}}*/

        /*{{{*/'hide' : {

            'left' : function() { this.hide_panel(this, 'left'); },
            'right' : function() { this.hide_panel(this, 'right'); },
            '' : function() { this.unhide_panel(this); },

        },/*}}}*/

    },/*}}}*/

}));

});
