([
{
    shouldDeps : [
        { elem : 'subtree' },
        // { elem : 'item' },
        { elem : 'item', mod : 'tree' },
        // TODO: menu__item??? // { block : 'menu', elem : 'item', mods : { tree : true } },
    ]
},
{
    tech : 'spec.js',
    mustDeps : { tech : 'bemhtml', block : 'menu', mod : 'tree', val : true },
}
])