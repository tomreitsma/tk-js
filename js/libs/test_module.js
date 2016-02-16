module('test_module', ['test_requirement', 'http', 'utils', 'CookieManager'], function(test_requirement, http, utils, cookie) {

    cookie.set('ultratestlol', 1);

    var req = new test_requirement();
    req.test();

    console.dir({http: http, utils: utils});

    http.get('/').then(function(html) {
        console.log('Http call completed!');
        console.log('Time is now: ' + utils.time.now());
        console.dir({response: html});
    }, function() {
        console.log('Http call failed!');
        console.log('Time is now: ' + utils.time.now());

        console.log('All tests went according to plan!');
    });

    return 'fdjsajfdsja';
});