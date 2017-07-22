// ex: set commentstring=/*%s*/ :
/*
 * $Date: 2017-03-06 20:34:48 +0300 (Mon, 06 Mar 2017) $
 * $Id: bemjson-to-json.js 7452 2017-03-06 17:34:48Z miheev $
 */
var enb = require('enb'),
    buildFlow = enb.buildFlow || require('enb/lib/build-flow'),
    requireOrEval = require('enb-require-or-eval'),
    asyncRequire = require('enb-async-require'),
    clearRequire = require('clear-require');

/**
 * @class BemjsonToJsonTech
 * @augments {BaseTech}
 * @classdesc
 *
 * Build JSON file.<br/><br/>
 *
 * @param {Object}  [options]                                      Options
 * @param {String}  [options.target='?.json']                      - Path to a target with JSON file.
 * @param {String}  [options.bemhtmlFile='?.bemhtml.js']           - Path to a file with compiled BEMHTML module.
 * @param {String}  [options.bemjsonFile='?.bemjson.js']           - Path to BEMJSON file.
 * @param {Object|Callback(Object)}  [options.match={block:'app'}] - Object or callback to match block/element to match from page bemhtml data.
 * @param {String|Callback(Object)}  [options.fetch='content']     - Property id or callback to fetch data from matchet block/element.
 *
 * @example
 * var BemjsonToJsonTech = require('enb-bemxjst/techs/bemjson-to-json'),
 *     BemhtmlTech = require('enb-bemxjst/techs/bemhtml'),
 *     FileProvideTech = require('enb/techs/file-provider'),
 *     bem = require('enb-bem-techs');
 *
 * module.exports = function(config) {
 *     config.node('bundle', function(node) {
 *         // get BEMJSON file
 *         node.addTech([FileProvideTech, { target: '?.bemjson.js' }]);
 *
 *         // get FileList
 *         node.addTechs([
 *             [bem.levels, levels: ['blocks']],
 *             bem.bemjsonToBemdecl,
 *             bem.deps,
 *             bem.files
 *         ]);
 *
 *         // build BEMHTML file
 *         node.addTech(BemhtmlTech);
 *         node.addTarget('?.bemhtml.js');
 *
 *         // build JSON file
 *         node.addTech(BemjsonToJsonTech);
 *         node.addTarget('?.json');
 *     });
 * };
 */
module.exports = buildFlow.create()
    .name('bemjson-to-json')
    .target('target', '?.json')
    .defineOption('match', { block : 'app' })
    .defineOption('fetch', 'content')
    .useSourceFilename('bemhtmlFile', '?.bemhtml.js')
    .useSourceFilename('bemjsonFile', '?.bemjson.js')
    .builder(function (bemjsonFilename, bemjsonFilename) {
        var _this = this;
        var match = this._match;
        var fetch = this._fetch;
        clearRequire(bemjsonFilename);
        // console.log( 'match', match );
        // console.log( 'fetch', fetch );

        /** isObjectMatching ** {{{ Compare two objects (`obj==cmp`) or call callback (`cmp(obj)`) to find matched object
         * @param {Object} obj
         * @param {Object|Callback} fetch - Object with matching properties or callback
         */
        isObjectMatching = function (obj, cmp) {
            if ( typeof obj === 'object' && typeof cmp === 'object' ) {
                for ( var k in cmp ) {
                    if ( obj[k] !== cmp[k] ) {
                        return false;
                    }
                }
            }
            else if ( typeof cmp === 'function' ) {
                return cmp(obj);
            }
            return true
        };/*}}}*/
        /** findBlock ** {{{ Find specified (by `match`) object in-depth
         * @param {Object} obj
         * @param {Object|Callback} fetch - Object with matching properties or callback
         */
        findBlock = function (obj, cmp) {
            if ( Array.isArray(obj) ) {
                for ( var i=0; i<obj.length; i++ ) {
                    var result = findBlock(obj[i], cmp);
                    if ( result ) {
                        return result;
                    }
                }
            }
            else if ( isObjectMatching(obj, cmp) ) {
                return obj;
            }
            else if ( obj.content ) {
                return findBlock(obj.content);
            }
            return null;
        };/*}}}*/
        /** fetchData ** {{{ Fetch specified (by `fetch`) content from found block
         * @param {Object} obj
         * @param {String|Callback} fetch - Property to fetch or callback
         */
        fetchData = function (obj, fetch) {
            if ( typeof fetch === 'funciton' ) {
                return fetch(obj);
            }
            else if ( typeof obj === 'object' && obj[fetch] ) {
                return obj[fetch];
            }
            return obj;
        };/*}}}*/

        return requireOrEval(bemjsonFilename)
            .then(function (json) {
                if ( typeof match !== 'undefined' ) {
                    var newJson = findBlock(json, match);
                    if ( newJson ) {
                        json = fetchData(newJson, fetch);
                    }
                }
                // console.log( 'got json', json );
                clearRequire(bemjsonFilename);

                return JSON.stringify(json);

                // return asyncRequire(bemjsonFilename)
                //     .then(function (bemhtml) {
                //         return _this.render(bemhtml, json);
                //     })
                // ;
            })
        ;
    })
    // .methods({
    //     render: function (bemhtml, bemjson) {
    //         return bemhtml.BEMHTML.apply(bemjson);
    //     }
    // })
    .createTech();

