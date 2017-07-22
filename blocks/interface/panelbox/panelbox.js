/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true */
/* globals modules, app, project */
/**
 *
 * @module panelbox
 * @overview Управление набором секций экрана (вертикальное деление).
 * @author lilliputten <lilliputten@yandex.ru>
 * @since ~2016.04
 * @version 2016.12.07, 15:17
 *
*/

modules.define('panelbox', [
    // 'box_actions__action',
    'i-bem-dom',
    'checkbox-group',
    'button',
    'split_view',
    'boxing',
    'boxing_sync',
    'events__channels',
    'vow',
    'store',
    'jquery',
],
function(provide,
    // box_actions__action,
    BEMDOM,
    CheckboxGroup,
    Button,
    split_view,
    boxing,
    boxing_sync,
    channels,
    vow,
    store,
    $
) {

/**
 *
 * @class panelbox
 * @classdesc Управление вертикальным набором секций (изменение высоты, скрытие, показ етс).
 *
 *
 * TODO
 * ====
 *
 * 2016.11.30, 14:31 -- Переделать механизм анимации и синхронизации (последовательные изменения высот различных секций перебивают друг друга; запуск анимаций одной процедуры с задержками, в результате чего видны артефакты -- что-то изменяется с задержкой...)
 *
 * DONE -- 2016.10.17, 16:36 -- Двойной клик на кнопке показа/сокрытия секций (!).
 *
 * DONE -- 2016.08.19, 13:28 -- Эффект при изменении высоты блока. (Не `animate`!)
 *
 * ОПИСАНИЕ
 * ========
 *
 * Управление вложенными секциями (с переменной высотой).
 *
 * Создаваемые события
 * ===================
 *
 */

provide(BEMDOM.declBlock(this.name,  /** @lends panelbox.prototype */ {

    // Данные...

    /** {number} boxing_animate_time ** {{{ Время анимации компонент
     */
    boxing_animate_time : 250,
    /*}}}*/

    /** {object} boxing_controllers ** {{{ Внутренние управляторы секциями
     * @see {{@link #set_boxing_controller_state}, {@link #find_boxing_controllers}
     */
    boxing_controllers : {},
    /*}}}*/

    /** {object[]} pendingActions ** {{{
     */
    pendingActions : [],
    /*}}}*/

    // Методы...

    // /** _do(callback) ** {{{ Выполнение критичной процедуры: отложенное или сразу, с учётом флага занятости.
    //  * @param {Callback} callback
    //  *
    //  * @see См. {@link app#operating}, {@link app#operating_callbacks}
    //  *
    //  */
    // _do : function (callback) {
    //
    //     ( this.operating_callbacks || ( this.operating_callbacks = [] ) ).push(callback);
    //
    //     if ( !this.operating ) {
    //         this.operating = true;
    //         while ( waited_callback = this.operating_callbacks.shift() ) {
    //             waited_callback();
    //         }
    //         this.operating = false;
    //     }
    //
    // },/*}}}*/

    /** action_set_css() ** {{{ Установить css-параметры элемента
     *
     * @param {object} opts - Опции
     * @param {dom} opts.target - Элемент, высоту которого меняем
     * @param {boolean|number} [opts.animate] - Анимировать изменение или применять сразу.
     * Если численное значение, то исползьуется в качестве длительности анимации
     * (вместо стандартного {@link #boxing_animate_time}).
     * @param {object} [opts.css] - Хэш ключей/значений css свойств.
     * @param {object} [opts.classes] - Хэш классов для установки (ключ -- имя класса, значение {boolean} -- установить/снять).
     * @param {boolean} [opts.set_boxing_hidden] - Устанавливать ли класс `boxing_hidden` (устанавливается до анимации, снимается после).
     *
     * @returns {Promise|null}
     */
    action_set_css : function (opts) {

        // если нечего делать
        if ( !opts || !opts.target || !opts.css ) {
            return null;
        }

        var panelbox = this,
            that = this,
            params = this.params,

            // Целевой dom-элемент
            target = ( opts.target.domElem ) ? $(opts.target.domElem) : opts.target,

            // Длительность анимации, если не установлено или *пусто*, то не анимируем
            animate = !opts.animate ? false : ( typeof opts.animate === 'number' ) ? opts.animate : this.boxing_animate_time,

            // Флаг установки/снятия класса `boxing_hidden`
            set_boxing_hidden = opts.set_boxing_hidden,

            actions_begin = function () {

                // Если надо снять класс boxing_hidden
                if ( set_boxing_hidden === false ) {
                    target.removeClass('boxing_hidden');
                }

                // // Если указаны классы для установки
                // opts.classes && typeof opts.classes === 'object' && Object.keys(opts.classes).map(function(id){
                //     target.toggleClass(id, !!opts.classes[id]);
                // });

            },

            actions_end = function () {

                // Если задан колбек...
                if ( typeof opts.on_action_end === 'function' ) {
                    // Вызываем метод (в контексте текущего объекта) с опциями в параметрах
                    opts.on_action_end.apply(that, opts.on_action_end, [opts]);
                }

                // Если надо установить класс boxing_hidden
                if ( set_boxing_hidden === true ) {
                    target.addClass('boxing_hidden');
                }

            },

            undef
        ;

        // Начальные действия
        actions_begin();

        // Если анимируем
        if ( animate ) {
            // ...то возвращаем промис на окончание анимации
            return new vow.Promise(function(resolve,reject){
                target.animate(opts.css, animate, function _animate_done () {
                    // Завершаем действия
                    actions_end();
                    // Завершаем промис
                    return resolve(opts);
                });
            });
        }
        // Иначе...
        else {
            // ...просто устанавливаем свойства
            target.css(opts.css);
            // Завершаем действия
            actions_end();
        }

        return null;

    },/*}}}*/

    // /** action_toggle_box ** {{{ Показать/спрятать блок
    //  * @param {object} opts - Опции. См. перечень свойств в action_set_css, кроме:
    //  * @param {boolean} [opts.show=false] - Флаг: показывать или прятать блок.
    //  */
    // action_toggle_box : function (opts) {
    //
    //     // если нечего делать
    //     if ( !opts.target ) {
    //         return null;
    //     }
    //
    //     var panelbox = this,
    //         that = this,
    //         params = this.params,
    //
    //         target = opts.target = ( opts.target.domElem ) ? $(opts.target.domElem) : opts.target,
    //
    //         undef
    //     ;
    //
    //     if ( opts.show ) {
    //         target.removeClass('boxing_hidden');
    //     }
    //
    //     var container = target.children('.boxing_container');
    //     var containerHeight = container.outerHeight();//parseInt(containerHeight,10);
    //     that.changed_height += ( to_display ) ? containerHeight: -containerHeight;
    //     var
    //         set_height = ( to_display ) ? containerHeight+'px': 0,
    //         set_opacity = ( to_display ) ? 1: 0;
    //     that.action_set_css({
    //         target : $box_block,
    //         animate : true,
    //         set_boxing_hidden : !to_display,
    //         // classes : {
    //         //    boxing_hidden : !to_display,
    //         // },
    //         css : {
    //             height : set_height,
    //             opacity : set_opacity,
    //         },
    //     });
    //
    //
    // },/*}}}*/

    /** apply_pending_actions() ** {{{
     */
    apply_pending_actions : function () {

        var panelbox = this,
            that = this,
            params = this.params,

            panelboxId = params.id,
            // Складываем промисы для каждого действия
            promises_list = [],

            // Итератор для действий
            action,

            undef
        ;

        // Проходим по всем действиям
        while ( ( action = this.pendingActions.shift() ) !== undefined ) {
            // ...Если функция...
            if ( typeof action.method === 'function' ) {
                // Вызываем метод (в контексте panelbox)
                promises_list.push( action.method.call(this, action.opts) );
            }
        }

        // Возвращаем общий промис
        var promise = vow.all(promises_list);

        promise
            .then(function(data){
                that._emit('actions_done');
            })
        ;

        return promise;

    },/*}}}*/

    /** collect_target_actions() ** {{{ Изменяем высоту бокса
     * @param {DOM} box - DOM-элемент бокса для изменения.
     * @param {array} actions_list - Список действий.
     * @param {number} height - Требуемая высота.
     */
    collect_target_actions : function (box, actions_list, height, opts) {

        var panelbox = this,
            that = this,
            params = this.params,

            // // jQuery коллекция
            // box = $(target_dom),

            // ID бокса
            id = box.attr('id'),

            // BEM-объект для получения доп. параметров
            boxing = box.bem(boxing),

            borders_height = parseInt(box.css('border-top-width'),10) + parseInt(box.css('border-bottom-width'),10),
            inner_height = height - borders_height,

            undef
        ;

        if ( box.outerHeight() !== height ) {
            actions_list.push({
                method : that.action_set_css,
                opts : {
                    target : box,
                    animate : !opts.force_init, // Если force_init, то не анимируем
                    css : {
                        height : height+'px',
                    },
                },
            });

        }

    },/*}}}*/

    /** collect_actions(opts) ** {{{
     *
     * @param {object} opts - Опции
     * @param {boolean} [opts.update_displayed] - Обновить только видимые
     * @param {object} [opts.set_boxes] - Хэш пар идентификатор секции : значение флага видимости (показать/спрятать)
     * @param {boolean} [opts.force_init] - Принудительно обновить высоту вложенных секций
     *
     * @returns {array} - Список действия для `pendingActions`
     *
     */
    collect_actions : function (opts) {

        var panelbox = this,
            that = this,
            params = this.params,

            // Свойства объекта
            panelboxId = params.id,
            panelboxDom = $(panelbox.domElem),

            // Селектор для поиска вложенных "определяющих" блоков
            selector = '.boxing_sz_origin',

            // Аккумулируем изменения
            changed_boxes_count = 0,
            changed_height = 0,
            summaryHeight = 0,

            actions_list = [],

            undef
        ;

        // Проходим по всем элементам
        panelboxDom.children(selector).map(function(){

            var

                // dom-элемент секции
                box = $(this),

                // Идентификатор
                box_id = box.attr('id'),

                // Текущее состояние секции
                displayed_now = !box.hasClass('boxing_hidden') || box.is(':visible'),

                // Требуемуе состояние секции
                to_display = ( opts.set_boxes && typeof opts.set_boxes[box_id] !== 'undefined' ) ? opts.set_boxes[box_id] : displayed_now,

                // Находим контейнер и получаем его высоту
                container = box.children('.boxing_container'),
                containerHeight = container.outerHeight(),

                undef
            ;

            // Если состояние изменилось или запуск с флагом force_init (onInit)...
            if ( opts.force_init || to_display !== displayed_now || ( opts.update_displayed && to_display ) ) {

                // Сохраняем значение офлайн
                store.set(panelboxId + '_boxing_show_' + box_id, to_display );

                // Устанавливаем переключатели
                panelbox.set_boxing_controller_state(box_id, to_display);

                // ВАЖНО: Перед получением высоты блока снять класс `boxing_hidden`!
                if ( to_display && box.hasClass('boxing_hidden') ) {
                    box.removeClass('boxing_hidden');
                    // ...и обновить высоту
                    containerHeight = container.outerHeight();
                }

                // Суммируем общее изменение высоты
                changed_height += ( to_display ) ? containerHeight: -containerHeight;

                // Количество изменённых/обновлённых секций
                changed_boxes_count++;

                // Сохраняем действие в очередь
                actions_list.push({
                    method : that.action_set_css,
                    opts : {
                        target : box,
                        animate : !opts.force_init, // Если force_init, то не анимируем
                        set_boxing_hidden : !to_display,
                        css : {
                            height : ( to_display ) ? containerHeight+'px': 0,
                            opacity : ( to_display ) ? 1: 0,
                        },
                    },
                });

            }

            // Суммируем высоту видимых блоков
            if ( to_display ) {
                summaryHeight += containerHeight;
            }

        });

        // Если есть изменения...
        if ( changed_boxes_count && changed_height ) {
            // Устанавливаем высоту для "зависимых" секций
            panelboxDom.children('.boxing_sz_target').map(function(){
                var target = $(this),
                    current_height = target.height(),
                    set_height = current_height - changed_height
                ;
                that.collect_target_actions(target, actions_list, set_height, opts);
            });
        }

        return actions_list;

    },/*}}}*/

    // /** show_boxes() ** {{{ (новый) Показываем/прячем секции
    //  * @param {object} all_boxes - Хэш пар идентификатор секции : значение флага видимости (показать/спрятать)
    //  */
    // show_boxes : function (opts) {
    //
    //     var panelbox = this,
    //         that = this,
    //         params = this.params,
    //
    //         // Свойства объекта
    //         panelboxId = params.id,
    //         panelboxDom = $(panelbox.domElem),
    //
    //         // Аккумулируем изменения
    //         changed_boxes_count = 0,
    //         changed_height = 0,
    //
    //         undef
    //     ;
    //
    //     // Проверяем инкрементальный флаг,
    //     // устанавливаем отложенное действие
    //     if ( panelbox.reboxing ) {
    //         panelbox.queuedReboxing || ( panelbox.queuedReboxing = [] );
    //         panelbox.queuedReboxing.push(this.show_boxes, [all_boxes]); // ???
    //         return null;
    //     }
    //     // ...или приступаем к изменению сейчас
    //     else {
    //         panelbox.reboxing = true;
    //     }
    //
    //     // Получаем список действий...
    //     var actions_list = this.collect_actions(opts);
    //     // ...и добавляем его к текущему списку
    //     this.pendingActions = this.pendingActions.concat(actions_list);
    //
    //     // Применяем накопленные действия
    //     var promise = this.apply_pending_actions();
    //
    //     // По завершению всех действий сбрасываем флаг занятости
    //     promise
    //         .then(function(){
    //             panelbox.reboxing = false;
    //         })
    //     ;
    //
    //     return promise;
    //
    //
    //     /*{{{ OLD WORKING CODE
    //     // Проходим по всем указанным секциям...
    //     Object.keys(all_boxes).forEach(function(box_id) {
    //         var
    //             // Требуемуе состояние секции
    //             to_display = all_boxes[box_id],
    //             // Находим секцию по ID
    //             box = panelboxDom.children('.boxing_optional#' + box_id),
    //             // Текущее состояние секции
    //             displayed_now = !box.hasClass('boxing_hidden')
    //         ;
    //         // Если состояние изменилось...
    //         if ( to_display !== displayed_now ) {
    //             // Сохраняем значение офлайн
    //             store.set(params.id + '_boxing_show_' + box_id, to_display );
    //             // Устанавливаем переключатели
    //             panelbox.set_boxing_controller_state(box_id, to_display);
    //             // ВАЖНО: Перед получением высоты блока снять класс `boxing_hidden`!
    //             to_display && box.removeClass('boxing_hidden');
    //             // Находим контейнер и получаем его высоту
    //             var container = box.children('.boxing_container'),
    //                 containerHeight = container.outerHeight();
    //             // Суммируем общее изменение высоты
    //             changed_height += ( to_display ) ? containerHeight: -containerHeight;
    //             // Количество изменённых секций
    //             changed_boxes_count++;
    //             // Сохраняем действие в очередь
    //             that.pendingActions.push({
    //                 method : that.action_set_css,
    //                 opts : {
    //                     target : box,
    //                     animate : true,
    //                     set_boxing_hidden : !to_display,
    //                     css : {
    //                         height : ( to_display ) ? containerHeight+'px': 0,
    //                         opacity : ( to_display ) ? 1: 0,
    //                     },
    //                 },
    //             });
    //         }
    //     });
    //
    //     // Если есть изменения...
    //     if ( changed_boxes_count && changed_height ) {
    //         // Устанавливаем высоту для "зависимых" секций
    //         panelboxDom.children('.boxing_sz_target').map(function(){
    //             var current_height = $(this).height(),
    //                 set_height = current_height - changed_height;
    //             that._resize_target_box(this, set_height, false);
    //         });
    //     }
    //
    //     // Применяем накопленные действия
    //     var promise = that.apply_pending_actions();
    //
    //     promise
    //         .then(function(){
    //             panelbox.reboxing = false;
    //         })
    //     ;
    //
    //     return promise;
    //     }}}*/
    //
    // },
    // /*}}}*/
    /** show_boxes() ** {{{ (старый) Показываем/прячем секции */
    show_boxes : function (all_boxes) {

        var panelbox = this,
            that = this,
            params = this.params,
            panelboxId = params.id,
            $panelbox = $(panelbox.domElem),

            boxes_re_str = '\\b(' + Object.keys(all_boxes).join('|') + ')\\b',
            boxes_re = new RegExp (boxes_re_str),

            undef
        ;

        // Проверяем инкрементальный флаг
        if ( panelbox.reboxing ) { return; } else { panelbox.reboxing = 1; }

        // walk thru all items in selector...
        var changed_boxes_count = 0;
        var changed_height = 0;
        // Due to closures in animate using closures instead loop
        Object.keys(all_boxes).forEach(function(box_id) {
            var to_display = all_boxes[box_id];
            var box = $panelbox.children('.boxing_optional#' + box_id);
            var $box_block = $(box);
            var displayed_now = ! $box_block.hasClass('boxing_hidden');
            // if changed state...
            if ( to_display !== displayed_now ) {
                channels(params.id).emit('toggle_box', {
                    box_id : box_id,
                    show : to_display,
                });
                store.set(params.id + '_boxing_show_' + box_id, to_display );
                panelbox.set_boxing_controller_state(box_id, to_display);
                if ( to_display ) {
                    $box_block.removeClass('boxing_hidden');
                }
                var container = $box_block.find('.boxing_container');
                var containerHeight = container.css('height');
                var container_height_int = parseInt(containerHeight,10);
                changed_height += ( to_display ) ? container_height_int: -container_height_int;
                var boxing_animate_time = panelbox.boxing_animate_time;
                if ( !to_display ) { boxing_animate_time += 150; } // ??? WTF?
                boxing_animate_time += 150; // ??? -- 2016.10.17, 15:49
                panelbox.reboxing++;
                var
                    set_height = ( to_display ) ? containerHeight: 0,
                    set_opacity = ( to_display ) ? 1: 0;
                $box_block.animate({
                    height : set_height,
                    opacity : set_opacity,
                }, boxing_animate_time , function() {
                    if ( !to_display ) {
                        $box_block.addClass('boxing_hidden');
                    }
                    panelbox.reboxing--;
                });
                changed_boxes_count++;
            }
        });
        if ( changed_boxes_count && changed_height ) {
            // recalculate all heights
            $panelbox.children('.boxing_sz_target').map(function(){
                var current_height = $(this).height(),
                    set_height = current_height - changed_height;
                that._resize_target_box(this, set_height, false);
            });
        }

        panelbox.reboxing--;

    },
    /*}}}*/

    // /** show_boxes_from_checkbox() ** {{{ (новый) Показываем/прячем секции (из чекбокса) */
    // show_boxes_from_checkbox : function (boxes, selector) {
    //
    //     var panelbox = this;
    //
    //     var set_boxes = {};
    //
    //     // walk thru all items in selector...
    //     var changed_boxes_count = 0;
    //     // var summaryHeight = 0;
    //     var changed_height = 0;
    //     selector.getCheckboxes().forEach( function (item) {
    //         var box_id = item.getVal();
    //         var to_display = ( boxes.indexOf(box_id) !== -1 );
    //         set_boxes[box_id] = to_display;
    //     } );
    //
    //     this.show_boxes({ set_boxes : set_boxes });
    //
    // },
    // /*}}}*/
    /** show_boxes_from_checkbox() ** {{{ (старый) Показываем/прячем секции (из чекбокса) */
    show_boxes_from_checkbox : function (boxes, selector) {

        var panelbox = this;

        var all_boxes = {};

        // walk thru all items in selector...
        var changed_boxes_count = 0;
        // var summaryHeight = 0;
        var changed_height = 0;
        selector.getCheckboxes().forEach( function (item) {
            var box_id = item.getVal();
            var to_display = ( boxes.indexOf(box_id) !== -1 );
            all_boxes[box_id] = to_display;
        } );

        this.show_boxes(all_boxes);

    },
    /*}}}*/

    /** init_boxes() ** {{{ Инициализируем секции */
    init_boxes : function () {

        var panelbox = this,
            that = this,
            params = this.params,
            $panelbox = $(this.domElem),
            undef
        ;

        $panelbox.children().map(function(){
            var $box_block = $(this);
            var state = !$box_block.hasClass('boxing_hidden');
            var box_id = $box_block.attr('id');
            var stored_state = store.get(params.id + '_boxing_show_' + box_id);
            if ( typeof stored_state === 'boolean' /* && stored_state !== state */ ) {
                state = stored_state;
                if ( state ) {
                    $box_block.removeClass('boxing_hidden');
                }
                else {
                    $box_block.addClass('boxing_hidden');
                }
                // XXX
                panelbox.set_boxing_controller_state(box_id, state);
            }
            if ( !state ) {
                $box_block.css({
                        height : 0,
                        opacity : 0,
                });
            }
        });

    },
    /*}}}*/

    /** _resize_target_box() ** {{{ Изменяем высоту бокса
     * @param {DOM} box_dom - DOM-элемент бокса для изменения.
     * @param {number} height - Требуемая высота.
     * @param {boolean} onInit - Флаг: работаем при инициализации? (используется для определения вида/специфики эффекта изменения высоты)
     */
    _resize_target_box : function (box_dom, height, onInit) {

        var
            that = this,
            params = this.params,

            // jQuery коллекция
            $box = $(box_dom),
            // ID бокса
            id = $box.attr('id'),
            // BEM-объект для получения доп. параметров
            _boxing = $box.bem(boxing),
            // Время анимации
            animate_time = ( onInit ) ? 0: this.boxing_animate_time,

            borders_height = parseInt($box.css('border-top-width'),10) + parseInt($box.css('border-bottom-width'),10),
            inner_height = height - borders_height,

            undef
        ;

        if ( $box.outerHeight() !== height ) {
            $box.animate({
                height : height,
            }, animate_time, function() {
            });
        }

        var childbox;

        // Если вложенный panelbox...
        if ( $box.hasClass('panelbox') ) {
            var _panelbox = { getEntityName : function () { return 'panelbox'; } }; // ???
            childbox = $box.bem(_panelbox);
            if ( typeof childbox.recalc_heights === 'function' ) {
                childbox.recalc_heights(true, inner_height);
            }
        }
        // Если вложенный split_view...
        if ( $box.hasClass('split_view') ) {
            childbox = $box.bem(split_view);
            if ( typeof childbox.resize === 'function' ) {
                childbox.resize(inner_height);
            }
        }

        // Если надо синхронизировать вложенные блоки...
        else if ( _boxing.getMod('sz_sync_inside') ) {
            $box.find('.boxing_sync').map(function(){
                var $sync = $(this),
                    // Получаем параметры
                    sync = $sync.bem(boxing_sync),
                    // С кем синхронизируемся: ID или ID[]
                    sync_with = sync.params.sync_with,
                    // Изменение высоты относительно родительского блока
                    sync_offset = Number(sync.params.sync_offset) || 0,
                    sync_height = inner_height + sync_offset,
                    undef
                ;
                if ( !sync_with || ( Array.isArray(sync_with) && sync_with.indexOf(id) !== -1 ) || id === sync_with ) {
                    $sync.animate({
                        height : sync_height,
                    }, animate_time, function() {
                    });
                }
            });
        }

    },/*}}}*/

    // /** recalc_heights() ** {{{ (новый) Перерассчитываем высоты вложенных блоков
    //  * @param {boolean} onInit - Режим "инициализации": устанавливаем параметры секций
    //  * @param [{number}] realHeight - Высота контейнера (если вложенный panelbox, то передаётся от родителя -- чтобы не ловить ошибочное значение, если во время анимации)
    //  */
    // recalc_heights : function (onInit, realHeight) {
    //
    //     var panelbox = this,
    //         that = this,
    //         params = this.params,
    //
    //         // Свойства объекта
    //         panelboxId = params.id,
    //         panelboxDom = $(this.domElem),
    //
    //         // Аккумулируем изменения
    //         summaryHeight = 0,
    //
    //         undef
    //     ;
    //
    //     // Проверяем инкрементальный флаг,
    //     // устанавливаем отложенное действие
    //     if ( panelbox.reboxing ) {
    //         panelbox.queuedReboxing || ( panelbox.queuedReboxing = [] );
    //         panelbox.queuedReboxing.push(this.recalc_heights, [onInit, realHeight]);
    //         return null;
    //     }
    //     // ...или приступаем к изменению сейчас
    //     else {
    //         panelbox.reboxing = true;
    //     }
    //
    //     if ( onInit ) {
    //         this.init_boxes();
    //     }
    //
    //     // if ( this.getMod('split') === 'left' ) {
    //     //     $('.screenholder').hide();
    //     // }
    //
    //     panelboxDom.children('.boxing_sz_origin:not(.boxing_hidden)').map(function(){
    //         var box = $(this),
    //             container = box.children('.boxing_container'),
    //             containerHeight = container.outerHeight(),
    //             undef
    //         ;
    //         if ( onInit ) {
    //             // box.css('height', containerHeight); // XXX
    //             that.pendingActions.push({
    //                 method : that.action_set_css,
    //                 opts : {
    //                     target : box,
    //                     animate : false,
    //                     // set_boxing_hidden : !to_display,
    //                     css : {
    //                         height : containerHeight+'px',
    //                     },
    //                 },
    //             });
    //         }
    //         summaryHeight += containerHeight;
    //     });
    //
    //     var
    //         // Высота контейнера (переданная "сверху" в параметре или из свойств dom объекта)
    //         containerHeight = ( typeof realHeight !== 'undefined' ) ? realHeight : panelboxDom.innerHeight(),
    //         // Требуемая высота (за вычетом "исходных" секций)
    //         targetHeight = containerHeight - summaryHeight;
    //
    //     // Устанавливаем высоту для "зависимых" секций
    //     panelboxDom.children('.boxing_sz_target').map(function(){
    //         that._resize_target_box(this, targetHeight, onInit);
    //     });
    //
    //     // Применяем накопленные действия
    //     var promise = that.apply_pending_actions();
    //
    //     promise
    //         .then(function(){
    //             panelbox.reboxing = false;
    //         })
    //     ;
    //
    //     return promise;
    //
    // },/*}}}*/
    /** recalc_heights() ** {{{ (Старый) Перерассчитываем высоты вложенных блоков
     * @param {boolean} onInit - Режим "инициализации": устанавливаем параметры секций
     * @param [{number}] realHeight - Высота контейнера (если вложенный panelbox, то передаётся от родителя -- чтобы не ловить ошибочное значение, если во время анимации)
     */
    recalc_heights : function (onInit, realHeight) {

        var
            that = this,
            params = this.params,

            // Свойства объекта
            panelboxId = params.id,
            panelboxDom = $(this.domElem), // ???

            // Аккумулируем изменения
            summaryHeight = 0,

            undef
        ;

        // Проверяем инкрементальный флаг,
        // устанавливаем отложенное действие
        if ( this.reboxing ) {
            this.queuedReboxing || ( this.queuedReboxing = [] );
            this.queuedReboxing.push(this.recalc_heights, [onInit, realHeight]);
            return null;
        }
        // ...или приступаем к изменению сейчас
        else {
            this.reboxing = true;
        }

        if ( onInit ) {
            this.init_boxes(); // Надо удалить любым способом!
        }

        // Проходим по секциям-источникам (неизменным, определяющим высоту других)
        var originBoxes = panelboxDom.children('.boxing_sz_origin:not(.boxing_hidden)');
        originBoxes.map(function(){
            var box = $(this), // ???
                container = box.children('.boxing_container'),
                containerHeight = container.outerHeight(),
                undef
            ;
            if ( onInit ) {
                that.pendingActions.push({
                    method : that.action_set_css,
                    opts : {
                        target : box,
                        animate : false,
                        css : {
                            height : containerHeight+'px',
                        },
                    },
                });
            }
            summaryHeight += containerHeight;
        });

        var
            // Высота контейнера (переданная "сверху" в параметре или из свойств dom объекта)
            containerHeight = ( typeof realHeight !== 'undefined' ) ? realHeight : panelboxDom.innerHeight(),
            // Требуемая высота (за вычетом "исходных" секций)
            targetHeight = containerHeight - summaryHeight;

        // Устанавливаем высоту для "зависимых" секций
        var targetBoxes = panelboxDom.children('.boxing_sz_target');
        targetBoxes.map(function(){
            that._resize_target_box(this, targetHeight, onInit);
        });

        // Применяем накопленные действия
        var promise = that.apply_pending_actions();

        promise
            .then(function(){
                this.reboxing = false;
            }, this)
        ;

        return promise;

    },/*}}}*/

    /*{{{*/find_boxing_controllers : function () {

        var panelbox = this;

        this.boxing_controllers = {};
        this.findChildBlocks({ block : CheckboxGroup, modName : 'boxing', modVal : 'controller' }).map(function(selector){
            var selector_id = selector.getName();
            selector.getCheckboxes().forEach( function (item) {
                var box_id = item.getVal();
                if ( !panelbox.boxing_controllers[box_id] ) { panelbox.boxing_controllers[box_id] = []; }
                panelbox.boxing_controllers[box_id].push({ type : 'checkbox-group', object : selector });
            });
        });
        this.findChildBlocks({ block : Button, modName : 'boxing_controller', modVal : true }).map(function(button){
            var action = button.domElem.bem(BEMDOM.entity('box_actions', 'action'));
            var boxes = action.params.boxes;
            if ( boxes && !Array.isArray(boxes) ) { boxes = [ boxes ]; }
            boxes && boxes.forEach(function(box_id) {
                if ( !panelbox.boxing_controllers[box_id] ) { panelbox.boxing_controllers[box_id] = []; }
                panelbox.boxing_controllers[box_id].push({ type : 'button', object : button });
            });
        });

        // checkbox-group_boxing_controller

    },/*}}}*/

    /*{{{ ??? */show_box : function (box_id, state) {

        if ( typeof state === 'undefined' ) { state = true; }

        var panelbox = this;
        var $panelbox = $(panelbox.domElem); // ???

        $panelbox.children('.boxing_optional#' + box_id).map(function(){
            var $box_block = $(this); // ???
            var old_state = !$box_block.hasClass('boxing_hidden');
            if ( old_state !== state ) {
                var containerHeight = $box_block.find('.boxing_container').css('height'),
                    set_height = ( state ) ? containerHeight: 0,
                    set_opacity = ( state ) ? 1: 0;
                $box_block.animate({
                    height : set_height,
                    opacity : set_opacity,
                }, this.boxing_animate_time /*, function() {}*/);
                panelbox.set_boxing_controller_state(box_id, state);
                if ( state ) {
                    $box_block.removeClass('boxing_hidden');
                }
                else {
                    $box_block.addClass('boxing_hidden');
                }
            }
        });

    },/*}}}*/
    /*{{{ ??? */hide_box : function (box_id) {

        this.show_box(box_id, false);

    },/*}}}*/

    /*{{{*/set_boxing_controller_state : function (box_id, state) {

        if ( Array.isArray(this.boxing_controllers[box_id]) ) {

            this.boxing_controllers[box_id].forEach(function(controller) {
                var object = controller.object,
                    type = controller.type;

                if ( !object ) { return; }

                if ( type === 'checkbox-group' ) {
                    var val = object.getVal();
                    var found = val.indexOf(box_id);
                    if ( state && found === -1 ) {
                        val.push(box_id);
                    }
                    if ( !state && found !== -1 ) {
                        val.splice(found,1);
                    }
                    object.setVal(val);
                }
                else if ( type === 'button' ) {
                    object.setMod('checked', state);
                }
            });

        }

    },/*}}}*/

    /** update ** {{{ Обновить высоту контейнера и вложенных секций
     * @param {Number} targetHeight - Конечная высота, под которую изменяем вложенные секции
     */
    update : function (targetHeight) {

        return this.recalc_heights(true, targetHeight);

    },/*}}}*/

    /** _init_actions() ** {{{ Инициализация действий, событий и пр.
     */
    _init_actions : function () {

        var panelbox = this,
            that = this,
            params = this.params,
            undef
        ;

        this._events().on('update', function(e, data) {
            that.update(data.height);
        });

        // Если panelbox "главный" (или отдельный?), то отлавливаем глобальные изменения...
        if ( this.hasMod('root') ) {

            // Событие на перерасчёт блоков для всех элементов panelbox (для главного блока)
            app.register_channel_event('panelbox', 'layout_resize', function(e, data) {
                that.recalc_heights(true);
            });

            // Или если изменилась геометрия экрана...
            this._domEvents(BEMDOM.win)
                .on('resize', function() {
                    that.recalc_heights(true);
                })
            ;

        }

        // Событие на перерасчёт только для текущего panelbox
        app.register_channel_event(this.params.id, 'layout_resize', function(e, data) {
            that.recalc_heights(true);
        });

        // Показываем/прячем секции (с кнопки) ???
        app.register_channel_event(this.params.id, 'box_actions_toggle_boxes', function(e, set_boxes) {
            that.show_boxes(set_boxes);
        });
        // Показываем/прячем секции (из чекбоксов) ???
        app.register_channel_event(this.params.id, 'box_actions_show_boxes', function(e, data) {
            that.show_boxes_from_checkbox(data.val, data.selector);
        });

    },/*}}}*/

    /** _on_inited() ** {{{ Инициализация блока
     */
    _on_inited : function () {

        var panelbox = this,
            that = this,
            params = this.params,
            undef
        ;

        params.id = params.id || params.panelbox_id || 'default_panelbox';

        this._split_view = this.findParentBlock(split_view);

        this.find_boxing_controllers();

        this._init_actions();

        this.recalc_heights(true);

    },/*}}}*/

    /** onSetMod ** {{{ */
    onSetMod : {

        /*{{{*/'js' : {
            'inited' : function() {

                var panelbox = this,
                    that = this,
                    params = this.params,
                    undef
                ;

                this._on_inited();

            },
        },/*}}}*/

    },/*}}}*/

}));

});

