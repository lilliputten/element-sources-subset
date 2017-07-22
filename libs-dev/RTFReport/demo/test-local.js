/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/**
 * @module test-local
 * @overview Тест создания документа локально, в файловой системе с помощью node
 * @author lilliputten <lilliputten@yandex.ru>
 *
 * $Date: 2017-07-07 22:07:00 +0300 (Fri, 07 Jul 2017) $
 * $Id: test-local.js 8706 2017-07-07 19:07:00Z miheev $
*/

var
    // YM в глобальную переменную
    modules = global.modules = require('ym'),

    // Служебные зависимости...
    fs = require('fs-extra'),
    path = require('path'),

    // Данные
    sampleDataFile = './sample-data/minimal-sample-data.json',
    sampleData = require(sampleDataFile),

    // Файл вывода
    resultFile = __dirname + '/.results/test-local.rtf'

;

// Подключаем пакеты, запрашиваемые в RTFReport через ym:
require('vow');
require('../../jsrtf/lib/index');
require('./bem-modules/objects.vanilla.js');

// Подключаем библиотеку RTFReport
require('../RTFReport');

// Инициализируем через YM...
modules.require(['RTFReport'], function(RTFReport) {

    RTFReport.initDocument();
    RTFReport.processData(sampleData);
    // RTFReport.makeSampleDoc();

    try {
        var data = RTFReport.getDocument(true);

        fs.ensureDirSync(path.dirname(resultFile));
        fs.writeFile(resultFile, data, function (error) {
            if ( error ) {
                console.error(error);
            }
            else {
                console.info('Created '+resultFile);
            }
        });
    }
    catch (error) {
        console.error( 'RTFReport error:', error );
    }

});

