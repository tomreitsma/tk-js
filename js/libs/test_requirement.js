module('test_requirement', [], function() {

    var TestRequirement = function() {};
    TestRequirement.prototype = {
        test: function() {
            console.log('Test requirement test function :D');
        }
    }

    return TestRequirement;

});