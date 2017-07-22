var path = require('path'),
    cwd = process.cwd(),
    make = require('../../api/make');

module.exports = function (options) {
    return function (req, res, next) {

        // XXX 2017.05.09: Passing parameters to enb make
        if ( typeof GLOBAL !== 'undefined' ) {
          GLOBAL.enbServerRequest = req;
          GLOBAL.enbServerParsedUrl = req._parsedUrl;
        }
        
        options = options || {};

        var startTime = new Date(),
            root = options.root || cwd,
            pathname = req._parsedUrl.pathname,
            filename = path.join(root, pathname),
            target = path.relative(root, filename),
            targets = target ? [target] : [];

        make(targets, {
                dir: root,
                mode: options.mode,
                cache: true,
                strict: false
            })
            .then(function () {
                var endTime = new Date();

                console.log('----- ' + path.normalize(pathname) + ' ' + (endTime - startTime) + 'ms');

                next();
            })
            .fail(function (err) {
                next(err);
            });
    };
};
