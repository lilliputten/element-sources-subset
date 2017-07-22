/* jshint camelcase:false, unused:false, laxbreak:true, expr:true, boss:true, eqnull:true, browser:true */
/* globals modules, BEMHTML, app, project */
modules.define('spec', [
    'box',
    'i-bem-dom',
    'jquery',
    'BEMHTML',
    'events',
    'sinon',
    'chai',
],
function(provide,
    Box,
    BEMDOM,
    $,
    BEMHTML,
    events,
    sinon,
    chai,
__BASE) {

var expect = chai.expect;

describe('box', function() {

    // /*{{{*/describe('test', function() {
    //
    //     var box;
    //
    //     beforeEach(function() {
    //         var html = BEMHTML.apply({ block: 'box', content: 'foo' });
    //         var dom = $(html).appendTo('body');
    //         box = BEMDOM.init(dom).bem(Box);
    //     });
    //
    //     afterEach(function() {
    //         BEMDOM.destruct(box.domElem);
    //     });
    //
    //     // it('should be focused on pressrelease on itself', function() {
    //     //     box.hasMod('focused').should.be.false;
    //     //     box.domElem
    //     //         .trigger('pointerpress')
    //     //         .trigger('pointerrelease');
    //     //     box.hasMod('focused').should.be.true;
    //     // });
    //
    //     it('isBox', function() {
    //         box.isBox().should.be.true;
    //     });
    //
    // });/*}}}*/

    /*{{{*/describe('vertical layout', function() {

        var box, emitter;

        beforeEach(function() {
            var
                /*{{{ testLayout */
                testLayout = { block : 'box', id : 'box',
                    mods : {
                        root : true,
                    },
                    js : {
                        // resizable : false,
                    },
                    content : [
                        /*{{{*/{ block : 'box', id : 'box1',
                            mods : {
                                resizable : 'ratio',
                            },
                            js : {
                                // size : 100,
                                ratio : 0.5,
                            },
                            addAttrs : {
                                // style : 'height:100px',
                                title : 'test',
                            },
                            content : [
                                { content : 'box1' },
                                { block : 'box', id : 'box12',
                                    mods : {
                                        resizable : true,
                                    },
                                    js : {
                                        // size : 10,
                                    },
                                    content : [
                                        { content : 'box12' },
                                    ],
                                }
                            ],
                        },/*}}}*/
                        /*{{{*/{ block : 'box', id : 'box2',
                            mods : {
                                resizable : true,
                            },
                            js : {
                                // percents : 10,
                            },
                            content : [
                                { content : 'box2' },
                            ],
                        },/*}}}*/
                    ],
                },/*}}}*/
                html = BEMHTML.apply(testLayout),
                dom = $(html).appendTo('body')
            ;

            box = BEMDOM.init(dom).bem(Box);
            emitter = box._events();

            // console.log('events', typeof box._events());
            // box._events().on('updatedOnInit', function(e,data){
            //     console.log('updatedOnInit event');
            // });

        });

        afterEach(function() {
            BEMDOM.destruct(box.domElem);
        });

        it('events2', function(done) {
            console.log('started');
            this.timeout(3000);
            // setTimeout(done, 15000);
            var spy1 = sinon.spy();
            // box._emit('test');
            // var promise = new vow.Promise(function(resolve,reject){
            //     emitter.on('updatedOnInit', resolve);
            // });
            emitter.on('updatedOnInit', function(data){
                console.log('updatedOnInit called');
                expect(true).toBe(true);
                done();
            });
            // spy1.should.have.been.calledOnce;
        });

        /*
        it('events', function(done) {
            console.log('started');
            this.timeout(3000);
            // setTimeout(done, 15000);
            var spy1 = sinon.spy();
            // box._emit('test');
            // var promise = new vow.Promise(function(resolve,reject){
            //     emitter.on('updatedOnInit', resolve);
            // });
            emitter.on('updatedOnInit', function(data){
                console.log('updatedOnInit called');
                expect(true).toBe(true);
                done();
            });
            // spy1.should.have.been.calledOnce;
        });
        */

        // it('find child box', function() {
        //     box.findChildBox('box1').should.be.object;
        // });
        //
        // it('get child box id (correct object)', function() {
        //     console.log('box height', box.domElem.outerHeight());
        //     console.log('box1 height', box.findChildBox('box1').domElem.outerHeight());
        //     console.log('box2 height', box.findChildBox('box2').domElem.outerHeight());
        //     box.findChildBox('box1').getMod('id').should.be.equal('box1');
        // });

        /*
        it('box height', function() {
            box.domElem.outerHeight().should.be.equal(100);
        });
        */

    });/*}}}*/

});

provide();

});
