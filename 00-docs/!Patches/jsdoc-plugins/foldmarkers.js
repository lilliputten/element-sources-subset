'use strict';
// ex: set fmr=[[[,]]] cms=/*%s*/ :
// @version 2016.10.17, 13:51

/**
 * Удаляем всё до vim-foldmarker-меток: вида '...{{{'.
 *
 * @module plugins/foldmarkers
 * @author lilliputten <lilliputten@yandex.ru>
 * @version 2016.07.27, 21:41
 */

exports.handlers = {
    newDoclet: function(e) {
        var doclet = e.doclet;
        if ( typeof doclet.description === 'string' && doclet.description.indexOf('{{{') ) {
            doclet.description = doclet.description.replace(/^.*?{{{\s*/, '');
        }
    }
};
