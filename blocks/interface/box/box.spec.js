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

    /*{{{*/describe('test', function() {

        var box;

        beforeEach(function() {
            var html = BEMHTML.apply({ block: 'box', content: 'foo' });
            var dom = $(html).appendTo('body');
            box = BEMDOM.init(dom).bem(Box);
        });

        afterEach(function() {
            BEMDOM.destruct(box.domElem);
        });

        // it('should be focused on pressrelease on itself', function() {
        //     box.hasMod('focused').should.be.false;
        //     box.domElem
        //         .trigger('pointerpress')
        //         .trigger('pointerrelease');
        //     box.hasMod('focused').should.be.true;
        // });

        it('isBox', function() {
            box.isBox().should.be.true;
        });

    });/*}}}*/

    /*{{{*/describe('vertical layout', function() {

        var box;

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
                                { content : 'box1 content' },
                                { block : 'box', id : 'box12',
                                    mods : {
                                        resizable : true,
                                    },
                                    js : {
                                        // size : 10,
                                    },
                                    content : [
                                        { content : 'box12 content' },
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
                                { content : 'box2 content' },
                            ],
                        },/*}}}*/
                    ],
                },/*}}}*/
                html = BEMHTML.apply(testLayout),
                dom = $(html).appendTo('body')
            ;

            box = BEMDOM.init(dom).bem(Box);

        });

        afterEach(function() {
            BEMDOM.destruct(box.domElem);
        });

        it('initPromise result status should be equal updateChildSizes:done', function(done){
            box.initPromise
                .then(function(result){
                    result.status.should.be.equal('updateChildSizes:done');
                    done();
                })
                .fail(done)
            ;
        });

        it('find child box1, box1.getMod("id")=="box1"', function(done){
            box.initPromise
                .then(function(result){
                    var box1 = box.findChildBox('box1');
                    box1.should.be.object;
                    box1.getMod('id').should.be.equal('box1');
                    done();
                })
                .fail(done)
            ;
        });

        it('box1 height should be 50% of full height', function(done){
            box.initPromise
                .then(function(result){
                    var fullHeight = box.domElem.outerHeight();
                    var box1Height = box.findChildBox('box1').domElem.outerHeight();
                    box1Height.should.be.equal(fullHeight / 2);
                    done();
                })
                .fail(done)
            ;
        });

    });/*}}}*/

});

provide();

});
