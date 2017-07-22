([
{
    mustDeps : [
        { block : 'screenholder', elems : [ 'error' ] },
        { block : 'splashform' },
    ],
    shouldDeps : [
        // { mod : '00mod' },
        { elem : 'container' },
        { elem : 'layout' },
        { elem : 'header' },
        { elem : 'screen' },
        { elem : 'credits' },
        // { elem : '00elem' },
        // { block : '_' },
    ],
},
{
    tech : 'tmpl-spec.js',
    mustDeps : [
        { tech : 'bemhtml', block : 'appholder', elem : 'screen', mods : { type : 'loader' } },
        // { tech : 'bemhtml', block : 'button', mods : { type : 'link' } },
        // { tech : 'bemhtml', block : 'icon' }
    ],
}
])
