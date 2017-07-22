/**
 * @module popup
 */

modules.define(
    'popup',
    ['jquery', 'i-bem__dom', 'ua', 'dom', 'keyboard__codes'],
    function(provide, $, BEMDOM, ua, dom, keyCodes, Popup) {

var KEYDOWN_EVENT = ua.opera && ua.version < 12.10? 'keypress' : 'keydown',
    visiblePopupsStack = [];

/**
 * @exports
 * @class popup
 * @bem
 */
provide(Popup.decl({ modName : 'autoclosable', modVal : true }, /** @lends popup.prototype */{
    onSetMod : {
        'visible' : {
            'true' : function() {
                visiblePopupsStack.unshift(this);
                this
                    // NOTE: nextTick because of event bubbling to document
                    .nextTick(function() {
                        this.bindToDoc('pointerclick', this._onDocPointerClick);
                    })
                    .__base.apply(this, arguments);
            },

            '' : function() {
                visiblePopupsStack.splice(visiblePopupsStack.indexOf(this), 1);
                this
                    .unbindFromDoc('pointerclick', this._onDocPointerClick)
                    .__base.apply(this, arguments);
            }
        }
    },

    _onDocPointerClick : function(e) {
        if(this.hasMod('target', 'anchor') && dom.contains(this._anchor, $(e.target)))
            return;

        // NOTE: prevent from hiding underlying popups
        // for ( var i = 0; i<visiblePopupsStack.length; i++ ) {
        //     // if ( visiblePopupsStack[i] !== this ) {
        //         visiblePopupsStack[i]._preventHideByClick = true;
        //     // }
        // }

        // NOTE: prevent non-active popups from close by click
        if ( this === visiblePopupsStack[0] ) {
            this._preventHideByClick?
               this._preventHideByClick = null :
               this.delMod('visible');
        }
    }
}, /** @lends popup */{
    live : function() {
        BEMDOM.doc.on(KEYDOWN_EVENT, onDocKeyPress);
    }
}));

function onDocKeyPress(e) {
    e.keyCode === keyCodes.ESC &&
        // omit ESC in inputs, selects and etc.
        visiblePopupsStack.length &&
        !dom.isEditable($(e.target)) &&
            visiblePopupsStack[0].delMod('visible');
}

});
