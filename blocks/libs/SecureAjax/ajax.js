/* jshint camelcase: false, unused: false */
/* globals modules */
/**
 *
 * @overview Тестовый код (js)
 *
 * $Date: 2017-07-13 20:12:11 +0300 (Thu, 13 Jul 2017) $
 * $Id: ajax.js 8746 2017-07-13 17:12:11Z miheev $
 *
 */

var log, btnAuth;

/*{{{ jQuery.ready ... */
$(document).ready(function() {
    log = $("#log");
    btnAuth = $("#btnAuth");
    btnAuth.click(tryLoad);
    $("#btnLogOut").click(logOut);
    $("#btnLogOff").click(logOff);
    log.html("");
    var uri = document.documentURI;
    uri = uri.split('?');
    uri = uri[0].split('#');
    uri = uri[0];
});/*}}}*/

/** logOut ** {{{
 */
function logOut () {

    SecureAjax.logOut();

}/*}}}*/

/** logOff ** {{{
 */
function logOff () {

    log.append( '(test:logOff) Try change auth type...<br>' );
    console.log( '(test:logOff) Try change auth type...' );

    try {

        SecureAjax.logOff({
            error: function (jqXHR, textStatus, errorThrown) {
                var code = (jqXHR && jqXHR.status) ? jqXHR.status : '';
                log.append("HTTP status " + code + ": " + textStatus + " ERROR " + errorThrown + "<br>");
                console.error( '(logOff)', errorThrown );
                /*DEBUG*//*jshint -W087*/debugger;
            },
            success: function (data, textStatus, jqXHR) {
                log.append("HTTP status " + textStatus + " RESPONSE: <pre>\n" + JSON.stringify(data, null, 4) + "</pre><br>");
            },
            state: function (state, query, description) {
                log.append("Query " + state + " " + query + " " + description + "<br>");
                console.log( '(logOff)', 'HTTP status', state, query, description );
            }
        });
        log.append("OK.<br>");
        console.log( '(logOff)', 'ok' );
    } catch (e) {
        log.append("ERROR: " + e);
        console.error( '(logOff)', e );
        /*DEBUG*//*jshint -W087*/debugger;
    }
}/*}}}*/

/** tryLoad ** {{{
 */
function tryLoad () {

    var url = '/WEB_TINTS/application/Layout/get_AppParams_';

    log.append('(test:tryLoad) Send query to ' + url + '...<br>');
    console.log( '(test:tryLoad) Send query to', url );

    try {
        SecureAjax.send(url, {
            error: function (jqXHR, textStatus, errorThrown) {
                var code = (jqXHR && jqXHR.status) ? jqXHR.status : '';
                log.append("HTTP status " + code + ": " + textStatus + " ERROR " + errorThrown + "<br>");
                console.error( '(send)', errorThrown );
                /*DEBUG*//*jshint -W087*/debugger;
            },
            success: function (data, textStatus, jqXHR) {
                log.append("HTTP status " + textStatus + " RESPONSE: <pre>\n" + JSON.stringify(data, null, 4) + "</pre><br>");
                console.log( '(send)', 'HTTP status', textStatus, 'RESPONSE:', data );
            },
            state: function (state, query, description) {
                log.append("Query " + state + " " + query + " " + description + "<br>");
                    console.log( '(send)', 'state', state, query, description );
            }
        });
        log.append("OK.<br>");
        console.log( '(send)', 'ok' );

    } catch (e) {
        log.append("ERROR: " + e);
        console.error( '(send)', e );
        /*DEBUG*//*jshint -W087*/debugger;
    }

}/*}}}*/

