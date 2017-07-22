/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, laxcomma:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module popup_dialog
 *
 * $Id: popup_dialog.js 8746 2017-07-13 17:12:11Z miheev $
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 *
 */
modules.define('popup_dialog', [
        'i-bem-dom',
        'ua',
        'dom',
        'events__channels',
        'button',
        'popup_controller',
        'nicescroll',
        'keyboard__codes',
        // 'store',
        'jquery'
    ],
    function(provide,
        BEMDOM,
        ua,
        dom,
        channels,
        Button,
        popup_controller,
        nicescroll,
        keyCodes,
        // store,
        $
    ) {

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10? 'keypress' : 'keydown',
    popupsStack = [];

/**
 * @exports popup_dialog
 * @class popup_dialog
 * @bem
 */

provide(BEMDOM.declBlock(this.name,  /** @lends popup_dialog.prototype */ {

    animate_open_time : 250,
    animate_close_time : 250,

    /*{{{*/onSetMod : {

        'js' : {
            'inited' : function () {
                this.initialize();
            },
        },

    },/*}}}*/

    /*{{{*/open : function () {

        var popup_dialog = this;

        popup_controller.stack.add(this);

        this.$.css({
            // 'pointer-events': 'auto',
            'opacity': 0,
        });
        popup_dialog.popup.setMod('visible', true);
        this.$.animate({
            opacity : 1,
        }, this.animate_open_time, function() {
        });

    },/*}}}*/

    /*{{{*/destroy : function () {

        var container = this._elem('container');

        container && BEMDOM.destruct(container.domElem);
        BEMDOM.destruct(this.domElem);

    },/*}}}*/

    /*{{{*/close : function (destroy) {
        var popup_dialog = this;
        var params = this.params;

        destroy = destroy || popup_dialog.getMod('autodestroy');

        popup_controller.stack.remove(this);

        if ( popup_dialog.popup.getMod('visible') ) {
            popup_dialog.$.animate({
                opacity : 0,
            }, this.animate_close_time, function() {
                // popup_dialog.emit_status_event(status);
                popup_dialog.popup.setMod('visible', false);
                if ( destroy === true ) {
                    popup_dialog.destroy();
                }
            });
        }
        else if ( destroy === true ) {
            popup_dialog.destroy();
        }

    },/*}}}*/

    /*{{{*/emit_status_event : function (status) {

        var popup_dialog = this;
        var params = this.params;

        params.status = status;

        var id = popup_dialog.params.id;

        if ( params.channel_id && params.event_id ) {
            channels(params.channel_id).emit(params.event_id, params);
            return true;
        }
        else if ( params.channel_id ) {
            channels(params.channel_id).emit(status, params);
            return true;
        }
        else if ( params.event_id ) {
            channels('popup_dialog').emit(params.event_id, params);
            return true;
        }

        return false;

    },/*}}}*/

    /*{{{*/ask_callback : function (id) {

        if ( typeof this.params.ask_callback === 'function' ) {
            return this.params.ask_callback(id, this);
        }

        return true;

    },/*}}}*/

    /*{{{*/actions : function () {

        var popup_dialog = this,
            that = this,
            params = this.params,

            popup = this._elem('popup'),
            $popup = $(popup.domElem),

            undef
        ;

        try {

            this.domElem.click( function (e) {
                var pos = $popup.position(),
                    width = $popup.outerWidth(),
                    height = $popup.outerHeight(),
                    x = e.clientX,
                    y = e.clientY,
                    undef
                ;
                pos.right = pos.left + width;
                pos.bottom = pos.top + height;

                var is_inside = ( x >= pos.left && x <= pos.right
                      && y >= pos.top && y <= pos.bottom );
                if ( !is_inside ) {
                    if ( popup_dialog.ask_callback('click_outside') || !popup_dialog.hasMod('noautoclose') ) {
                        popup_dialog.emit_status_event('click_outside');
                        popup_dialog.close();
                    }
                    return false;
                }

                return true;

            });
            var closeButtonElem = this._elem('close_button');
            closeButtonElem && this._domEvents(closeButtonElem.domElem).on('click', function (e) {
                if ( popup_dialog.ask_callback('close_button') || !popup_dialog.hasMod('noautoclose') ) {
                    popup_dialog.emit_status_event('close_button');
                    popup_dialog.close();
                }
                return false;
            }, this);
            var actionsContainerElem = popup_dialog._elem('actions_container');
            var actionButtons = actionsContainerElem.findChildBlocks(BEMDOM.entity('button'));
            actionButtons.size() && this._domEvents(actionButtons).on('click', function (e, data) {
                var button = e.bemTarget;
                var type = button.getMod('type');
                var id = button.params.id || button.getMod('id');
                id && popup_dialog.emit_status_event(id);
                if ( !id || ( typeof popup_dialog.params.ask_callback === 'function' && popup_dialog.params.ask_callback(id, popup_dialog) )
                    || ( type === 'button' && !popup_dialog.hasMod('noautobuttons') ) ) {
                    popup_dialog.close();
                }
                return false;
            }, this);

        }
        catch (error) {
            console.error( error );
            /*DEBUG*//*jshint -W087*/debugger;
        }

    },/*}}}*/

    /*{{{*/initialize : function() {

        var popup_dialog = this,
            params = this.params
        ;

        this.$ = $(this.domElem);

        // Инициализировать прокрутку, если устрановлен флаг?
        if ( !params.options || !params.options.no_nicescroll ) {
            nicescroll.init(this._elem('container'));
        }

        this.popup = $(this.domElem).bem(BEMDOM.entity('popup'));
        // this.popup.setMod('visible',true);

        this.actions();

    },/*}}}*/

}, /** @lends popup */{
    live : function() {
        BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
} ));

function onDocKeyPress(e) {/*{{{*/

    if ( e.keyCode === keyCodes.ESC &&
      // omit ESC in inputs, selects and etc.
      // popupsStack.length &&
      popup_controller.stack.count() &&
      !dom.isEditable($(e.target)) ) {
        var first_popup = popup_controller.stack.get(0);
        if ( first_popup && first_popup.ask_callback('close_by_escape') || !first_popup.hasMod('noautoclose') ) {
            first_popup.emit_status_event('close_by_escape');
            first_popup.close();
        }
    }
}/*}}}*/

});
