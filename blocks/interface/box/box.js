/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqnull:true, browser:true */
/* globals modules, BEMHTML, app, project */
/**
 *
 * @module box
 * @overview Базовый блок организации интерфейсной разметки
 *
 * @author lilliputten <lilliputten@yandex.ru>
 * @since 2017.02.27 14:11:56
 * @version 2017.02.27 14:11:56
 *
 * $Date: 2017-07-21 22:01:17 +0300 (Fri, 21 Jul 2017) $
 * $Id: box.js 8794 2017-07-21 19:01:17Z miheev $
 *
*/

modules.define('box', [
        'i-bem-dom',
        'i-bem-dom__collection',
        'vow',
        'objects',
        'jquery',
    ],
    function(provide,
        BEMDOM,
        BemDomCollection,
        vow,
        objects,
        $,
    __BASE) {

/**
 *
 * @exports
 * @class box
 * @bem
 * @classdesc Базовый блок организации интерфейсной разметки
 *
 * TODO
 * ====
 * 2017.07.19, 17:42 -- Вынести методы работы с вложенными секциями в container?
 *
 * ОПИСАНИЕ
 * ========
 *
 */

var isArray = Array.isArray;
var isEmpty = objects.isEmpty;

provide(BEMDOM.declBlock(this.name,  /** @lends box.prototype */ {

    /** _getDefaultParams ** {{{ */
    _getDefaultParams : function () {
        return {
            animateTime : 1000,
        };
    },/*}}}*/

    /** getTraceId ** {{{ DEBUG: Получить отладочный идентификатор
     */
    getTraceId : function () {
        var id = this.params.id;
        if ( this._parentBox ) {
            id = this._parentBox.getTraceId() + '->' + id;
        }
        return id;
    },/*}}}*/

    /** isBox ** {{{ DEBUG: Проверка наследования
     */
    isBox : function () {

        return true;

    },/*}}}*/

    // stackMode dependent...

    /** getDomBordersWidth ** {{{ Получить толщину рамки
     * @param {JQueryObject|BEM} dom
     * @param {Boolean} [horizontal] - Флаг горизонтальной разметки
     * @return {Number}
     */
    getDomBordersWidth : function (dom, horizontal) {

        horizontal = ( horizontal != null ) ? horizontal : this.getMod('h');

        dom.domElem && ( dom = dom.domElem );

        if ( horizontal ) {
            return parseInt(dom.css('border-left-width')) + parseInt(dom.css('border-right-width'));
        }
        else {
            return parseInt(dom.css('border-top-width')) + parseInt(dom.css('border-bottom-width'));
        }

    },/*}}}*/

    /** getDomInnerSize ** {{{ Получить размер dom-элемента
     * @param {JQueryObject} dom
     * @param {Boolean} [horizontal] - Флаг горизонтальной разметки
     * @return {Number}
     */
    getDomInnerSize : function (dom, horizontal) {

        horizontal = ( horizontal != null ) ? horizontal : this.getMod('h');

        dom.domElem && ( dom = dom.domElem );

        return horizontal ? dom.innerWidth() : dom.innerHeight();

    },/*}}}*/

    /** getDomOuterSize ** {{{ Получить размер dom-элемента
     * @param {JQueryObject} dom
     * @param {Boolean} [horizontal] - Флаг горизонтальной разметки
     * @return {Number}
     */
    getDomOuterSize : function (dom, horizontal) {

        horizontal = ( horizontal != null ) ? horizontal : this.getMod('h');

        dom.domElem && ( dom = dom.domElem );

        return horizontal ? dom.outerWidth() : dom.outerHeight();

    },/*}}}*/

    /** setBoxSize ** {{{ Установить размер секции (???)
     * @param {BEMObject} [box]
     * @param {Number} size
     * @param {Object} options
     */
    setBoxSize : function (box, size, options) {

        options = options || {};
        box = box || this;

        var horizontal = ( options.horizontal != null ) ? options.horizontal : box.getMod('h'),
            attr = horizontal ? 'width' : 'height',
            styles = {}
        ;

        styles[attr] = size + 'px';

        // Начинаем изменения
        this.beginChanges();

        if ( size !== this.getSize() ) {
            // Объединяем параметры-опции и параметры изменения
            var changesData = Object.assign({}, options, {
                ctx : box,
                // node : box,
                styles : styles,
            });
            this.collectChanges(changesData);
        }

        // Завершаем изменения
        return this.endChanges();

    },/*}}}*/

    // size...

    /** getContainerInnerSize ** {{{ Получить внутренний размер секции (максимум видимого контейнера)
     * @param {BEMObject} [box]
     * @param {Number} [forSize] - Размер секции, под который рассчитываем изменения; если не задан, берём текущий из css
     * @return {Number}
     */
    getContainerInnerSize : function (box, forSize) {

        box = box || this;

        var horizontal = this.getMod('hlayout');

        // Если не задан целевой размер, берём текущий внешний размер
        var size = ( forSize == null || isNaN(forSize) ) ? this.getDomOuterSize(box.domElem, horizontal) : forSize;

        // Минус ширина рамки секции
        size -= this.getDomBordersWidth(box.domElem, horizontal);

        var container = box.getContainer();

        // Минус ширина рамки контейнера
        size -= this.getDomBordersWidth(container.domElem, horizontal);

        return size;

    },/*}}}*/

    /** getRestoreSize ** {{{ Получить внутренний размер секции (максимум видимого контейнера)
     * @param {BEMObject} [box]
     * @param {Number} [forSize] - Размер секции, под который рассчитываем изменения; если не задан, берём текущий из css
     * @return {Number}
     */
    getRestoreSize : function (box, forSize) {

        box = box || this;

        if ( box.params.restoreSize != null ) {
            return box.params.restoreSize;
        }

        var size = forSize;

        if ( size == null || isNaN(size) ) {

            var container = box.getContainer();
            var horizontal = this.getMod('hlayout');

            size = this.getDomOuterSize(container.domElem, horizontal);
            size += this.getDomBordersWidth(box.domElem, horizontal);

        }

        return size;

    },/*}}}*/

    /** getSize ** {{{ Получить размер секции
     * @param {BEMObject} [box]
     * @param {Boolean} [horizontal] - Флаг горизонтальной разметки
     * @return {Number}
     */
    getSize : function (box, horizontal) {

        var dom = ( box && box.domElem ) || this.domElem;

        return this.getDomOuterSize(dom, horizontal);

    },/*}}}*/

    /** setSize ** {{{ Установить размер секции, учитывая вложенные секции
     * @param {BEMObject} [box]
     * @param {Number} size
     * @param {Object} options
     * @returns {Promise}
     */
    setSize : function (box, size, options) {

        options = options || {};
        box = box || this;

        var traceId = box.getTraceId(),
            sameLayout = this.getMod('h') === this.getMod('hlayout'),
            results = []
        ;

        this.beginChanges();

        // Устанавливаем собственный размер...
        results.push( this.setBoxSize(box, size, options) );

        // ...и размер вложенных секций...
        var childs = box.getChildBoxes();
        // console.log('box', this.getTraceId(), 'setSize', size, 'childs:', childs.size() );
        // debugger;
        if ( childs.size() && ( sameLayout || !options.onlySameLayout ) ) {
            var setSize = sameLayout ? size : null;
            results.push( box.updateChildSizes(setSize, options) );
        }

        this.endChanges();

        return vow.all(results)
            .then(function(data){
                // console.log('box', traceId, 'setSize:done(1) ->', data);
                // debugger;
                data.push(this.endChanges());
                return vow.all(data);
            }, this)
            .then(function(data){
                // console.log('box', traceId, 'setSize:done ->', data);
                // debugger;
                data = { status : 'setSize:done', traceId : traceId, data : data };
                // return vow.delay(data, 2000); // DEBUG: Задержка
                return data;
            }, this)
        ;

    },/*}}}*/

    /** getFixedSize ** {{{ Получить значение размера фиксированной секции
     * @returns {Number} size
     */
    getFixedSize : function () {

        if ( this.getMod('hidden') || this.getMod('hideAnimation') ) {
            return 0;
        }

        return ( this.params.size != null ) ? this.params.size : this.getSize();

    },/*}}}*/

    /** getNonBoxesChildsSize ** {{{ Рассчитать суммарный размер дочерних не-box элементов
     */
    getNonBoxesChildsSize : function () {

        var
            that = this,

            // Убедиться, что childNonBoxes создан (создаётся вместе с коллекцией вложенных box-секций)
            childs = this.getChildBoxes(),

            // Рассчитываем общий размер
            size = this.params.childNonBoxes.reduce(function(size,item){
                return size + that.getDomOuterSize(item);
            }, 0)
        ;

        return size;

    },/*}}}*/

    /** updateChildSizes ** {{{
     * @param {Number} [forSize] - Размер секции, под который рассчитываем изменения; если не задан, берём текущий из css.
     * @param {Object} [options] - Параметры.
     * @param {Boolean} [options.updateFixed] - Обновлять фиксированные элементы.
     * @param {Boolean} [options.onlySameLayout] - Обновлять вложенные элементы только своего типа разметки (напр., для горизонтального контейнера -- только горизонтальные секции).
     * @param {Boolean} [options.noAnimation] - Не использовать анимацию (моментальное применение изменений).
     * @param {Array} [excludeCtx] - Список вложенных секций, которые не обрабатываем (см. hide/show).
     * @returns {Promise|null}
     */
    updateChildSizes : function (forSize, options, excludeCtx) {

        options = options || {};
        excludeCtx = excludeCtx || [];
        isArray(excludeCtx) || ( excludeCtx = [excludeCtx] );

        var

            // Коллекция вложенных элементов
            childs = this.getChildBoxes(),

            // Составной идентифкатор секции
            traceId = this.getTraceId(),

            // Режим разметки расположения вложенных секций
            horizontal = this.getMod('hlayout'),

            // Размер контейнера
            internalSize = this.getContainerInnerSize(this, forSize),

            // Суммарный размер дочерних элементов не-box
            nonBoxesSize = this.getNonBoxesChildsSize(),

            // Доступное для распределения пространство
            availableSize = internalSize - nonBoxesSize,

            results = []

        ;

        // Начинаем изменения
        this.beginChanges();

        // DEBUG
        console.log('box', traceId, 'updateChildSizes start <-', 'internalSize:', internalSize, 'nonBoxesSize:', nonBoxesSize, 'availableSize:', availableSize );
        // debugger;

        // Шаг 1: Переменные для накопления изменяемых секций и учёта доступного для них размера
        var resizableChilds = [];
        var resizableSize = availableSize;
        // Проходим по `fixed` или `origin` секциям
        childs.map(function(ctx){
            var size;
            // Если секция фиксированного размера...
            if ( ctx.isFixed() ) {
                // Получаем размер
                size = ctx.getFixedSize();
                // И обновляем размер, если указано в опциях
                if ( options.updateFixed && !excludeCtx.includes(ctx) ) {
                    results.push(this.setSize(ctx, size, options));
                }
            }
            // ...Или "ведущая" секция
            else if ( ctx.isOrigin() ) {
                // просто получаем размер
                size = this.getSize(ctx);
            }
            // Если изменяемая секция
            else if ( ctx.isResizable() ) {
                // Запоминаем для обхода изменяемых секций
                resizableChilds.push(ctx);
                // Если элемент будет раскрываться...
                if ( ctx.getMod('showAnimation') ) {
                    size = ctx.getRestoreSize();
                }
            }
            // Если сохранён размер...
            if ( size != null ) {
                // Вычитаем из счётчика оставшегося доступного пространства
                resizableSize -= size;
            }
        }, this);

        // Шаг 2: Переменные для накопления всех оставшихся (other) после фиксированных
        // и параметрически (по процентам или ратио) изменяемых секций
        // и учёта оставлего для них пространства
        var otherChilds = [];
        var otherSize = resizableSize;
        // Рассчитываем размеры секций с `resizable:percents` или `resizable:ratio`
        resizableChilds
        .filter(function(ctx){ return !excludeCtx.includes(ctx); }, this)
        .map(function(ctx){
            var ratio;
            // Если проценты...
            if ( ctx.getMod('resizable') === 'percents' && ctx.params.percents ) {
                ratio = Number(ctx.params.percents) / 100;
            }
            // Если коэффициент...
            else if ( ctx.getMod('resizable') === 'ratio' && ctx.params.ratio ) {
                ratio = Number(ctx.params.ratio);
            }
            // Если получен коэффициент (в том числе по процентам)
            if ( ratio ) {
                // Рассчитываем размер
                var size = resizableSize * ratio;
                // Устанавливаем размер
                console.log('setSize', ctx.getTraceId(), size);
                results.push(this.setSize(ctx, size, options));
                // Учитываем его в остающемся пространстве
                otherSize -= size;
            }
            // Иначе добавляем элемент в список остающихся для расчёта "на равных"
            else {
                otherChilds.push(ctx);
            }
        }, this);

        // Шаг 3: Рассчитываем остальные секции (делим пространство поровну)
        if ( otherChilds.length ) {
            // Делим пространство на всех
            var oneOtherChildSize = otherSize / otherChilds.length;
            // Устанавливаем всем оставшимся секциям
            otherChilds
            .filter(function(ctx){ return !excludeCtx.includes(ctx); }, this)
            .map(function(ctx){
                this.setSize(ctx, oneOtherChildSize, options);
            }, this);
        }

        // Заканчиваем изменения
        // Возвращаем результат (если изменения были применены -- список промисов на их анимацию)
        // results.push(this.endChanges());

        // console.log('box', traceId, 'updateChildSizes done(pre)');
        // debugger;

        return vow.all(results)
            // DEBUG: Задержка
            .then(function(data){
                // console.log('box', traceId, 'updateChildSizes:done(1) ->', data);
                // debugger;
                data.push(this.endChanges());
                return vow.all(data);
            }, this)
            .then(function(data){
                // console.log('box', traceId, 'updateChildSizes:done ->', data);
                // debugger;
                data = { status : 'updateChildSizes:done', traceId : traceId, data : data };
                // return vow.delay(data, 2000); // DEBUG: Задержка
                return data;
            }, this)
        ;

    },/*}}}*/

    /** updateAllChilds ** {{{ Обновить все вложенные секции
     * @param {Object} [options] - Параметры см. описание в `updateChildSizes`..
     * @returns {Promise|null}
     */
    updateAllChilds : function (options) {

        options = Object.assign({
            updateFixed : true,
            onlySameLayout : false,
            // noAnimation : true,
        }, options);

        return this.updateChildSizes(null, options);

    },/*}}}*/

    // changes...

    /** makeChange ** {{{ Изменить свойства (css) секции или элемента DOM
     * @param {Object} options - Данные, описывающие изменения.
     * @param {Object} options.styles - Список свойств для установки.
     * @param {Boolean} [options.noAnimation] - Флаг: не использовать анимацию (применять изменения моментально).
     * @param {DOM|BEM} [options.ctx] - Блок, в котром производим изменения (если не задано -- текущий блок).
     * @param {DOM|BEM} [options.node] - Элемент DOM или bem-блок/элемент, у которого изменяем свойства (если не задано -- `options.ctx` или текущий блок).
     * @returns {Promise}
     */
    makeChange : function (options) {

        options = options || {};

        // Блок, в котором производим изменения
        var ctx = options.ctx || this;

        // Узел, свойства которого меняем (в простом случае -- сам блок)
        var node = options.node || ctx;
        if ( node.domElem  ) { node = node.domElem; }

        var

            // DEBUG: Идентификатор секции
            traceId = this.getTraceId(),

            /** __changingStatus ** {{{ Установить статус секции
             * @param {Boolean} [isDone] - Закончено ли изменение
             * Устанавливается модификатор 'changing',
             * инициируется событие `changingDone` или `changingStart` соответственно.
             */
            __changingStatus = function (isDone) {
                // Модификатор...
                ctx.setMod('changing', !isDone);
                // Событие...
                var eventType = isDone ? 'Done' : 'Start';
                ctx._emit('change' + eventType, options);
                // Колбек...
                if ( !isDone && typeof options.before === 'function' ) {
                    options.before.call(ctx, options);
                }
                if ( isDone && typeof options.after === 'function' ) {
                    options.after.call(ctx, options);
                }
            }/*}}}*/
        ;

        return new vow.Promise(function __changePromise (resolve,reject) {
            // Если не задан узел, которому применяем изменения или стили...
            if ( !node || !options.styles || isEmpty(options.styles) ) {
                resolve({ status : 'makeChange:nothingToStyle', traceId : traceId, options : options });
            }
            // Без анимации -- моментальное применение (если задан флаг "без анимации" -- в параметрах, свойствах блока или глобально в проекте)
            else if ( options.noAnimation || ctx.getMod('noAnimation') || project.config.noBoxesAnimation ) {
                __changingStatus();
                node.css(options.styles);
                __changingStatus(true);
                resolve({ status : 'makeChange:cssDone', traceId : traceId, options : options });
            }
            // Иначе вариант с анимацией...
            else {
                __changingStatus();
                node.animate(options.styles, ctx.params.animateTime, function(){
                    __changingStatus(true);
                    resolve({ status : 'makeChange:animationDone', traceId : traceId, options : options });
                });
            }
        });

    },/*}}}*/

    /** applyChanges ** {{{ Применяем изменения (см. `makeChange`)
     * NOTE: Должен ли этот метод быть только `root` блоках?
     * Вызывается (только?) из `commitChanges`.
     * @param {Object} changes - Изменения
     * @returns {Promise|null}
     */
    applyChanges : function (changes) {

        changes = changes || this._changes;
        isArray(changes) || ( changes = [changes] );

        var traceId = this.getTraceId();

        // console.log('box', traceId, 'applyChanges; changes:', changes);
        // debugger;

        var promises = changes.map(this.makeChange, this);

        // return promises; // ???
        return vow.all(promises)
            .then(function(data){
                // console.log('box', traceId, 'applyChanges:done; data', data);
                // debugger;
                data = { status : 'applyChanges:done', traceId : traceId, data : data, changes : changes };
                // return vow.delay(data, 5000); // DEBUG: Задержка
                return data;
            }, this)
        ;

    },/*}}}*/
    /** commitChanges ** {{{ Фиксируем Накопленные изменения (применяем или передаём родительскому блоку)
     * Вызывается (только) из `endChanges`.
     * @returns {Promise} (см. applyChanges, makeChange)
     */
    commitChanges : function () {

        var traceId = this.getTraceId();

        // console.log('box', traceId, 'commitChanges');
        // debugger;

        if ( isArray(this._changes) ) {

            var changes = this._changes;
            delete this._changes;

            if ( this._parentBox && this._parentBox.waitingForChanges() ) {
                return this._parentBox.collectChanges(changes);
            }
            else {
                return this.applyChanges(changes);
            }

        }

        return vow.Promise.resolve({ status : 'commitChanges:noChanges', traceId : traceId });

    },/*}}}*/

    /** collectChanges ** {{{ Добавить изменение к списку
     * @param {Object|Object[]} changes - Данные изменения
     * @return {Promise}
     */
    collectChanges : function (changes) {

        // Если не установлен флаг ожидания изменений (единичное изменение)
        // и есть родительская секция,
        // скидываем изменение в родительскую секцию
        if ( !this.waitingForChanges() ) {
            if ( this._parentBox ) {
                return this._parentBox.collectChanges(changes);
            }
            else {
                return this.applyChanges(changes);
            }
        }

        // ...Иначе накапливаем изменения в текущей секции
        if ( changes && !isEmpty(changes) ) {
            this._changes || ( this._changes = [] );
            if ( isArray(changes) ) {
                this._changes = this._changes.concat(changes);
            }
            else {
                this._changes.push(changes);
            }
        }

        return vow.Promise.resolve({ status : 'collectChanges:done', traceId : this.getTraceId(), changes : changes });

    },/*}}}*/

    /** beginChanges ** {{{ Запускаем начало аккумулирования изменений
     */
    beginChanges : function () {

        var traceId = this.getTraceId();

        // console.log('box', traceId, 'beginChanges', this._waitingChanges||0);
        // debugger;

        if ( !this._waitingChanges ) {
            this._waitingChanges = 1;
            // if ( this._parentBox ) {
            //     this._parentBox.beginChanges();
            // }
        }
        else {
            this._waitingChanges++;
        }

    },/*}}}*/
    /** endChanges ** {{{ Окончание аккумулирования изменений
     * Если все изменения на данном блоке завершены, то фиксируем накопленные изменения (commitChanges)
     * @returns {Promise[]|null} (см. commitChanges, applyChanges, makeChange)
     */
    endChanges : function () {

        var traceId = this.getTraceId();

        // console.log('box', traceId, 'endChanges', this._waitingChanges-1);
        // debugger;

        if ( this._waitingChanges === 1 ) {
            delete this._waitingChanges; // = 0;
            return this.commitChanges();
        }
        else {
            this._waitingChanges--;
        }

        return vow.Promise.resolve({ status : 'endChanges:done', traceId : traceId, waitingChanges : this._waitingChanges });

    },/*}}}*/

    // siblings, childs, parent, root & other relations...

    /** getContainer ** {{{ */
    getContainer : function () {

        return this._elem('container') || this;

    },/*}}}*/

    /** getChildBoxes ** {{{ Получить найденную и/или кэшированную коллекцию вложенных блоков box
     * @returns {BemDomCollection}
     */
    getChildBoxes : function () {

        var that = this,
            params = this.params
        ;

        if ( !this._childBoxes ) {
            params.childNonBoxes = [];
            var
                container = this._elem('container') || this,
                boxes = []
            ;
            container.domElem.children()
                .map(function(){
                    var item = $(this);
                    if ( item.hasClass('box') ) {
                        var boxItem = $(this).bem(that.__self);
                        boxes.push(boxItem);
                    }
                    else {
                        params.childNonBoxes.push(item);
                    }
                })
            ;
            this._childBoxes = new BemDomCollection( boxes );
        }

        return this._childBoxes;

    },/*}}}*/

    /** findChildBox ** {{{ Найти блок по идентификатору
     * @returns {BEM}
     */
    findChildBox : function (id) {

        var childs = this.getChildBoxes(),
            foundBlock;

        childs.map(function(item){
            if ( !foundBlock && item.getMod('id') === id ) {
                foundBlock = item;
            }
        });

        return foundBlock;

    },/*}}}*/

    /** getRootBox ** {{{ */
    getRootBox : function () {
        return ( this._parentBox && this._parentBox.getRootBox() ) || this;
    },/*}}}*/

    // modificators & status...

    /** isRoot ** {{{ */
    isRoot : function (ctx) {

        ctx = ctx || this;

        return ctx._isRoot; // Инициализируется в onInited

    },/*}}}*/
    /** isResizable ** {{{ */
    isResizable : function (ctx) {

        ctx = ctx || this;

        var resizableMod = ctx.getMod('resizable');

        return resizableMod && resizableMod !== 'fixed' && resizableMod !== 'origin';

    },/*}}}*/
    /** isFixed ** {{{ */
    isFixed : function (ctx) {

        ctx = ctx || this;

        var resizableMod = ctx.getMod('resizable');

        return !resizableMod || resizableMod === 'fixed' || ctx.getMod('hidden') || ctx.getMod('hideAnimation');

    },/*}}}*/
    /** isOrigin ** {{{ Является ли секция "ведущей" для изменения размера других секций
     */
    isOrigin : function (ctx) {

        ctx = ctx || this;

        var resizableMod = ctx.getMod('resizable');

        return ctx.isFixed() || resizableMod === 'origin';

    },/*}}}*/

    /** waitingForChanges ** {{{ Статус/кол-во собираемых изменений
     * @return {Number|Boolean}
     */
    waitingForChanges : function () {
        return this._waitingChanges || 0;
    },/*}}}*/

    /** hasCollectedChanges ** {{{ Есть ли накопленные неприменённые изменения
     * @returns {Boolean}
     */
    hasCollectedChanges : function () {
        return !!( this._changes && this._changes.length );
    },/*}}}*/

    // hide/show...

    /** hideThisBox ** {{{ Изменения для скрытия этой секции (без обработки изменений у соседей)
     * @param {Object} options
     * @returns {Promise}
     */
    hideThisBox : function (options) {

        options = options || {};

        var
            box = this,
            traceId = this.getTraceId()
        ;

        // Начинаем изменения
        this.beginChanges();

        if ( !this.getMod('hidden') ) {

            var horizontal = ( options.horizontal != null ) ? options.horizontal : box.getMod('h'),
                attr = horizontal ? 'width' : 'height',
                styles = {
                    opacity : 0,
                }
            ;

            box.params.restoreSize = box.getSize();

            styles[attr] = '0';

            // Флаг анимации
            box.setMod('hideAnimation');

            // Объединяем параметры-опции и параметры изменения
            var changesData = Object.assign({}, options, {
                ctx : box,
                // node : box,
                styles : styles,
                // После анимации снимаем флаг анимации и ставим флаг "скрыто"
                after : function (changeData) {
                    box.delMod('hideAnimation');
                    box.setMod('hidden');
                },
            });
            this.collectChanges(changesData);

        }

        // Завершаем изменения
        return this.endChanges();

    },/*}}}*/
    /** showThisBox ** {{{ Изменения для скрытия этой секции (без обработки изменений у соседей)
     * @param {Object} options
     * @returns {Promise}
     */
    showThisBox : function (options) {

        options = options || {};

        var
            box = this,
            traceId = this.getTraceId()
        ;

        // Начинаем изменения
        this.beginChanges();

        if ( this.getMod('hidden') ) {

            var horizontal = ( options.horizontal != null ) ? options.horizontal : box.getMod('h'),
                attr = horizontal ? 'width' : 'height',
                styles = {
                    opacity : 1,
                }
            ;

            styles[attr] = ( box.params.restoreSize != null ) ? box.params.restoreSize : box.getRestoreSize();

            // Флаг анимации
            box.setMod('showAnimation');
            box.delMod('hidden');

            // Объединяем параметры-опции и параметры изменения
            var changesData = Object.assign({}, options, {
                ctx : box,
                // node : box,
                styles : styles,
                // После анимации снимаем флаг анимации и ставим флаг "скрыто"
                after : function (changeData) {
                    box.delMod('showAnimation');
                    delete box.params.restoreSize;
                },
            });
            this.collectChanges(changesData);

        }

        // Завершаем изменения
        return this.endChanges();

    },/*}}}*/

    /** toggleChilds ** {{{
     * @param {Object} ctxSet - Набор секций для изменения состояния.
     * @param {BEMDOM|String} ctxSet.ctx - Блок или идентификатор секции.
     * @param {Boolean} ctxSet.show - Флаг: показать или спрятать секцию.
     * @param {Object} options
     * @returns {Promise}
     */
    toggleChilds : function (ctxSet, options) {

        // Преобразуем все переданные в наборе идентификаторы в объекты
        ctxSet = ctxSet.map(function(item){
            if ( typeof item.ctx === 'string' ) {
                var ctx = this.findChildBox(item.ctx);
                item = Object.assign({}, item, { ctx : ctx });
            }
            return item;
        }, this);

        var
            box = this,
            ctxList = ctxSet.map(function(item){ return item.ctx; }), // Object.keys(ctxSet),
            traceId = box.getTraceId(),
            horizontal = this.getMod('hlayout'),
            // origSize = this.getSize(horizontal),
            // sizeDiff = 0,
            results
        ;

        this.beginChanges();

        // Прячем секции...
        results = ctxSet.map(function(item){
            // var size = this.getSize(item.ctx);
            if ( item.show ) {
                // sizeDiff += size;
                return item.ctx.showThisBox(options);
            }
            else {
                // sizeDiff -= size;
                return item.ctx.hideThisBox(options);
            }
        }, this);

        // var resultSize = origSize + sizeDiff;
        // console.log('box', traceId, 'toggleChilds sizeDiff', sizeDiff, '->', resultSize);

        // ...и размер вложенных секций...
        var childs = box.getChildBoxes();
        // console.log('box', this.getTraceId(), 'setSize', size, 'childs:', childs.size() );
        // debugger;
        if ( childs.size() ) {
            // debugger;
            results.push( box.updateChildSizes(null /* resultSize */, options, ctxList) );
        }

        this.endChanges();

        return vow.all(results)
            .then(function(data){
                // console.log('box', traceId, 'setSize:done(1) ->', data);
                // debugger;
                data.push(this.endChanges());
                return vow.all(data);
            }, this)
            .then(function(data){
                // console.log('box', traceId, 'setSize:done ->', data);
                // debugger;
                data = { status : 'setSize:done', traceId : traceId, data : data };
                // return vow.delay(data, 2000); // DEBUG: Задержка
                return data;
            }, this)
        ;

    },/*}}}*/

    // module...

    /** test ** {{{ DEBUG! */
    test : function () {

        // var childBoxes = this.getChildBoxes();

        // DEBUG!
        $('.screenholder, .appholder').hide();
        var testBox = this.findChildBox('testBox1');
        if ( testBox ) {
            // console.log('box', this.getTraceId(), 'testBox');
            var testSize = testBox.getSize();
            var traceId = this.getTraceId();
            vow.delay(null, 1500)
                .then(function(result){
                    return this.toggleChilds([
                        { ctx : 'testBox1', show : false },
                    ]);
                }, this)
                .then(function(result){
                    return this.toggleChilds([
                        { ctx : 'testBox1', show : true },
                    ]);
                }, this)
                // .then(function(result){
                //     return this.toggleChilds([
                //         { ctx : testBox, show : true },
                //     ], {
                //         // updateFixed : true,
                //         // onlySameLayout : true,
                //         // noAnimation : true,
                //     });
                // }, this)
                .then(function(data){
                    console.info('box', traceId, 'initial test done', data);
                    // debugger;
                }, this)
                .fail(function(error){
                    console.error('box', traceId, 'initial test error', error);
                    // debugger;
                }, this)
            ;
            // setTimeout((function(){
            //     // console.log('box', traceId, 'test promise');
            //     debugger;
            //     ;
            //     // testBox.setSize(testBox, testSize + 50);
            // }).bind(this), 1500);
        }

    },/*}}}*/

    /** onInited() ** {{{ Инициализируем блок */
    onInited : function() {

        var
            box = this
        ;

        this._parentBox = this.findParentBlock(this.__self);
        this._isRoot = this.hasMod('root') || !this._parentBox;
        this._rootBox = this._isRoot ? this : this._parentBox.getRootBox();

        if ( this._parentBox && this._parentBox.getMod('hlayout') ) {
            this.setMod('h');
        }

        // DEBUG!
        this.test();

    },/*}}}*/

    /** onSetMod... ** {{{ События на установку модификаторов... */
    onSetMod : {

        /** (js:inited) ** {{{ Инициализация bem блока */
        js : {
            inited : function () {
                this.onInited();
            },
        },/*}}}*/

    },/*}}}*/

}, /** @lends box */{

    // /** live() {{{ Lazy-инициализация.
    //  */
    // live : function() {
    //
    //     var ptp = this.prototype;
    //
    //     return this.__base.apply(this, arguments);
    // }/*}}}*/

})); // provide

}); // module

