([
{
    shouldDeps : [
        { elem : 'menu' },
        { block : 'menu', mods : { tree : true } },
        // { block : 'jquery', elem : 'event', mods : { type : 'pointer' } },
    ]
},
{
    tech : 'spec.js',
    mustDeps : [
        { tech : 'bemhtml', block : 'select', mod : 'tree', val : true },
        { tech : 'bemhtml', block : 'menu', mod : 'tree', val : true },
    ]
}
])