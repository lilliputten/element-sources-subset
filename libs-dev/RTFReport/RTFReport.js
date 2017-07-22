/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals debugger, DEBUG, BEMHTML, DBG, app, project, modules */
/**
 *
 * @module RTFReport
 * @overview Управление асинхронными задачами и показом статуса ожидания пользователю.
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * $Date: 2017-07-07 22:07:00 +0300 (Fri, 07 Jul 2017) $
 * $Id: RTFReport.js 8706 2017-07-07 19:07:00Z miheev $
 *
*/
modules.define('RTFReport',
    [
        'vow',
        'objects',
        'jsrtf',
    ],
    function(provide,
        vow,
        objects,
        jsRTF,
    __BASE) {

/*
 * @exports RTFReport
 * @class RTFReport
 * @bem
 */

/**
 *
 * @class RTFReport
 * @classdesc Управление асинхронными задачами и показом статуса ожидания пользователю.
 *
 * TODO
 * ====
 *
 * ОПИСАНИЕ
 * ========
 *
 */

// var
//     jsRTF = require('../jsrtf')
//     // RTF = require('./RTF'),
//     // iconvLite = require('iconv-lite'),
//     // TableElement = require('./node-rtf/lib/elements/table')
// ;

var isArray = Array.isArray;
var isEmpty = objects.isEmpty;

/** utf8_decode ** {{{ */
function utf8_decode (aa) {
    var bb = '', c = 0;
    for (var i = 0; i < aa.length; i++) {
        c = aa.charCodeAt(i);
        if ( c > 127 ) {
            if ( c > 1024 ) {
                if ( c === 1025 ) {
                    c = 1016;
                } else if ( c === 1105 ) {
                    c = 1032;
                }
                bb += String.fromCharCode(c - 848);
            }
        } else {
            bb += aa.charAt(i);
        }
    }
    return bb;
}/*}}}*/

/** @lends RTFReport.prototype */
var RTFReport = {

    // Методы создания RTF...

    /** hasMod ** {{{ Хелпер: наличие модификатора (опции) в своёстве 'mods' объекта (массива)
     * @param {Array} data
     * @param {String} modName
     * @returns {Boolean}
     */
    hasMod : function (data, modName) {
        // $mods = ( array_key_exists('mods', $data) && gettype($data.mods) === 'array' ) ? $data.mods : [];
        // return ( array_key_exists($modName, $mods) && !empty($mods[$modName]) && $mods[$modName] != '0' && $mods[$modName] !== 'false' ) ? true : false;
        var mods = ( typeof data.mods === 'object' && data.mods ) ? data.mods : {};
        return ( mods[modName] ) ? true : false;
    },/*}}}*/

    // Обработка данных....

    /** AddGroupStatItem ** {{{ Добавить элемент группы статистики
     * @param {Array} data - Входные данные
     */
    AddGroupStatItem : function (data) {

        // \\u8195 -- em space
        // \\u8194 -- en space
        return new jsRTF.ContainerElement([
            new jsRTF.TextElement(data.title, this.styles.statKey),
            new jsRTF.TextElement(':\\u8194\\\'3f', this.styles.statKey, { noEscape : true }),
            new jsRTF.TextElement(data.val, this.styles.text),
        ], this.styles.statItem);

    },/*}}}*/

    /** AddGroupStat ** {{{ Добавить группу статистики
     * @param {Array} data - Входные данные
     */
    AddGroupStat : function (data) {

        this.doc.addElement( '', this.styles.spacer25 );

        var elements = data.map(this.AddGroupStatItem, this);
        this.doc.addElement([
            new jsRTF.ContainerElement(elements, this.styles.statGroup),
        ], this.styles.statGroup);

        this.doc.addElement( '', this.styles.spacer25 );

    },/*}}}*/

    /** AddGroupTitle ** {{{ */
    AddGroupTitle : function (title) {

        this.doc.addElement( title, this.styles.groupTitle );

    },/*}}}*/

    /** AddGroupTable ** {{{ */
    AddGroupTable : function (Table) {

        // // DEBUG!
        // this.doc.addElement([
        //     new jsRTF.TextElement('(Таблица): ', this.styles.em),
        //     new jsRTF.TextElement(JSON.stringify(Table), this.styles.text),
        // ], this.styles.paragraph);

        this.doc.addElement( '', this.styles.spacer50 );

        var table = new jsRTF.TableElement(this.styles.table);
        table.addRow(Table.columns);
        Table.rows.map(function(row){ table.addRow(row); });
        this.doc.addTable(table);

        this.doc.addElement( '', this.styles.spacer50 );

    },/*}}}*/

    /** AddGroup ** {{{ Добавить группу
     * @param {Object|Array} data - Входные данные
     */
    AddGroup : function (data) {

        // // DEBUG
        // this.doc.addElement([
        //     new jsRTF.ContainerElement([
        //         new jsRTF.TextElement('Striked ', this.styles.em),
        //         'content',
        //     ], { strike : true }),
        //     new jsRTF.TextElement(' (Группа): ', this.styles.em),
        //     new jsRTF.TextElement(JSON.stringify(data), this.styles.text ),
        // ], this.styles.paragraph);

        if ( this.hasMod(data, 'showTitle') && data.title ) {
            this.AddGroupTitle(data.title);
        }

        var showTable = this.hasMod(data, 'showTable') && data.Table;
        var tableFirst = this.hasMod(data, 'tableFirst');

        if ( showTable && tableFirst ) {
            this.AddGroupTable(data.Table);
        }

        var showStat = this.hasMod(data, 'showStat') && data.Stat;
        if ( showStat  ) {
            this.AddGroupStat(data.Stat);
        }

        if ( showTable && !tableFirst ) {
            this.AddGroupTable(data.Table);
        }

    },/*}}}*/

    /** AddTitle ** {{{ Добавить заголовок документа
     * @param {Object|Array} $data - Входные данные
     */
    AddTitle : function (data) {

        this.doc.addElement( data.content, this.styles.pageTitle );

    },/*}}}*/

    /** processData ** {{{ */
    processData : function (data) {

        data.map(function(item){
            if ( !isEmpty(item) ) {
                // Если заголовок...
                if ( item.elem === 'Title' ) {
                    this.AddTitle(item);
                }
                // Если группа...
                else if ( item.elem === 'Group' ) {
                    this.AddGroup(item);
                }
            }
        }, this);

    },/*}}}*/

    /** initStyles ** {{{ Создаём используемые стили
     */
    initStyles : function () {

        // Устанавливаем собственные цвета
        Object.assign(jsRTF.Colors, {
            beige : new jsRTF.RGB(0,127,0),
            gray50 : new jsRTF.RGB(50,50,50),
            gray100 : new jsRTF.RGB(100,100,100),
            gray150 : new jsRTF.RGB(150,150,150),
            gray200 : new jsRTF.RGB(200,200,200),
        });

        var
            cellPaddingV = 60,
            cellPaddingH = 20,
            cellBaseProps = {
                spaceBefore : cellPaddingV,
                spaceAfter : cellPaddingV,
                leftIndent : cellPaddingH,
                rightIndent : cellPaddingH,
            },
            normalFontSize = 10
        ;

        this.styles = {

            // Отбивочные параграфы
            spacer25 : {
                fontSize : 1,
                spaceBefore : 50,
                spaceAfter : 50,
                paragraph : true,
            },
            spacer50 : {
                fontSize : 1,
                spaceBefore : 50,
                spaceAfter : 50,
                paragraph : true,
            },
            spacer100 : {
                fontSize : 1,
                spaceBefore : 100,
                spaceAfter : 100,
                paragraph : true,
            },
            spacer200 : {
                fontSize : 1,
                spaceBefore : 200,
                spaceAfter : 200,
                paragraph : true,
            },

            // Абзац текста
            paragraph : new jsRTF.Format({
                fontSize : normalFontSize,
                spaceBefore : 200,
                spaceAfter : 200,
                paragraph : true,
                // color : jsRTF.Colors.GREEN,
            }),
            // Стиль заголовка отчёта
            pageTitle : new jsRTF.Format({
                spaceBefore : 200,
                spaceAfter : 100,
                fontSize : 20,
                align : 'center',
                color : jsRTF.Colors.gray100,
                paragraph : true,
                borderBottom : { type : 'double', width : 20, spacing : 100, color : jsRTF.Colors.gray100 },
            }),
            // Стиль заголовка группы
            groupTitle : new jsRTF.Format({
                fontSize : 14,
                spaceBefore : 200,
                spaceAfter : 50,
                color : jsRTF.Colors.gray100,
                paragraph : true,
                borderBottom : { type : 'single', width : 20, spacing : 100, color : jsRTF.Colors.gray100 },
            }),
            // Стиль текста по умолчанию
            text : new jsRTF.Format({
                fontSize : normalFontSize,
                color : jsRTF.Colors.BLACK,
            }),
            // Элемент группы статстики (пара "ключ:значение")
            statItem : new jsRTF.Format({
                fontSize : normalFontSize,
                spaceBefore : 50,
                spaceAfter : 50,
                rightIndent : 1000,
                color : jsRTF.Colors.gray100,
                paragraph : true,
            }),
            // Выделение ключа группы значения
            statKey : new jsRTF.Format({
                fontSize : normalFontSize,
                color : jsRTF.Colors.gray100,
            }),
            // Выделение
            em : new jsRTF.Format({
                fontSize : normalFontSize,
                color : jsRTF.Colors.gray100,
            }),

            // Таблица
            table : {

                format : new jsRTF.Format({
                    fontSize : normalFontSize,
                    tableBorder : 10,
                    tableWidth : this.contentWidth,
                    borderColor : jsRTF.Colors.gray100,
                }),
                // Строка таблицы
                rowFormat : new jsRTF.Format(Object.assign({}, cellBaseProps, {
                    fontSize : normalFontSize,
                    // strike : true,
                    color : jsRTF.Colors.BLACK,
                    cellBorderBottom : { type : 'single', width : 10, color : jsRTF.Colors.gray200 },
                })),
                // Первая строка
                firstRowFormat : new jsRTF.Format(Object.assign({}, cellBaseProps, {
                    fontSize : normalFontSize,
                    tableHeader : true,
                    bold : true,
                    spaceAfter : 80,
                    cellBorderBottom : { type : 'single', width : 30, color : jsRTF.Colors.gray200 },
                    // color : jsRTF.Colors.WHITE,
                    // cellBgColor : jsRTF.Colors.RED,
                    cellVerticalAlign : 'bottom',
                })),
                cellFormat : new jsRTF.Format({
                    // cellBorderTop : { type : 'single', width : 10, color : jsRTF.Colors.BLACK },
                    // cellBorderRight : { type : 'single', width : 10, color : jsRTF.Colors.WHITE },
                    // cellBorderLeft : { type : 'single', width : 10, color : jsRTF.Colors.WHITE },
                    // cellBorderBottom : { type : 'single', width : 10, color : jsRTF.Colors.gray200 },
                }),
                // Ячейки...
                // cellFormats : [
                //     new jsRTF.Format({ widthRatio : 0.2, strike : true, bold : true, color : jsRTF.Colors.GREEN }),
                //     new jsRTF.Format({ widthPercents : 80, underline : true, color : jsRTF.Colors.MAROON }),
                // ],

            },

        };

    },/*}}}*/

    /** initDocument ** {{{
     */
    initDocument : function () {

        var
            // Default page margin size (twips)
            pageMargin = 500,
            // Page options
            pageOptions = this.pageOptions = {
                // Language: Russian
                language : jsRTF.Language.RU,
                // Set page size: A4 horizontal
                pageWidth : jsRTF.Utils.mm2twips(297),
                pageHeight : jsRTF.Utils.mm2twips(210),
                // Landscape page format -- which effect it making?
                landscape : true,
                // Margins:
                marginLeft : pageMargin,
                marginTop : pageMargin,
                marginBottom : pageMargin,
                marginRight : pageMargin,
            },
            // Calculate content width (for 100% tables, for example)
            contentWidth = this.contentWidth = pageOptions.pageWidth - pageOptions.marginLeft - pageOptions.marginRight,
            // Документ...
            doc = this.doc = new jsRTF (pageOptions)
        ;

        this.initStyles();

        return this.doc;

    },/*}}}*/

    /** getDocument ** {{{
     * @param {Boolean} encode - Конвертировать документ в windows-1251
     * @returns {String|Buffer}
     */
    getDocument : function (encode) {

        if ( !this.doc ) {
            throw new Error('Document not initialized!');
        }

        var data = this.doc.createDocument();

        if ( encode ) {
            data = utf8_decode(data);
            data = new Buffer(data, 'binary');
        }

        return data;

    },/*}}}*/

    /** makeSampleDoc ** {{{ DEBUG
     */
    makeSampleDoc : function () {

        if ( !this.doc ) {
            throw new Error('Document not initialized!');
        }

        // Formatter object
        var textFormat = {
            spaceBefore : 300,
            spaceAfter : 300,
            paragraph : true,
            align : 'center',
            color : jsRTF.Colors.RED,
        };

        // Adding text styled with formatter
        this.doc.writeText('demo', textFormat);

    },/*}}}*/

};

provide(RTFReport);

});
