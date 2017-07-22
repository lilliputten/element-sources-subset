// $Date: 2017-07-18 20:03:11 +0300 (Tue, 18 Jul 2017) $
// $Id: box_root.deps.js 8782 2017-07-18 17:03:11Z miheev $
([{
    shouldDeps : [
        { block : 'functions', elems : [ 'throttle', 'debounce' ] },
    ]
},
{
    tech : 'spec.js',
    mustDeps : [
        { tech : 'bemhtml', block : 'box', mod : 'root', val : true },
    ]
}])
