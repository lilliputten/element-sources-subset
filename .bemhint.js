// $Date: 2017-07-17 14:16:38 +0300 (Mon, 17 Jul 2017) $
// $Id: .bemhint.js 8762 2017-07-17 11:16:38Z miheev $
module.exports = {

    // list of the folder names which represent redefinition levels (folders with blocks)
    levels: [
        'root',
        'shared',
        'controllers',
        'interface',

        'custom',
        'design',
        'helpers',
        'layout',
        'libs',
        'loaders',
        'pages',
        'test',
    ],

    // paths which will be ignored during the validation
    excludePaths: [
        '**/00*',
        '**/*.+(zip|swp|bak|gif|jpg|png|svg|md|diff)',
        '**/*+(~|_|00)',
        // 'blocks',
        // 'blocks/**/*.+(~|_)',
        'pages/**/*.+(map|js|json|htm|html|css|~)',
        'core',
        'templates',
        '*.specs',
        'fake-data/**',
        '!UNUSED',
        'node_modules',
        'libs',
    ],

    // list of available plugins (node module names relatively to config file path)
    plugins: {
        'bemhint-css-naming': true,
        // 'bemhint-fs-naming': true,
        'bemhint-deps-specification': true,
        'bemhint-plugins-jshint': {
            techs: {
                // '*': {
                //     // правила jshint для всех технологий
                // },

                'deps.js': {
                    camelcase: false,
                    unused: false,
                    laxbreak: true,
                    expr: true,
                    boss: true,
                    asi: true,
                },

                'bemhtml': {
                    bitwise: true,
                    boss: true,
                    browser: true,
                    camelcase: false,
                    curly: true,
                    eqeqeq: true,
                    eqnull: true,
                    expr: true,
                    forin: false,
                    freeze: false,
                    futurehostile: true,
                    latedef: 'nofunc',
                    laxbreak: true,
                    noarg: true,
                    nocomma: true,
                    node: true,
                    nonbsp: true,
                    nonew: true,
                    undef: true,
                    unused: false,
                },

                'js': {
                    bitwise: true,
                    boss: true,
                    camelcase: false,
                    curly: true,
                    eqeqeq: true,
                    expr: true,
                    forin: false,
                    freeze: false,
                    futurehostile: true,
                    latedef: 'nofunc',
                    laxbreak: true,
                    noarg: true,
                    nocomma: true,
                    nonbsp: true,
                    nonew: true,
                    undef: true,
                    unused: false,
                    eqnull: true,
                    browser: true,
                    node: true,
                    // ????
                    globals: {
                        modules: true,
                    },
                },

                'styl|css': false, // не проверять технологию `css`
            },
        },
    },

};
