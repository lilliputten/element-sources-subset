/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @overview Загрузчик плагина `jquery.nicescroll`.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.09.20, 13:57
 * @version 2017.07.18, 13:13
 *
 * $Date: 2017-07-18 13:18:14 +0300 (Tue, 18 Jul 2017) $
 * $Id: nicescroll.js 8779 2017-07-18 10:18:14Z miheev $
 *
 * - WEB_TINTS/source/blocks/loaders/nicescroll/nicescroll.js
 * - WEB_TINTS/source/blocks/loaders/nicescroll/nicescroll.styl
 * - WEB_TINTS/source/blocks/root/menu/menu.bemhtml
 * - WEB_TINTS/source/blocks/root/menu/_nicescroll/menu_nicescroll.js
 * - WEB_TINTS/source/blocks/root/popup/popup.bemhtml
 * - WEB_TINTS/source/blocks/root/select/_nicescroll/select_nicescroll.bemhtml
 * - WEB_TINTS/source/blocks/root/select/_nicescroll/select_nicescroll.js
 *
 * - [github inuyaksa/jquery.nicescroll: nicescroll plugin for jquery](https://github.com/inuyaksa/jquery.nicescroll)
 * - [How to use – Nicescroll jQuery Plugin](https://nicescroll.areaaperta.com/how-to-use/)
 * - [Code Examples – Nicescroll jQuery Plugin](https://nicescroll.areaaperta.com/demo/)
 *
 * TODO: Перехват событий `mousedown` в выпадающих меню `select`
 *
 */

modules.define('nicescroll', [
        'project__config',
        'project__helpers',
        'i-bem-dom',
        'browserdetect',
        'loader_type_js',
        'jquery'
    ], function(provide,
        config,
        helpers,
        BEMDOM,
        browserdetect,
        loader,
        $
    ) {

var jsUrl = config.libs.nicescroll.js,
    defaultOptions = {
        // enablekeyboard : false,
        // enablemousewheel : false,
        hidecursordelay : 800,
        // autohidemode: false,
        // disablemutationobserver : true,
    };

loader(
    helpers.expand_path(jsUrl),
    function() {

        $.nicescroll || ( $.nicescroll = {} );

        $.nicescroll.init = function (elem, options) {

            var return_nicescroll_object;

            if ( browserdetect.canUseNiceScroll ) {

                if ( elem == null ) {
                    elem = $('.nicescroll');
                }
                else if ( elem.domElem ) {
                    elem = elem.domElem;
                }

                options = project.helpers.extend({}, defaultOptions, options);

                $(elem).each(function(n,item) {
                    var dom = item && item.domElem ? item.domElem : item;
                    if ( $(dom).niceScroll ) {
                        return_nicescroll_object = item.nicescroll = $(dom).niceScroll(options);
                    }
                });

            }

            return return_nicescroll_object;

        };

        // $.nicescroll.initialize();

        provide($.nicescroll);

    }
);

});
