/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module input
 * @overview Поле для ввода даты-времени.
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * $Date: 2017-07-11 19:47:15 +0300 (Tue, 11 Jul 2017) $
 * $Id: input_date.js 8733 2017-07-11 16:47:15Z miheev $
 *
 * @see project/libs/datetimepicker/build/jquery.datetimepicker.full.js
 * @see http://plugins.krajee.com/php-date-formatter
 * @see http://php.net/manual/en/function.date.php
 *
 * @see project/libs/bem-components/common.blocks/input/input.js
 * @see project/libs/bem-components/common.blocks/input/_has-clear/input_has-clear.js
 *
*/

modules.define('input', [
        // 'i-bem-dom',
        // 'events__channels',
        // 'store',
        'project',
        'keyboard__codes',
        'datetimepicker',
        'jquery',
    ],
    function(provide,
        // BEMDOM,
        // channels,
        // store,
        project,
        keyCodes,
        datetimepicker,
        $,
    Input) {

/*
 * @exports
 * @class input
 * @bem
 */

/**
 *
 *  @class input_date
 *  @classdesc Поле для ввода даты-времени.
 *
 *
 *  TODO
 *  ====
 *
 *  ОПИСАНИЕ
 *  ========
 *
 *  Блок `input` с модификатором `date : true`. Служит для выбора даты из всплывающего окна календаря (jq-плагин [DateTimePicker](http://xdsoft.net/jqplugins/datetimepicker/)) и преобразования форматов дат.
 *
 *  Преобразование дат производится с помощью плагина [DateFormatter](http://plugins.krajee.com/php-date-formatter).
 *
 *  ### Дополнительные модификаторы для передачи параметров:
 *
 *  #### format
 *
 *  Формат даты в строковом представлении в [php-стандарте](http://php.net/manual/en/function.date.php).
 *
 *  Пример значения: `Y.m.d H:i:s` (для строки `2016.09.15, 15:09:30`).
 *
 *  #### units
 *
 *  Тип даты для выдачи значения (в `getVal`).
 *
 *  Допустимые варианты: `'sec'`, `'msec'`, `'object'`, `'string'`.
 *
 *  ### Пример использования
 *
 *  #### BEMJSON
 *
 *  ``` javascript
 *  {
 *      block : 'input',
 *      attrs : { id : 'datetimetest1', title : 'Начало периода' },
 *      placeholder : 'Начало периода',
 *      mix : [
 *          { block : 'box_actions', elem : 'input' },
 *          { block : 'box_actions', elem : 'input_date' },
 *          { block : 'input_input_datetimetest1' },
 *          { block : 'box_actions', elem : 'input_datetimetest1' },
 *          { block : 'box_actions', elem : 'input_date_datetimetest1' },
 *          { block : 'input_datebox_actions', elem : 'input' },
 *      ],
 *      js : { x : 'x' },
 *      mods : { theme : 'islands', size : 'm', date : true, units : 'msec' },
 *      // val : 'test',
 *  },
 *  ```
 *  #### Пример форматирования даты
 *
 *  ```
 *  DateFormatter usage examples:
 *    project.helpers.dateformatter.formatDate(new Date(), 'Y.m.d H:i:s')
 *    project.helpers.dateformatter.parseDate('2016.09.14', 'Y.m.d')
 *  ```
 *
 */

/** Возможные типы дат
* @type String[]
*/
var available_date_units = [ 'sec', 'msec', 'object', 'string' ];

provide(Input.declMod({ modName : 'date', modVal : true }, /** @lends input_date.prototype */{

    /*{{{ Данные... */

    /** Открыт ли календарь
     * @type Boolean
     */
    is_picker_open : false,

    /** Текст на кнопке под календарём
     * @type String
     */
    applyButtonText : 'Закрыть',

    /** Единицы измерения даты по умолчанию
     *
     * Допустимые значения: `'sec', 'msec', 'object', 'string'`
     *
     * @type String
     */
    default_units : 'msec',

    /* Данные... }}}*/

    /** _onPickerClick() ** {{{
     */
    _onPickerClick : function() {

        var input_date = this;

        if ( !this.$datetimepicker.is(':visible') ) {
            input_date._datetimepicker.trigger('show.xdsoft');
            setTimeout(function(){
                input_date.$control.focus();
            },50);
        }
        else {
            input_date._datetimepicker.trigger('close.xdsoft');
        }

    },/*}}}*/

    /** setVal() ** {{{ Устанавливаем значение даты
     *
     * @param {String|Number|Object} val - Значение даты. Может быть строковой датой (string), числом (sec,msec)
     * или объектом `Date` (object).
     * @param [data] - Дополнительные данные для передачи по цепочке событий.
     * @param {String} [units] - Ожидаемый (в основном для `getDate`) тип даты: string, sec, msec или.
     *  Может передаваться также в модификаторе блока `units`.
     * @param {String} [format] - Ожидаемый формат даты (в php виде: http://php.net/manual/en/function.date.php)
     *  Может передаваться также в модификаторе блока `format` или браться из переменной `project.config.formats.datetime`.
     *
     * Допустимый формат вызова: `setVal(val, units, format)`.
     *
     */
    setVal : function (val, data, units, format) {

        var input_date = this,
            params = this.params;

        if ( !val ) { return this; }

        // Передача параметров без `data` -- сдвиг всех других параметров на один вправо
        if ( data && available_date_units.indexOf(data) !== -1 ) {
            format = units;
            units = data;
            data = null;
        }

        units = units || this.getMod('units') || this.default_units;
        format = format || this.getMod('format') || project.config.formats.datetime;

        // Преобразуем дату в зависимости от типа
        if ( typeof val === 'string' && !isNaN(val) && Number.isInteger(Number(val)) ) { // Если что-то похожее на число...
            val = parseInt(val, 10);
        }
        if ( typeof val === 'number' ) { // Если точно число
            units === 'sec' && ( val *= 1000 );
            val = new Date (val);
        }
        if ( typeof val === 'object' ) { // Если объект (предполагаем, что это `Date`)
            val = project.helpers.dateformatter.formatDate(val, format);
        }

        return this.__base(val);

    },/*}}}*/

    /** getVal() ** {{{ Получаем значение даты
     *
     * @param {String} [units] - Тип возвращаемой даты: string, sec, msec или object. По умолчанию -- значение поля.
     *  Может передаваться также в модификаторе блока `units`.
     * @param {String} [format] - Ожидаемый формат даты в элементе (в php виде: http://php.net/manual/en/function.date.php)
     *  Может передаваться также в модификаторе блока `format` или браться из переменной `project.config.formats.datetime`.
     *
     */
    getVal : function (units, format) {

        var input_date = this,
            params = this.params;

        var val = this.__base();

        if ( !val ) { return val; }

        var valOrig = val; // debug only!!!

        units = units || this.getMod('units') || this.default_units;
        format = format || this.getMod('format') || project.config.formats.datetime;

        if ( typeof units === 'undefined' || units === 'string' ) { return val; } // Строка -- значение из поля

        var valDate = project.helpers.dateformatter.parseDate(val, format);

        if ( units === 'object' ) { return valDate; } // Преобразованное в обхект значение

        val = ( valDate && typeof valDate.getTime === 'function' ) ? valDate.getTime() : 0;

        if ( units === 'msec' ) { return val; } // JS/Unix time -- милисекунды

        if ( units === 'sec' ) {
            return Math.round( val / 1000 ); // PHP time -- секунды
        }

        // Иначе предполагаем, что в units передан формат возвращаемой даты.
        if ( typeof units === 'string' ) {
            return project.helpers.dateformatter.formatDate(valDate, units);
        }

        // Иначе... (этого не должно быть!)
        return valOrig; // Неизвестное значение для `format` -- WTF?

    },/*}}}*/

    /** initialize() ** {{{ Инициализируем блок
     */
    initialize : function () {

        var input_date = this,
            that = this,
            params = this.params;

        this._control = this._elem('control') || {};
        this.$control = $(this._control.domElem);
        this.$control.addClass('xdsoft_datetimepicker_control');
        this.$control.datetimepicker({
            // lazyInit : true,
            lang : 'ru',
            // formatDate : 'Y/m/d', // Format date for minDate and maxDate
            // formatTime : 'H:i', // Similarly, formatDate . But for minTime and maxTime
            format : params.format || project.config.formats.datetime, // Format datetime. More Also there is a special type of "unixtime"
            showApplyButton: true,
            // closeOnDateSelect: false,
            closeOnTimeSelect: false,
            closeOnWithoutClick: false,
            closeOnInputClick: false,
            // validateOnBlur : true, // Verify datetime value from input, when losing focus. If value is not valid datetime, then to value inserts the current datetime
            // inline:true,
            enterLikeTab : false,
        });
        this._datetimepicker = this.$control.data('xdsoft_datetimepicker');
        this.$datetimepicker = this._datetimepicker;
        var applyButton = this._datetimepicker.find('.xdsoft_save_selected');
        applyButton.text(this.applyButtonText);

        var picker = this._elem('picker');
        picker && this._domEvents(picker.domElem).on('mousedown', this._onPickerClick, this);

        this._datetimepicker
            // jQuery:on(types, selector, data, fn)
            .on('open.xdsoft', function (event) {
                input_date.is_picker_open = true;
                $(document).on('keydown.xdsoftctrl', function (e) {
                    if ( e.keyCode === keyCodes.ESC ) {
                        input_date._datetimepicker.trigger('close.xdsoft');
                    }
                });
            })
            .on('close.xdsoft', function (event) {
                input_date.is_picker_open = false;
                $(document).off('keydown.xdsoftctrl');
            })
        ;

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов...
     * @method
     */
    onSetMod : {
        'js' : {
            'inited' : function() {
                this.__base.apply(this, arguments);
                this.initialize();
            }
        }
    },/*}}}*/

}));

});
