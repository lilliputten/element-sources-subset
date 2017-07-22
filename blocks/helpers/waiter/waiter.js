/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module waiter
 * @overview Управление асинхронными задачами и показом статуса ожидания пользователю.
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2016.07.12
 * @version 2016.07.29, 15:49
 *
*/
modules.define('waiter',
    [
        'i-bem-dom',
        'progressbar',
        'events__channels',
        // 'loader_indicator',
        // 'store',
        'vow',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        progressbar,
        channels,
        // loader_indicator,
        // store,
        vow,
        $,
    __BASE) {

/*
 * @exports waiter
 * @class waiter
 * @bem
 */

// var popup_count = 0;

/**
 *
 * @class waiter
 * @classdesc Управление асинхронными задачами и показом статуса ожидания пользователю.
 *
 *
 * TODO
 * ====
 *
 * __2016.07.29, 20:22__ -- Добавить обработку состояния активных задач по "тикам" (аналогично обработке таймаутов).
 *
 * __2016.08.01, 21:05__ -- Показывать детализацию, если нет активности (таймаут?) и етсь незавершённые задачи.
 *
 * ОПИСАНИЕ
 * ========
 *
 */

/** @lends waiter.prototype */
var waiter = {

    /*{{{ Данные... */

    // TODO 2016.08.01, 15:13 -- Данные -- статические или глобальные???

    /** Флаг занятости.
     * @type {Boolean}
     */
    operating : 0,

    /** Очередь задач на выполнение после завершения текущей операции.
     * @type {Boolean}
     */
    operating_callbacks : [],

    /** Триггеры, объединяющие задачи.
     * @type {Object}
     */
    triggers : {},

    /** Основная очередь задач.
     * @type {Object}
     */
    queue : {},

    /** Общая длина очереди (с учётом повторных вхождений).
     * @type {Number}
     */
    total_queue_count : 0,

    /** Общее количество завершённых задач (до сброса).
     * @type {Number}
     */
    past_tasks_count : 0,

    /** "Историческая" (для показа прогрессбара с учётом завершённых -- до сброса -- задач) длина очереди.
     * @type {Number}
     */
    total_tasks_count : 0,

    /** Обработчики события "очередь пуста".
     * @type {Callback[]}
     */
    queue_empty_callbacks : [],

    /** Интервал отслеживания задач с таймаутом.
     * @type {Number}
     */
    timer_interval : 500,
    /** Хэндлер таймера, полученный от `setInterval`.
     * @type {Handler}
     */
    timer : null,
    /** Количество активных задач с таймаутом.
     * @type {Number}
     */
    timeouted_tasks_count : 0,

    /*}}}*/

    /** _do(callback) ** {{{ Выполнение процедуры: отлженное или сейчас, с учётом флага занятости
     * @param {Callback} callback
     */
    _do : function (callback) {

        var waiter = this,
            result;

        if ( waiter.operating ) {
            waiter.operating_callbacks.push(callback);
        }
        else {
            waiter.operating++;// = true;
            var waited_callback;
            while ( waited_callback = waiter.operating_callbacks.shift() ) {
                waited_callback();
            }
            result = callback();
            waiter.operating--;// = false;
        }

        return result;

    },/*}}}*/

    /** getActiveProgressbar ** {{{ Находим активный элемент прогрессбара
     */
    getActiveProgressbar : function () {

        var waiter = this,
            that = this,

            selectors = [
                '.progressbar_current',
                '.progressbar',
            ],

            undef
        ;

        for ( var i in selectors ) {
            if ( selectors.hasOwnProperty(i) ) {
                var selector = selectors[i],
                    found = $(selector),
                    _progressbar = found && found.length && found.bem(progressbar)
                ;
                if ( _progressbar ) {
                    return _progressbar;
                }
            }
        }

        return null;

    },/*}}}*/

    /** update_progressbar_details() ** {{{ Обновить детальную информацию о выполняемых задачах.
     */
    update_progressbar_details : function () {

        var waiter = this;

        for ( var id in this.queue ) {
            if ( this.queue.hasOwnProperty(id) ) {
                var title = this.queue[id].options.title || id,
                    percents_done = this.queue[id].percents_done || 0,
                    progressbar = this.queue[id].progressbar || this.getActiveProgressbar()
                ;
                progressbar && progressbar.update_details_item(id, percents_done);
            }
        }

    },/*}}}*/

    /** update_progressbar() {{{ Обновить состояние прогрессбара.
     */
    update_progressbar : function (progressbar) {

        var waiter = this;

        if ( !progressbar ) {
            progressbar = this.getActiveProgressbar();
            if ( !progressbar ) {
                return false;
            }
        }

        // Рассчитываем проценты
        var percents = ( this.past_tasks_count ) ? 100 * this.past_tasks_count / this.total_tasks_count: 0;

        // Если есть активные задачи, то добавляем проценты от них
        if ( this.total_queue_count ) {
            var plus_percents = 0;
            for ( var id in this.queue ) {
                if ( this.queue.hasOwnProperty(id) ) {
                    var percents_done = waiter.queue[id].percents_done;
                    plus_percents += percents_done;
                }
            }
            plus_percents /= this.total_queue_count;
            percents += ( 100 - percents ) * ( plus_percents / 100 );
        }

        percents = Math.round(percents);

        progressbar.set(percents);

        // Если очередь пуста, то сбрасываем накопленное.
        if ( !this.total_queue_count ) {
            this.total_tasks_count = 0;
            this.past_tasks_count = 0;
        }

        this.update_progressbar_details();

    },/*}}}*/

    /** add_queue_empty_callback(callback) ** {{{ Добавляем callback для обработки при опустошении очереди.
     *
     * @param {Callback} callback - Функция для вызова.
     *
     */
    add_queue_empty_callback : function (callback) {

        this.queue_empty_callbacks.push(callback);

    },/*}}}*/

    /** init_timeout_timer() ** {{{ Устанавливаем обработчик задач с таймаутом
     */
    init_timeout_timer : function () {

        var waiter = this,
            that = this
        ;

        this.timer = setInterval(function _interval_init_timeout_timer () {

            that._do(function _do_init_timeout_timer () {

                // Если нет задач с таймаутом, то выходим
                if ( !that.timeouted_tasks_count ) {
                    return;
                }

                // Текущее время
                var current_time = Date.now();

                // Просматриваем все задачи с установленным таймаутом
                var has_changes = 0;
                for ( var id in that.queue ) {
                    if ( that.queue.hasOwnProperty(id) ) {

                        // Значение таймаута из опций
                        var timeout = that.queue[id].options.timeout;
                        // ...если отсутствует, то переходим к следующему
                        if ( !timeout || that.queue[id].timeout_stopped ) { continue; }

                        // Время, прошедшее с момента установки задачи
                        var time_from_start = current_time - that.queue[id].start_time;

                        // Рассчитываем проценты
                        var percents = Math.round( 100 * time_from_start / timeout );
                        // Не больше 100%
                        percents = Math.min( 100, percents );
                        // Если увеличилось
                        if ( percents > that.queue[id].percents_done ) {
                            // ...то сохраняем в свойствах
                            that.queue[id].percents_done = percents;
                            // ....и устанавливаем флаг наличия изменений (обновить прогрессбар и информацию).
                            has_changes++;
                        }

                        // Если таймаут превышен
                        if ( time_from_start >= timeout ) {
                            has_changes++;
                            if ( typeof that.queue[id].options.on_timeout === 'function' ) {
                                that.queue[id].options.on_timeout();
                            }
                            // Если в опциях указано прекращать выполнение задачи...
                            if ( that.queue[id].options.timeout_break ) {
                                // ...то аварийно завершаемся
                                that.finish(id, 'waiter timeout');
                            }
                            else {
                                // ...иначе ставим флаг для прекращения обработки таймаутов на этой задаче
                                that.queue[id].timeout_stopped = true;
                                // ...и уменьшаем счётчик задач с таймаутом
                            }
                            that.timeouted_tasks_count--;
                            continue;
                        }

                    }
                }

                // NOTE: 2016.08.03, 15:51 -- `that.total_queue_count` изменяется за время прохода по очереди???
                if ( has_changes && that.total_queue_count ) {
                    that.update_progressbar();
                }

            });

        }, this.timer_interval);

    },/*}}}*/

    /** tick() ** {{{ Обработка одного или нескольких "тиков" для задачи.
     *
     * @param {String} id - Идентификатор задачи.
     * @param {Number} [ticks=1] - Количество случившихся "тиков" (один по умолчанию).
     * @param {Boolean} [isAbsolute=false] - Абсолютное количество тиков. По умолчанию считаем, что прибавление к текущему счётчику. Иначе устанавливаем счётчик.
     *
     */
    tick : function (id, ticks, isAbsolute) {

        var waiter = this,
            that = this;

        this._do(function _do_tick () {

            ticks = ticks || 1;

            // ???
            if ( !that.queue[id] ) { return; }

            // Всего тиков ожидается
            var total_ticks = that.queue[id].options.ticks;
            // Если не ожидается, то ничего не делаем
            if ( !total_ticks ) { return; }

            // Обновляем значение
            if ( isAbsolute ) {
                that.queue[id].ticks_done = ticks;
            }
            else {
                that.queue[id].ticks_done += ticks;
            }

            // Рассчитываем проценты
            var percents = Math.round( 100 * that.queue[id].ticks_done / total_ticks );
            // Не больше 100%
            percents = Math.min( 100, percents );
            // Если увеличилось
            if ( percents > that.queue[id].percents_done ) {
                // ...то сохраняем в свойствах
                that.queue[id].percents_done = percents;
                // ....и обновляем прогрессбар
                that.update_progressbar();
            }

        });

    },/*}}}*/

    /** reset*() ** {{{ Сбрасываем все ожидаемые задачи
     */
    reset : function () {

        var waiter = this;

        waiter._do(function _do_reset () {

            waiter.triggers = {};
            waiter.queue = {};
            waiter.total_queue_count = 0;
            waiter.past_tasks_count = 0;
            waiter.total_tasks_count = 0;
            waiter.queue_empty_callbacks = [];

            waiter.progressbar && waiter.progressbar.deactivate();

        });

    },/*}}}*/

    /** is_waiting(id) ** {{{ Находится ли задача в состоянии ожидания или есть ли вообще ожидающие задачи
     */
    is_waiting : function (id) {

        return id ? ( this.queue[id] && this.queue[id].count ) : this.total_tasks_count > 0;

    },/*}}}*/

    /** start(id,options) ** {{{ Запуск ожидания события.
     *
     * @param {String} id - Идентификатор события.
     * @param {Object} [options] - Опции события.
     * @param {Number} [options.ticks] - Ожидаемое количество "тиков".
     * @param {Number} [options.timeout] - Ожидаемое время завершения задачи.
     * @param {Boolean} [options.timeout_break] - Прекращать аварийно отслеживание задачи после превышения таймаута
     * @param {Callback} [options.on_finish] - Обработчик успешного завершения.
     * @param {Callback} [options.on_error] - Обработчик аварийного завершения (в параметре описание ошибки, если есть).
     * @param {Callback} [options.on_timeout] - Обработчик на случай превышения таймаута.
     * @param {Callback} [options.on_cancel] - Обработчик для отработки принудительного завершения задачи
     *      (если не указан, возможность завершения отсутствует).
     *
     */
    start : function (id, options) {

        options = options || {};

        var waiter = this,
            that = this,
            undef
        ;

        if ( this.queue[id] ) {
            console.error( 'ERROR: Dublicate waiter id:', id );
            app.error('Попытка создать ожидание с уже существующим ID ('+id+')');
            return null;
        }

        this.operating++;

        var defer = vow.defer(),
            waiter_item = defer.promise();

        waiter_item.id = id;
        waiter_item.count = 1; // ??? пустышка
        waiter_item.start_time = Date.now();
        waiter_item.defer = defer;
        waiter_item.ticks_done = 0;
        waiter_item.percents_done = 0;
        waiter_item.options = options || {};
        waiter_item.progressbar = options.progressbar || this.getActiveProgressbar();

        waiter_item.isFinished = function () {
            return waiter_item._status !== 0;
        };
        // ??? Методы для окончания действия -- продумать схему наименования!
        waiter_item.Done = function (data) {
            that.finish(this, null, data);
            return waiter_item;
        };
        waiter_item.Error = function (error) {
            that.finish(this, error);
            return waiter_item;
        };

        this.queue[id] = waiter_item;

        this.total_queue_count++;
        this.total_tasks_count++;

        // Если установлено значение таймаута
        if ( waiter_item.options.timeout ) {
            if ( ! (this.timeouted_tasks_count++) && !this.timer ) {
                this.init_timeout_timer();
            }
        }

        if ( !waiter_item.options.no_progressbar /* && this.init_progressbar_elem() */ ) {

            var progressbar = waiter_item.progressbar || this.getActiveProgressbar();

            // Добавляем задачу в прогрессбар
            // TODO: 2016.08.01, 15:52 -- +task cancel callback
            progressbar && progressbar.add_details_item(id, waiter_item.options);

            // Обновляем прогрессбар
            this.update_progressbar();

        }

        this.operating--;

        return waiter_item;

        // });

    },/*}}}*/

    /** finish(id, error, data) ** {{{ Завершение ожидания события.
     *
     * @param {String} id - Идентификатор события.
     * @param {*} [error] - Описание ошибки. Если указано, считаем, что задача завершается аварийно.
     * @param {*} [data] - Данные для передачи в колбек и resolve..
     *
     */
    finish : function (waiter_item_or_id, error, data) {

        var waiter = this,
            that = this
        ;

        return this._do(function _do_finish () {

            var id = waiter_item_or_id,
                waiter_item = waiter_item_or_id;

            // Смотрим, что передано: объект или идентификатор
            if ( typeof waiter_item === 'string' ) {
                waiter_item = that.queue[id];
            }
            else {
                id = waiter_item && waiter_item.id;
            }

            // Проверяем на странности
            if ( !waiter_item || !that.queue[id] || !that.queue[id].count ) {
                return false;
            } // WTF???

            // Обрабатываем обратные вызовы (в зависимости от наличия ошибки).
            if ( !error ) {
                if ( typeof data === 'undefined' ) { data = 'waiter finished: '+id; }
                if ( typeof waiter_item.options.on_finish === 'function' ) {
                    waiter_item.options.on_finish(data);
                }
                waiter_item.defer.resolve(data);
            }
            else {
                if ( typeof waiter_item.options.on_error === 'function' ) {
                    waiter_item.options.on_error(error);
                }
                waiter_item.defer.reject(error);
            }

            var progressbar = waiter_item.progressbar || that.getActiveProgressbar();

            // Удаляем задачу из прогрессбара
            if ( !waiter_item.options.no_progressbar ) {
                progressbar && progressbar.remove_details_item(id, waiter_item.options);
            }

            waiter_item.count--;


            // Если задача завершена (нет дубляжей) удаляем запись.
            if ( !waiter_item.count ) {
                that.queue[id] && ( delete that.queue[id] );
                // jsdoc error: Delete of an unqualified identifier in strict mode. -- ???
                // waiter_item && ( delete waiter_item );
            }

            // Обновляем счётчики.
            that.total_queue_count--;
            that.past_tasks_count++;

            // Обновляем прогрессбар
            !waiter_item.options.no_progressbar && that.update_progressbar();

            // Проверяем триггеры
            that._look_for_trigger(id);

            // Если очередь пуста...
            if ( !that.total_queue_count ) {
                // ...деактивируем прогрессбар и...
                progressbar && progressbar.deactivate();
                that.timeouted_tasks_count = 0;
                // ...отрабатываем обратные вызовы
                var callback;
                while ( callback = that.queue_empty_callbacks.shift() ) {
                    callback();
                }
            }

            return true;

        });

    },/*}}}*/

    /** done(id, data) ** {{{ Нормальное завершение ожидания события.
     *
     * @param {String} id - Идентификатор события.
     * @param {*} error - Описание ошибки.
     *
     */
    done : function (id, data) {

        return this.finish(id, null, data);

    },/*}}}*/

    /** error(id, error) ** {{{ Аварийное завершение ожидания события.
     *
     * @param {String} id - Идентификатор события.
     * @param {*} error - Описание ошибки.
     *
     */
    error : function (id, error) {

        return this.finish(id, error);

    },/*}}}*/

    /** _look_for_trigger(id) ** {{{ Проверяем триггеры для данной (id) задачи.
     *
     * @param {String} id - Идентификатор задачи.
     *
     */
    _look_for_trigger : function (id) {

        var waiter = this;

        // waiter._do(function(){

            for ( var trigger_id in waiter.triggers ) {
                if ( ! waiter.triggers[trigger_id].wait_for[id] ) { continue; }
                // delete waiter.triggers[trigger_id].wait_for[exOf(id)
                if ( ! --waiter.triggers[trigger_id].wait_for[id] ) {
                    delete waiter.triggers[trigger_id].wait_for[id];
                    if ( ! Object.keys(waiter.triggers[trigger_id].wait_for).length  ) {
                        if ( typeof waiter.triggers[trigger_id].todo === 'function' ) {
                            waiter.triggers[trigger_id].todo(trigger_id, id);
                        }
                        delete waiter.triggers[trigger_id];
                    }
                }
            }

        // });

    },/*}}}*/

    /** set_trigger(trigger_id, ids, todo) ** {{{ Устанавливаем триггер.
     *
     * @param {String} trigger_id - Идентификатор триггера.
     * @param {String[]} ids - Идентификаторы группируемых задач.
     * @param {Callback} todo - Функция, выполняемая при завершении всех задач.
     *
     */set_trigger : function (trigger_id, ids, todo) {

        var waiter = this;

        waiter._do(function _do_set_trigger () {

            if ( typeof waiter.triggers[trigger_id] === 'undefined' ) {
                waiter.triggers[trigger_id] = {
                    wait_for : {},
                    todo : todo,
                };
            }
            else if ( typeof todo !== 'undefined' ) {
                waiter.triggers[trigger_id].todo = todo;
            }
            Array.isArray(ids) && ids.map(function(id) {
                if ( typeof waiter.triggers[trigger_id].wait_for[id] === 'undefined' ) { waiter.triggers[trigger_id].wait_for[id] = 0; }
                waiter.triggers[trigger_id].wait_for[id]++;
            });

        });

    },/*}}}*/

};

window && ( window.waiter = waiter );

provide(waiter);

});
