var fsp = require('./fileSplitter.js'), 
    cmd = require('./command.js'),
    amqpCmd = require('./amqpCommand.js'),
    scanDir = require('./DirScanner').scanDir;

function print(ins, outs, config, cb) {
        ins.forEach(function(input) {
                //console.log("sigId=", input.sigId + ":", input.data[0])
		//console.log(JSON.stringify(input, null, 2));
		if (input.data && input.data[0].value) {
                    console.log(input.data[0].value);
		} else {
                    console.log(JSON.stringify(input, null, 2));
                }
        });
        cb(null, outs);
}

function echo(ins, outs, config, cb) {
    var data = JSON.stringify(ins[0].data);
    //console.log(data);
    outs[0].data = ins[0].data;
    //console.log(JSON.stringify(ins, null, 2));

    //if (typeof data == "object" || typeof data == "array")
     //   data = JSON.stringify(data);

    process.stdout.write(data[2]);
    //console.log(data);
    cb(null, outs);
}

function echoWithDelay(ins, outs, config, cb) {
    //console.log(ins, outs);
    outs[0] = ins[0];
    setTimeout(function() {
        cb(null, outs);
    }, Math.floor(Math.random()*1000+1));
}

function add(ins, outs, config, cb) {
    var sum=0.0;
    for (var i=0; i<ins.length; ++i) {
        if ("value" in ins[i].data[0]) {
            sum += parseFloat(ins[i].data[0].value);
        }
    }
    outs[0].data = { "value": sum };
    cb(null, outs);
}

function sqr(ins, outs, config, cb) {
    if (!("value" in ins[0].data[0])) {
        outs[0].data = [ new Error("functions:sqr : no input value provided") ];
    } else {
        var v = parseFloat(ins[0].data[0].value);
        outs[0].data[0] = { "value": v * v };
    }
    cb(null, outs);
}

function length(ins, outs, config, cb) {
    if (!("value" in ins[0])) {
        outs[0].value = new Error("functions:sqr : no input value provided");
    } else {
        outs[0].value = ins[0].value.length;
    }
    setTimeout(function() {
        cb(null, outs);
    }, 1000);
}

function match(ins, outs, config, cb) {
    var tmp = ins[0].data[0].value.match(new RegExp('^/(.*?)/(g?i?m?y?)$'));
    var regex = new RegExp(tmp[1], tmp[2]);
    var str = ins[1].data[0].value;
    var s = str.search(regex);
    //console.log(regex, str, s);
    if (str.search(regex) != -1) {
        outs[0].condition = "true";
        outs[0].data = [ str ];
    }
    cb(null, outs);
}

function chooseEvenOdd(ins, outs, config, cb) {
    var sum=0;
    //console.log("choose INS=", ins);
    for (var i=0; i<ins.length; ++i) {
        if ("data" in ins[i] && "value" in ins[i].data[0]) {
            sum += parseInt(ins[i].data[0].value);
        }
    }
	if (sum % 2 == 0) {
		outs[0].data = [ { "value": sum } ];
		outs[0].condition = "true";
	} else {
		outs[1].data = [ { "value": sum } ];
		outs[1].condition = "true";
	}
    cb(null, outs);
}

function scanDirForJs(ins, outs, config, cb) {
    var inPath = ins[0].value, outPath;
    if (outs[0].path) {
        outPath = outs[0].path;
    } else {
        outPath = inPath + "/" + "matchingFilesOut.txt";
        outs[0].path = outPath;
        //outs[0].value = outPath;
    }
    scanDir(inPath, /.*js$/, outPath, function(err, result) {
        err ? cb(err): cb(null, outs);
    });
}

// TODO. (Currently only returns the input file path)
function grepFile(ins, outs, config, cb) {
    if (ins[0].path) {
        outs[0].value = ins[0].path;
    } else if (ins[0].value) {
        outs[0].value = ins[0].value;
    } else {
        cb(new Error("grepFile: input file path not provided."));
        return;
    }
    console.log("grepFile: '"+ ins[1].value+"'", outs[0].value);
    cb(null, outs); 
}


var cnt = 0;
function count(ins, outs, config, cb) {
    //console.log(ins);
    cnt++;
    outs[0].data = [];
    outs[0].data[0] = cnt;
    if (cnt % 1000 == 0) { 
        console.log("count:", cnt)
    }
    if (cnt == 10000)
        process.exit();
    cb(null, outs);
}

function exit(ins, outs, config, cb) {
  console.log("Exiting\n\n");
  process.exit(0);
}

/*
function montage_mProjectPP(ins, outs, config, cb) {
    var execName = "mProjectPP";
    var execArgs = "-X -x "+config.f.scale+" "+ins[0].name+" "+outs[0].name+" "+ins[1].name;
    // invoke executor(execName, exsecArgs)
}
*/

exports.print = print;
exports.add = add;
exports.sqr = sqr;
exports.length = length;
exports.fileSplitter = fsp.fileSplitter;
exports.command = cmd.command;
exports.amqpCommand = amqpCmd.amqpCommand;
exports.exit = exit;
exports.command_print = cmd.command_print;
exports.scanDirForJs = scanDirForJs;
exports.grepFile = grepFile;
exports.chooseEvenOdd = chooseEvenOdd;
exports.echo = echo;
exports.echoWithDelay = echoWithDelay;
exports.count = count;
exports.match = match;
