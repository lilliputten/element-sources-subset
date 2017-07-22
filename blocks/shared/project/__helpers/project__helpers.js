/* jshint camelcase: false, eqeqeq: false, unused: false */
/* globals modules, BEMHTML, project, System, setCookie, getCookie */
/**
 *
 * @overview project__helpers
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * @since 2016.09.19, 14:12
 * @version 2016.12.06, 11:48
 *
 * $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
 * $Id: project__helpers.js 8762 2017-07-17 11:16:38Z miheev $
 *
 * @module project__helpers
 */

modules.define('project__helpers', [
        'objects',
        'project__config',
        'dateformatter',
    ], function(provide,
        objects,
        config,
        Dateformatter,
    prev) {

var helpers = /** @lends project__helpers.prototype */{

    /** Интерфейс к методам objects */
    objects : objects,
    extend : objects.extend,

    /** {object} dateformatter ** {{{ Экземпляр dateformatter
     *
     * Использование:
     *  project.helpers.dateformatter.formatDate(new Date(), 'Y.m.d H:i:s')
     *  project.helpers.dateformatter.parseDate('2016.09.14', 'Y.m.d')
     *
     * См. [php date](http://php.net/manual/en/function.date.php)
     *
     */
    dateformatter : new Dateformatter (config.dateformatter_options),
    /*}}}*/

    /** parseDate(...) * {{{ OBSOLETE? Парсим дату по шаблону
     *
     * OBSOLETE: Использовать
     *  project.helpers.dateformatter.formatDate(new Date(), 'Y.m.d H:i:s')
     *  project.helpers.dateformatter.parseDate('2016.09.14', 'Y.m.d')
     *
     * Парсим дату по шаблону вида `Y.m.d H:i:s`. Где:
     *
     * Y : полное значение года,
     * y : последние две цифры года,
     * m : номер месяца (01-12),
     * d : номер дня в месяце (01...),
     * H : час (00-24),
     * M : минуты (00-59),
     * S : секунды (00-59).
     *
     * Т.е., формату `Y.m.d H:i:s` будет соответстовать, напр., строка: `2016.07.18 16:45:59`.
     *
     * Использование: `parseDate(new Date(1468322162240))`
     *
     * @param {Object|Date} d Исходная дата.
     * @param {String} format Формат даты.
     * @return {String}
     *
     */
    parseDate : function (d, format) {

        format = format || this.formats.datetime;

        var year = d.getFullYear();
        var month = d.getMonth();
        var day = d.getDate();
        var hours = d.getHours();
        var minutes = d.getMinutes();
        var seconds = d.getSeconds();

        var parsed = {
            Y : String(year),
            y : this.padValue(year, 2),
            m : this.padValue(month+1, 2),
            d : this.padValue(day, 2),
            H : this.padValue(hours, 2),
            M : this.padValue(minutes, 2),
            S : this.padValue(seconds, 2),
        };

        var string = format.replace(/(\w)/g, function(match, id) {
            return ( parsed[id] ) ? parsed[id]: match;
        });

        return string;

    },/*}}}*/

    /*{{{ OBSOLETE? */get_remote_method : function (request_id) {

        var method = ( config.requests[request_id] && config.requests[request_id].method ) || 'GET';

        return method;

    },/*}}}*/
    /*{{{ OBSOLETE? */get_remote_url : function (request_id) {

        var url = config.requests[request_id].url;

        // var root = ( config.LOCAL_ENB ) ? config.devRootUrl : config.realRootUrl;
        var path = config.requests[request_id].path || config.default_request_path;
        url = config.approot + path + url; // ???

        return url;

    },/*}}}*/

    /** get_button_icon() {{{ (To REMOVE?) Получить код блока иконки (из кнопок по умолчанию, project.config.buttons_data)
     */
    get_button_icon : function (button_id) {
        var icon = { block : 'icon', cls : 'ti ti-help-alt' };
        if ( config.buttons_data[button_id] ) {
            if ( config.buttons_data[button_id].icon ) {
                icon.cls = config.buttons_data[button_id].icon;
            }
        }
        return icon;
    },/*}}}*/

    /** expand_path() ** {{{ Парсим урл, производим подстановки
     *
     * Заменяются найденные в строке выражения вида {{paramName}},
     * где paramName -- имя одной из следующих переменных:
     *
     * approot - "Корень" приложения (config.devRootUrl или config.realRootUrl для production или dev-mode соотв.).
     * appcore - Основавние адресов для статического контента.
     * bemjson - Расположение папки с bemjson-описаниями страниц.
     * libsUrl - Расоложение библиотек.
     * staticUrl - Статические ресурсы bem.
     * rootUrl - "Корень" приложения из тела страницы (результат подстановки генератора).
     *
     */
    expand_path : function (path) {

        if ( typeof path !== 'string' ) { return path; }

        // if ( config.fake_server ) {
        //     path = this.expandFakeServerUrl(path);
        // }

        // ??? 2017.03.14, 21:44 - М.б., унифицировать с преобразованием путей к пакетам?
        var parse;
        if ( config.USE_ENB_URLS && config.bemjsonUrl && ( parse = path.match(/^{{bemjson}}\/?((\w+)(\.json)?)$/) ) !== null ) {
            var params = objects.extend({}, config, {
                file : parse[1],
                pageId : parse[2],
                ext : parse[3],
            });
            return this.parsePlainTemplate(config.bemjsonUrl, params);
        }

        var result = path.replace(/{{([\w\.-]+)}}/g, function (match, id) {
            if ( typeof config[id] !== 'undefined' ) {
                return config[id];
            }
            return match;
        });

        return result;

    },/*}}}*/

    /** getSerializedData ** {{{ */
    getSerializedData : function (data) {

        var s = JSON.stringify(data);
        // s = s.replace(/[^A-Za-z0-9А-Яа-яёЁ]+/g, '_');
        s = s.replace(/[^A-Za-z0-9]+/g, '_');
        s = s.replace(/(^_+|_+$)/g, '', s);

        return s;

    },/*}}}*/

    /** expandFakeServerUrl() ** {{{ Подстановка запросов к "копиям" данных
     * Если сервер разработки, то можем использовать "слепки" данных вместо запросов к реальному серверу.
     * @param {string} url - Адрес оригинального запроса.
     */
    expandFakeServerUrl : function (url) {

        if ( /* ( config.LOCAL_DEV || config.LOCAL_ENB || config.DEBUG ) && */ config.USE_FAKE_DATA) {

            var found = url.match(/^((?:(?:{{\w*}}|\.\.)\/*)*)(.*?)([?#].*)?$/);

            if ( found ) {
                var path_prefix = found[1],
                    base_url = found[2],
                    url_params = found[3] || ''
                ;
                // if ( base_url.endsWith('_') ) {
                    if ( config.fakeable_urls.indexOf(base_url) !== -1 ) {
                    base_url = base_url/* .substring(0, base_url.length-1) */ + '.json';
                    if ( config.FAKE_DATA_PATH ) {
                        path_prefix = config.FAKE_DATA_PATH;
                    }
                    url = path_prefix + base_url + url_params;
                    // Если сервер разработки, до добавялем origin (`http://localhost:8080`),
                    // чтобы не подменялось в secureAjax
                    if ( config.LOCAL_ENB && window.location.origin ) {
                        url = window.location.origin + url;
                    }
                }
                // }
            }
        }

        return url;

    },/*}}}*/

    // BEMHTML...

    /** process_boxing_properties() {{{ Подготовить свойства для элемента `boxing`
     * @param {object} ctx - bemjsxt узел элемента
     *
     * Процедура может быть заменена примесью (mix) блока `boxing` с соответствующими модификаторами
     * и добавлением идентификатора в аттрибуты (attrs.id).
     *
     */
    process_boxing_properties : function (ctx) {

        if ( !ctx.boxing ) { return ctx; }

        if ( !ctx.mix ) { ctx.mix = []; }
        if ( !ctx.attrs ) { ctx.attrs = {}; }

        ctx.mix.push({ block : 'boxing' });
        if ( ctx.boxing ) {
            ctx.boxing.forEach( function (item) {
                ctx.mix.push({ block : 'boxing_' + item });
            } );
        }

        if ( ctx.box_id ) {
            ctx.attrs.id = ctx.box_id;
        }

        return ctx;
    },/*}}}*/

    /** process_boxing_content() {{{ Подготовить content для элемента `boxing`
     * @param {object} ctx - bemjsxt узел элемента
     *
     * Можно заменять соответствующим вложением блока `boxing_container` (или `boxing:mod:container`).
     *
     */
    process_boxing_content : function (ctx) {
        // var ctx = this.ctx;
        return { elem : 'container', mix : [{ block : 'boxing_container' }], content : ctx.content };
    },/*}}}*/

    // Хелперы...

    /** average ** {{{ Рассчитываем среднее значение для массива
     * @param {Number[]} ary - Массив значений
     * @return {Number}
     */
    average : function (ary) {
        var avg = 0;
        if ( Array.isArray(ary) && ary.length ) {
            for ( var i=0; i<ary.length; i++ ) {
                avg += Number(ary[i]);
            }
            avg /= ary.length;
        }
        return avg;
    },/*}}}*/

    // Строковые методы...

    /** numberPeriods ** {{{ Возвращает строковое представление целого (?) числа с разделением пероиодов вида '1,234,567` */
    numberPeriods : function (n) {

        return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },/*}}}*/

    /** numericA ** {{{ Получаем склонение русского слова для числа ("1 объект, 2 объекта, много объектов, ...")
     * @param {int} n - Число
     * @param {string[]} words - Слова для выбора
     * @param {string} words[1] - Слово для "1, 21, 101 объект, ..."
     * @param {string} words[2] - Слово для "2, 32, 33, 34, 102 объекта..."
     * @param {string} words[3] - Слово для "много объектов"
     * @returns {string}
     */
    numericA : function (n, words) {

        // var args = Array.from(arguments);
        var cases = [2, 0, 1, 1, 1, 2];

        n = Math.abs( parseInt(n) );

        return words[ ( n % 100 >4 &&  n % 100 < 20 ) ? 2 : cases[( n % 10 < 5 ) ? n % 10 :5] ];

    },/*}}}*/
    /** numeric ** {{{ Получаем склонение русского слова для числа ("1 объект, 2 объекта, много объектов, ...")
     * @param {int} n - Число
     * @param {string} word1 - Слово для "1, 21, 101 объект, ..."
     * @param {string} word2 - Слово для "2, 32, 33, 34, 102 объекта..."
     * @param {string} word3 - Слово для "много объектов"
     * @returns {string}
     */
    numeric : function (n, word1, word2, word3) {

        return this.numericA(n, [ word1, word2, word3 ]);

    },/*}}}*/

    /** padValue(...) ** {{{ Выравнивание строки до требуемой длины справа или слева заданным символом.
     *
     * @param {number|string} val - Форматируемое число или строка.
     * @param {number} width - Требуемая длина числа/строки. Если >0 дополняем от начала, иначе -- от конца строки/числа.
     * @param [{string}] space - Символ для заполнения ('0' по умолчанию).
     *
     */
    padValue : function (val, width, space) {
        var w_abs = Math.abs(width);
        space = space || '0';
        val = String(val);
        var n_len = val.length;
        if ( n_len > w_abs ) {
            if ( width > 0 ) {
                val = val.substr(n_len-w_abs);
            }
            else {
                val = val.substr(0, w_abs);
            }
        }
        else {
            var plus = '';
            for ( var i=n_len; i<w_abs; i++ ) {
                plus += space;
            }
            if ( width > 0 ) {
                val = plus + val;
            }
            else {
                val += plus;
            }
        }
        return val;
    },/*}}}*/

    /** {RegExp} sformat_regexp ** {{{ Регулярка для разбора строки формата sprintf (sformat)
     *
     * Имеем в виду строку вида '%s %.5d %5.2f ...'
     *
     * Возможные типы аргументов:
     *
     * d - Целое десятичное число.
     * e - Число с плавающей точкой в экспоненциальном выражениит.
     * f - Число с плавающей точкой.
     * s - Строка.
     * D - Дата (из объекта Date).
     * t - Длительность времени (по значению в msec).
     * T - Длительность времени (по значению в sec).
     *
     * Не реализовано (?):
     *
     * h, H - Шестнадцатиричное число.
     *
     * Для даты и длительности возможна передача "длинных" шаблонов в виде '%{Y.m.d}D' или '%{DD H.i.s.u}t'.
     * DD здесь считается опциональным -- если количество дней равно нулю, то DD и окружающие его пробелы
     * и знаки препинания выкусываются из строки (??? -- надо ли?).
     *
     * Для чисел и строк допустимо применение выравнивателей: '%05d' выравнивает нулями число до пяти знаков
     * (00001), '%2d' выравнивает пробелами (' 1'), %-2d выравнивает справа ('1 '). Аналогично для строки.
     *
     * Для чисел с плавающей точкой можно указывать количество знаков после запятой:
     * '%.2f' (1.20), -- используется метод `{number}.toFixed()`. Выравнивание производится после вызова
     * toFixed, т.е. ширина поля включает в себя точку и десятичные знаки.
     *
     * Для получения экспоненциального представления используется метод `{number}.toExponential()`.
     *
     */
    sformat_regexp : /%({(.*?)}|(\S*))([defsDTt])/g,
    /*}}}*/

    /** sformat() ** {{{ Форматируем строку (аналог sprintf)
     *
     * Преобразуем вызов вида ('%s %d ...', param1, params2) в строку
     * с подставленными и отформатированными аргументами.
     *
     * Формат задания аргументов см. в описании переменной {@link #sformat_regexp}.
     *
     * @param {string} format - Формат строки.
     * @param [{...}] arg(s) - Параметры для подстановки в строку.
     * @returns {string}
     *
     */
    sformat : function (format) {
        var

            helpers = this,

            args = arguments,
            arg_count = 1,

            // Функция для разбора аргумента в строке
            /** ** {{{*/parse_value = function (match, opt, opt_clear, opt_alt, type) {

                var

                    arg_no = 0,     // '{N}$'  - номер параметра
                    zero_digit = 0, // '0{N}'  - цифра от нуля
                    dot_digit = 0,  // '.{N}'  - десятичная цифра
                    pad_digit = 0,  // '{N}'   - базовая цифра

                    val = '',

                    undef
                ;

                // Парсим параметры аргумента (выравнивание, номер аргумента, десятичная точка и т.д.)
                opt = opt.replace(/(\d+)\$/, function (_,n) { arg_no = Number(n); return ''; });
                opt = opt.replace(/0(-?\d+)/, function (_,n) { zero_digit = Number(n); return ''; });
                opt = opt.replace(/\.(-?\d+)/, function (_,n) { dot_digit = Number(n); return ''; });
                opt = opt.replace(/(-?\d+)/, function (_,n) { pad_digit = Number(n); return ''; });

                // Выбираем аргумент -- по номеру или очередной
                val = args[ arg_no || arg_count ];

                // Если пусто значение, то шаблон не применяем?
                if ( typeof val === 'undefined' || val === null || val === '' ) {
                    return '';
                }

                // В зависимости от типа аргумента...

                var date_format;

                /*{{{ Строка */if ( type === 's' ) {
                    val = String(val);
                }/*}}}*/
                /*{{{ Десятичнное число */else if ( type === 'd' ) {
                    val = parseInt(val, 10);
                }/*}}}*/
                /*{{{ Число с плавающей точкой */else if ( type === 'f' || type === 'e' ) {
                    val = parseFloat(val);
                    if ( dot_digit ) {
                        val = ( type === 'f' ) ? val.toFixed(dot_digit) : val.toExponential(dot_digit);
                    }
                }/*}}}*/
                /*{{{ Длительность времени (по значению в msec) */else if ( type === 't' || type === 'T' ) {
                    var time = Number(val);
                    // Если секунды...
                    if ( type === 'T' ) {
                        time *= 1000;
                    }
                    var stages = [
                        { id : 'u', text : 'мс.', digits : 3, base : 1000 }, // microseconds
                        { id : 's', text : 'с.', digits : 0, base : 60 }, // seconds
                        { id : 'i', text : 'м.', digits : 0, base : 60 }, // minutes
                        { id : 'H', text : 'ч.', digits : 0, base : 24 }, // hours
                        { id : 'DD', text : 'д.',  }, // days
                    ];
                    // var s = opt_clear || opt || config.formats.duration;
                    var res = '';
                    for ( var i=0; time && i<stages.length; i++ ) {
                        var v = stages[i].base ? time % stages[i].base : time;
                        if ( v ) {
                            if ( res ) { res = ' '+res; }
                            if ( stages[i].digits ) {
                                v = helpers.padValue(v, stages[i].digits);
                            }
                            res = v+' '+stages[i].text+res;
                        }
                        // if ( stages[i].id === 'DD' ) {
                        //     if ( v ) {
                        //         var text = ' дн.';
                        //         // if ( v % 1 && ! v % 11 ) { text += 'день'; }
                        //         // else if ( ( v % 10 === 2 || v % 10 === 3 ) && ( v % 100 !== 12 && v % 100 !== 13 ) ) { text += 'дня'; }
                        //         // else { text += 'дней'; }
                        //         v += text;
                        //     }
                        //     else {
                        //         s = s.replace(new RegExp('\\s*'+stages[i].id+'\\s*[,;\.]*\\s*'), '');
                        //     }
                        // }
                        // s = s.replace(stages[i].id, v);
                        time = Math.floor( time / stages[i].base );
                    }
                    // Если пусто, то подставляем значение для "нулевой" длительности
                    if ( !res ) {
                        res = config.formats.zeroDurationString;
                    }
                    val = res;//+'/'+s;
                }/*}}}*/
                // /*{{{ Дата по численному значению msec */else if ( type === 'T' ) { // Исп. в длительности
                //     var date_val = new Date( Number(val) );
                //     date_format = opt_clear || opt || config.formats.datetime;
                //     // val = $.datetimepicker.dateHelper.formatDate(date_val, date_format)
                //     val = this.dateformatter.formatDate(date_val, date_format);
                // }/*}}}*/
                /*{{{ Дата из объекта 'Date' */else if ( type === 'D' ) {
                    date_format = opt_clear || opt || config.formats.datetime;
                    val = this.dateformatter.formatDate(val, date_format);
                }/*}}}*/
                /*{{{ Иначе -- исходное значение (ничего не распарсено) */else {
                    return match;
                }/*}}}*/

                // Форматируем до ширины поля (для чисел и строк)
                if ( type === 'd' || type === 's' || type === 'f' ) {
                    if ( zero_digit ) {
                        val = helpers.padValue(val, zero_digit, '0');
                    }
                    if ( pad_digit ) {
                        val = helpers.padValue(val, pad_digit, ' ');
                    }
                }

                // Если аргумент по номеру, то готовимся выбрать следующий последовательный
                if ( !arg_no ) { arg_count++; }

                return val;
            },/*}}}*/

            undef
        ;

        var result = String(format).replace(this.sformat_regexp, parse_value);

        return result;
    },/*}}}*/

    // from tehcomputer 2017.03.14, 21:43

    /** getObjectKey ** {{{ Получить элемент объекта по "глубокому" ключу (напр., obj.a.b.c)
     * @param {object} obj - Объект
     * @param {string|string[]} keysPath - Ключ свойства (напр. 'a.b.c' или ['a','b','c')
     * @param {string} [DEFAULT_VALUE=''] - Значение по умолчанию
     * */
    getObjectKey : function (obj, keysPath, DEFAULT_VALUE) {

        DEFAULT_VALUE = DEFAULT_VALUE || '';

        if ( !Array.isArray(keysPath) ) {
            keysPath = keysPath.split('.');
        }

        keysPath.forEach(function(id) {
            var type = typeof obj;
            if ( type == 'object' ) {
                obj = ( typeof obj[id] !== 'undefined' ) ? obj[id] : DEFAULT_VALUE;
            }
        });

        return obj;

    },/*}}}*/
    /** parsePlainTemplate ** {{{ Обработать шаблон (bem seq{{...}})
     * @param {string} template - Шаблон
     * @param {object} [ctx] - Контекст
     * @param {boolean} [getBemjson] - Не применять BEMHTML.apply, вернуть объект для обработки, иначе вернуть строку
     * TODO 2017.03.16, 13:49 -- Заменить версией с обработкой filters из tehcomputer (выделить в библиотеку?)
     * TODO 2017.03.16, 13:49 -- Придумать, как использовать lodashTemplate на клиенте.
     * TODO 2017.05.30, 17:58 -- Флаг для "плоских" ключей ('acInfo.typeID')
     */
    parsePlainTemplate : function (template, ctx, getBemjson) {

        var that = this;

        try {

            var newContent = [],
                foundObjects = 0;

            // // Если присутствует шаблонизатор lodash
            // if ( typeof System === 'object' && System.lodashTemplate ) {
            //     template = System.lodashTemplate(template)(ctx);
            // }
            // Парсим lodash шаблон
            if ( typeof System === 'object' && System.parseLodashTemplate ) {
                template = System.parseLodashTemplate(template, ctx);
            }

            template = template
                .replace(/\{%\s*comment\s*%\}([\s\S]*?)\{%\s*endcomment\s*%\}/gm, '')
                .replace(/\{#.*?#\}/gm, '')
                ;

            // template.replace( /([\s\S]*?)({{\s*[\w\.]+\s*}}|{%[\s\S]*?%})/gm, function(match, prefix, chunk) {
            template.split( /({{\s*[\w\.]+\s*}}|{%[\s\S]*?%})/gm ).map( function (chunk) {

                if ( chunk.indexOf('{{') === 0 ) {
                    var id = chunk.replace(/{{\s*([\w\.]+)\s*}}/, '$1');
                    chunk = that.getObjectKey(ctx, id);
                }
                else if ( chunk.indexOf('{%') === 0 ) {
                    var code = chunk.replace(/{%\s*([\s\S]*)\s*%}/m, '$1');
                    var obj = JSON.parse(code);
                    chunk = obj;
                }
                newContent.push(chunk);
                if ( typeof chunk === 'object' ) {
                    foundObjects++;
                }

            });

            // Преобразуем данные, если не задан флаг getBemjson
            if ( !getBemjson ) {
                newContent = ( foundObjects && typeof BEMHTML === 'object' ) ? BEMHTML.apply(newContent) : newContent.join('');
            }

            return newContent;

        }
        catch (e) {
            console.error( 'parsePlainTemplate error', e );
            /*DEBUG*//*jshint -W087*/debugger;
            return template;
        }

    },/*}}}*/
    /** expandContentTemplate ** {{{ Обработать внешние шаблоны в описании блока bemhtml
     * TODO: lodash Вынести в отдельный модуль, System не использовать
     * @param {object} ctx - Контекст блока
     */
    expandContentTemplate : function (ctx) {

        var
            template = ( System && System.loadFile(ctx.templateFile) ) || ctx.content || '',
            undef
        ;

        if ( template ) {

            // var lodash = require('lodash.template');

                var passCtx = this.extend({}, ctx, {
                    // System : ( ctx.System && System ) || {},
                    project : project,
                    ctx : ctx,
                });

            // Удаляем комментарии
            // template = template.replace(/\{%\s*comment\s*%\}(.*?[\n\r.]*?)*?\{%\s*endcomment\s*%\}/gm, '');

            // // Парсим lodash шаблон
            // if ( typeof System === 'object' && System.parseLodashTemplate ) {
            //     template = System.parseLodashTemplate(template, passCtx);
            // }

            template = project.helpers.parsePlainTemplate(template, passCtx, true);

            ctx.content = template;

        }
    },/*}}}*/

    // Устаревшее?

    /** parse_template() ** {{{ Парсим/преобразуем значение по шаблону.
     *
     * TODO 2016.12.06, 18:55 -- Словари и параметры
     * TODO 2016.09.09, 14:43 -- Работа со словарями через промисы? dicts_controller?
     *
     * @param {String,Number,Object} val_or_obj Исходное значение или объект.
     * @param {String} template Шаблон для подстановок/преобразований.
     * @param {Object} dicts Словари для подстановки значений. (???)
     * @return {String}
     *
     */
    parse_template : function (val_or_obj, template, dicts) {

        var helpers = this,
            that = this,
            undef
        ;

        if ( typeof template !== 'string' || !template ) {
            return val_or_obj;
        }

        // Находим все подстановки вида '{...}'
        var new_value = String(template).replace(/\{\s*([^{}]*)\s*\}/g, function (match, key ) {
            // Строка с операциями, разделёнными "пайпом" ('|') внутри подстановки
            var ops = '';
            // Проверяем на сложную замену...
            var reg = key.match(/^([^\|]+)\|(.*)$/);
            // Если замена сложная, находим ключ и операнды
            if ( reg ) {
                key = reg[1];
                ops = reg[2];
            }
            // Инициируем значение ключом
            var val = key;
            // Если объект, то принимаем значение за ключ
            if ( typeof val_or_obj === 'object' ) {
                val = val_or_obj[val];
            }
            // Иначе раскрываем аргументы %{...}
            else if ( key.indexOf('%') !== -1 ) {
                val = that.sformat(key, val_or_obj);
            }
            var is_empty = ( !val || typeof val === 'undefined' || val === null || val == 'undefined' );
            // Разбираем операнды
            ops.split('|').forEach(function(op) {
                // Если пусто, то ничего не делаем
                if ( !op ) { return; }
                // Проверяем на наличие кода операции и (опционально) параметров...
                var reg = op.match(/^(\w+)(?::(.+))?$/);
                // Если операция не задана, ничего не делаем
                if ( ! reg ) { return; }
                // Устанавливаем код операции и параметры
                var opType = reg[1],
                    param = reg[2];
                switch ( opType ) {
                    case 'datetime':
                    case 'date':
                    case 'time':
                        var date = new Date ( Number(val) ),
                            format = param || config.formats[opType];
                        val = that.dateformatter.formatDate(date, format);
                        break;
                    case 'duration':
                        val = that.sformat('%t', val);
                        break;
                    /* TODO...
                    case 'dict':
                        var dict_data = ( typeof dicts === 'function' ) ? dicts(param) : dicts[param];
                        if ( dict_data ) {
                            var dict_type = typeof dict_data[val];
                            if ( dict_type  === 'string' ) {
                                val = dict_data[val];
                            }
                            else if ( dict_type  === 'object' ) {
                                // `dictkeys` dict???
                                var dict_keys = ( typeof dicts === 'function' ) ? dicts('dictkeys') : dicts['dictkeys'];
                                var dictkey = ( dict_keys && dict_keys[param] ) ? dict_keys[param]: '{name}';
                                val = that.parse_template(dict_data[val], dictkey, dicts, val);
                            }
                        }
                        break;
                    */
                    case 'eval':
                        // val = eval( val ); // jshint ignore:line
                        val = eval(val, { // jshint ignore:line
                            __builtins__ : {},
                        });

                        break;
                    case 'if_equal':
                        reg = param.match(/^(.*?):(.*)$/);
                        if ( reg && reg[1] == val ) {
                            val = reg[2].replace(/%s/g, val);
                        }
                        break;
                    case 'not_empty':
                        if ( !is_empty ) {
                            val = param.replace(/%s/g, val);
                        }
                        break;
                    case 'default':
                        if ( is_empty ) {
                            val = param;
                        }
                        break;
                }
            });
            return val;
        });

        return new_value;

    },/*}}}*/

    /** (OBSOLETTE) parse_value_template(...) ** {{{ Парсим/преобразуем значение по шаблону.
     *
     * OBSOLETTE: В будущем использовать parse_template(). Этот вызов пока используется только
     * в старом `object_details`. После его рефакторинга (?) и доработки `parse_template` этот метод надо убрать.
     *
     * TODO 2016.09.09, 14:43 -- Работа со словарями через промисы? dicts_controller?
     *
     * @param {String,Number,Object} val_or_obj Исходное значение или объект.
     * @param {String} template Шаблон для подстановок/преобразований.
     * @param {Object} dicts Словари для подстановки значений.
     * @param {String,Number} id_value Значение для подстановки "Идентификатор" или "Уникальный ключ".
     * @return {String}
     *
     */
    parse_value_template : function (val_or_obj, template, dicts, id_value) {

        var helpers = this;

        // var object_details = this;
        // var params = this.params;

        if ( typeof template !== 'string' || !template ) {
            return val_or_obj;
        }

        var new_value = String(template).replace(/\{\s*([^{}]*)\s*\}/g, function (match, key ) {
            var ops = '';
            var reg = key.match(/^([^\|]+)\|(.*)$/);
            if ( reg ) {
                key = reg[1];
                ops = reg[2];
            }
            var val = key;
            if ( key === '#' || key === '--' ) {
                val = id_value;
            }
            else if ( typeof val_or_obj === 'object' ) {
                val = val_or_obj[val];
            }
            else if ( key.indexOf('%s') !== -1 ) {
                val = key.replace(/%s/g, val_or_obj);
            }
            var is_empty = ( !val || typeof val === 'undefined' || val == 'null' || val == 'undefined' );
            ops.split('|').forEach(function(op) {
                if ( !op ) { return; }
                reg = op.match(/^(\w+)(?::(.+))?$/);
                if ( ! reg ) { return; }
                var opType = reg[1];
                var param = reg[2];
                switch ( opType ) {
                    case 'datetime':
                        var date = new Date ( Number(val) );
                        var format = param || '';
                        val = String(date); // ??? helpers.parseDate(date, format);
                        break;
                    case 'dict':
                        var dict_data = ( typeof dicts === 'function' ) ? dicts(param) : dicts[param];
                        if ( dict_data ) {
                            var dict_type = typeof dict_data[val];
                            if ( dict_type  === 'string' ) {
                                val = dict_data[val];
                            }
                            else if ( dict_type  === 'object' ) {
                                // `dictkeys` dict???
                                var dict_keys = ( typeof dicts === 'function' ) ? dicts('dictkeys') : dicts.dictkeys;
                                var dictkey = ( dict_keys && dict_keys[param] ) ? dict_keys[param]: '{name}';
                                val = project.helpers.parse_value_template(dict_data[val], dictkey, dicts, val);
                            }
                        }
                        break;
                    case 'eval':
                        val = eval( param.replace(/%[ds]/g, val) ); // jshint ignore:line
                        break;
                    case 'if_equal':
                        reg = param.match(/^(.*?):(.*)$/);
                        if ( reg && reg[1] == val ) {
                            val = reg[2].replace(/%s/g, val);
                        }
                        break;
                    case 'not_empty':
                        if ( !is_empty ) {
                            val = param.replace(/%s/g, val);
                        }
                        break;
                    case 'default':
                        if ( is_empty ) {
                            val = param;
                        }
                        break;
                }
            });
            return val;
        });

        return new_value;

    },/*}}}*/

};

provide(helpers);

});
