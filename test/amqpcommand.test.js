var redis = require('redis'),
    rcl = redis.createClient(),
    wflib = require('../wflib').init(rcl),
    Engine = require('../engine'),
    async = require('async'),
    argv = require('optimist').argv,
    engine;

function init(cb) {
    rcl.select(1, function(err, rep) {
	rcl.flushdb(function(err, rep) {
	    wflib.createInstanceFromFile('../workflows/Wf_amqpcommand.json', '', 
                function(err, id) {
                    cb(err, id);
                }
	    );
	});
    });
}


if (!argv._[0]) {
    console.log("Usage: node command.test.js <command>");
    process.exit();
}


init(function(err, wfId) {
    if (err) { throw err; }
    engine = new Engine({"emulate":"false"}, wflib, wfId, function(err) {
        engine.syncCb = function() {
            console.log("finished!");
            process.exit();
        };
        engine.runInstance(function(err) {
            console.log("Wf id="+wfId);
            // Flag -s is present: send all input signals to the workflow -> start execution
            wflib.getWfIns(wfId, false, function(err, wfIns) {
                engine.wflib.getSignalInfo(wfId, wfIns, function(err, sigs) {
                    engine.emitSignals(sigs);
                    console.log(sigs);
                });
            });
        });
    });
});
