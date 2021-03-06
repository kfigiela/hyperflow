var redis = require('redis'),
    rcl = redis.createClient(),
    wflib = require('../wflib').init(rcl),
    Engine = require('../engine'),
    async = require('async'),
    engine;

function init(cb) {
    rcl.select(1, function(err, rep) {
	rcl.flushdb(function(err, rep) {
	    wflib.createInstanceFromFile('../workflows/Wf_choice_test.json', '', 
                function(err, id) {
                    cb(err, id);
                }
	    );
	});
    });
}

init(function(err, wfId) {
    if (err) { throw err; }
    engine = new Engine({"emulate":"false"}, wflib, wfId, function(err) {
        engine.runInstance(function(err) {
            var spec = [{'id': '1', 'value': '1'}, 
	                {'id': '2', 'value': '2'}];
	    engine.fireSignals(spec);
        });
    });
});
