/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: bemhtml_loader.js 8746 2017-07-13 17:12:11Z miheev $
 *
 * NOTE 2017.04.24, 14:13 -- Не используется?
 * См. `WEB_TINTS/source/blocks/shared/BEMHTML/BEMHTML.js`
 *
 */
modules.define('bemhtml_loader', [
    'project__config',
    'project__helpers',
    'loader_type_js',
], function(provide,
    config,
    helpers,
    loader,
__BASE) {

// Если уже установлен глобальный объект...
if ( typeof window.BEMHTML === 'object' ) {
    provide(window.BEMHTML);
}
// ...Иначе...
else {
    // ...Пробуем запросить модуль через зависимости...
    modules.require(['BEMHTML'], function _require_success (BEMHTML){
        typeof window.BEMHTML === 'object' || ( window.BEMHTML = BEMHTML );
        provide(BEMHTML);
    }, function _require_fail (data){
        // ...Или загрузить внешним js-файлом...
        var jsUrl = helpers.expand_path( config.libs.bemhtml_engine.js );
        loader(jsUrl, function _load_success () {
            typeof window.BEMHTML === 'object' || ( window.BEMHTML = BEMHTML );
            provide(BEMHTML);
        }, function _load_fail () {
            console.error('Cant to find or load BEMHTML. WTF?');
            /*DEBUG*//*jshint -W087*/debugger;
        });
    });
}

});
