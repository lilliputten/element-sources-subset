/* jshint camelcase: false, unused: false */
/* globals modules, global, module, window, document, System, setCookie, getCookie */
/**
 *
 * @overview project
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * @since 2016.09.19, 14:12
 * @version 2016.09.30, 18:04
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: project.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * @see project.deps.js
 * @see __root/project__root.js
 * @see __config/project__config.js
 * @see __helpers/project__helpers.js
 *
 * @module project
*/

modules.define('project', [
        'project__config',
        'project__helpers',
    ], function(provide,
        config,
        helpers
    ) {

var project = /** @lends project.prototype */{

    config : config,

    helpers : helpers,

};

provide(project);

// Устанавливаем объект в глобальный scope (для доступа из bemhtml)
var __global = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : typeof module !== 'undefined' ? module : this;
__global.project = project;

});
