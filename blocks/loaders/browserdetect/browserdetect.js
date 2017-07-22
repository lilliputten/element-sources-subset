/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqeqeq:false */
/* globals modules, BEMHTML, app, project, window, $ */
/**
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: browserdetect.js 8733 2017-07-11 16:47:15Z miheev $
 *
 */
/**
 * @module browserdetect
 * @description Detect some user agent features (works like jQuery.browser in jQuery 1.8)
 * @see http://code.jquery.com/jquery-migrate-1.1.1.js
 */

modules.define('browserdetect', [
        'ua'
    ],
    function(provide,
        ua
    ) {

// code from nicedetect plugin...

var _el = document.createElement('DIV'),
    _style = _el.style,
    _agent = navigator.userAgent,
    _platform = navigator.platform
    // ua = {}
    ;

if ( true ) {
    // alert(_agent, _platform);

    ua.haspointerlock = "pointerLockElement" in document || "webkitPointerLockElement" in document || "mozPointerLockElement" in document;

    ua.isopera = ("opera" in window); // 12-
    ua.isopera12 = (ua.isopera && ("getUserMedia" in navigator));
    ua.isoperamini = (Object.prototype.toString.call(window.operamini) === "[object OperaMini]");

    ua.isie = (("all" in document) && ("attachEvent" in _el) && !ua.isopera); //IE10-
    ua.isieold = (ua.isie && !("msInterpolationMode" in _style)); // IE6 and older
    ua.isie7 = ua.isie && !ua.isieold && (!("documentMode" in document) || (document.documentMode == 7));
    ua.isie8 = ua.isie && ("documentMode" in document) && (document.documentMode == 8);
    ua.isie9 = ua.isie && ("performance" in window) && (document.documentMode == 9);
    ua.isie10 = ua.isie && ("performance" in window) && (document.documentMode == 10);
    ua.isie11 = ("msRequestFullscreen" in _el) && (document.documentMode >= 11); // IE11+
    ua.isieedge12 = (navigator.userAgent.match(/Edge\/12\./));  // IE Edge 12
    ua.isieedge = ("msOverflowStyle" in _el);  // IE Edge
    ua.ismodernie = ua.isie11 || ua.isieedge;

    ua.isie9mobile = /iemobile.9/i.test(_agent); //wp 7.1 mango
    if (ua.isie9mobile) { ua.isie9 = false; }
    ua.isie7mobile = (!ua.isie9mobile && ua.isie7) && /iemobile/i.test(_agent); //wp 7.0

    ua.ismozilla = ("MozAppearance" in _style);

    ua.iswebkit = ("WebkitAppearance" in _style);

    ua.ischrome = ("chrome" in window);
    ua.ischrome38 = (ua.ischrome && ("touchAction" in _style)); // behavior changed in touch emulation
    ua.ischrome22 = (!ua.ischrome38)&&(ua.ischrome && ua.haspointerlock);
    ua.ischrome26 = (!ua.ischrome38)&&(ua.ischrome && ("transition" in _style)); // issue with transform detection (maintain prefix)

    ua.cantouch = ("ontouchstart" in document.documentElement) || ("ontouchstart" in window); // with detection for Chrome Touch Emulation
    ua.hasw3ctouch = (window.PointerEvent || false) && ((navigator.MaxTouchPoints > 0)||(navigator.msMaxTouchPoints > 0)); //IE11 pointer events, following W3C Pointer Events spec
    ua.hasmstouch = (!ua.hasw3ctouch)&&(window.MSPointerEvent || false); // IE10 pointer events

    ua.ismac = /^mac$/i.test(_platform);

    ua.isios = (ua.cantouch && /iphone|ipad|ipod/i.test(_platform));
    ua.isios4 = ((ua.isios) && !("seal" in Object));
    ua.isios7 = ((ua.isios)&&("webkitHidden" in document));  //iOS 7+
    ua.isios8 = ((ua.isios)&&("hidden" in document));  //iOS 8+

    ua.isandroid = (/android/i.test(_agent));

    ua.haseventlistener = ("addEventListener" in _el);

    ua.trstyle = false;
    ua.hastransform = false;
    ua.hastranslate3d = false;
    ua.transitionstyle = false;
    ua.hastransition = false;
    ua.transitionend = false;

    var a;
    var check = ['transform', 'msTransform', 'webkitTransform', 'MozTransform', 'OTransform'];
    for (a = 0; a < check.length; a++) {
      if (_style[check[a]] !== undefined) {
        ua.trstyle = check[a];
        break;
      }
    }
    ua.hastransform = (!!ua.trstyle);
    if (ua.hastransform) {
      _style[ua.trstyle] = "translate3d(1px,2px,3px)";
      ua.hastranslate3d = /translate3d/.test(_style[ua.trstyle]);
    }

    ua.transitionstyle = false;
    ua.prefixstyle = '';
    ua.transitionend = false;
    check = ['transition', 'webkitTransition', 'msTransition', 'MozTransition', 'OTransition', 'OTransition', 'KhtmlTransition'];
    var prefix = ['', '-webkit-', '-ms-', '-moz-', '-o-', '-o', '-khtml-'];
    var evs = ['transitionend', 'webkitTransitionEnd', 'msTransitionEnd', 'transitionend', 'otransitionend', 'oTransitionEnd', 'KhtmlTransitionEnd'];
    for (a = 0; a < check.length; a++) {
      if (check[a] in _style) {
        ua.transitionstyle = check[a];
        ua.prefixstyle = prefix[a];
        ua.transitionend = evs[a];
        break;
      }
    }
    if (ua.ischrome26) {  // always use prefix
      ua.prefixstyle = prefix[1];
    }

    ua.hastransition = (ua.transitionstyle);

    var detectCursorGrab = function detectCursorGrab() {
      var lst = ['grab','-webkit-grab', '-moz-grab'];
      if ((ua.ischrome && !ua.ischrome38) || ua.isie) { lst = []; } // force setting for IE returns false positive and chrome cursor bug
      for (var a = 0; a < lst.length; a++) {
        var p = lst[a];
        _style.cursor = p;
        if (_style.cursor == p) { return p; }
      }
      return 'url(//patriciaportfolio.googlecode.com/files/openhand.cur),n-resize'; // thank you google for custom cursor!
    };
    ua.cursorgrabvalue = detectCursorGrab();

    ua.hasmousecapture = ("setCapture" in _el);

    // ua.hasMutationObserver = (ClsMutationObserver !== false);

}

// 2016.08.12, 15:50 -- Обходим глюк в эмуляторе OperaMini
ua.canUseNiceScroll = true;
if ( /opera tablet/i.test(_agent) ) {
    ua.canUseNiceScroll = false;
}

_el = null; //memory released

/*
 * @exports
 * @type Object
 */
provide(ua);

});
