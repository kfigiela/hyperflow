var amqp  = require('amqp');
var uuid  = require('uuid');
var when  = require('when');
var defer = when.defer;
var util  = require('util');

var AMQP_URL  = process.env.AMQP_URL ? process.env.AMQP_URL : "amqp://localhost:5672";
var S3_BUCKET = process.env.S3_BUCKET;
var S3_PATH   = process.env.S3_PATH;

console.log("[AMQP] Starting connection!");
var connection      = require('amqplib').connect(AMQP_URL);
var connectionReady = false;

connection.then(function(conn) {
  connection.once('SIGINT', function() { connection.close(); });
})

function amqpCommand(ins, outs, config, cb) {
  connection.then(function(connection) {
    return when(connection.createChannel().then(function(ch) {
      var message = {
        "executable": config.executor.executable,
        "args": config.executor.args,
        "inputs": ins,
        "outputs": outs,
        "options": {
          "bucket": S3_BUCKET,
          "prefix": S3_PATH,
        }
      };
      var answer = defer();
      var corrId = uuid.v4();
      function maybeAnswer(msg) {
        if (msg.properties.correlationId === corrId) {
          answer.resolve(msg.content.toString());
        }
      }

      var ok = ch.assertQueue('', {exclusive: true, autoDelete: true})
        .then(function(qok) { return qok.queue; });

      ok = ok.then(function(queue) {
        return ch.consume(queue, maybeAnswer, {noAck: true})
          .then(function() { return queue; });
      });

      ok = ok.then(function(queue) {
        console.log("[AMQP][" + corrId + "] Publishing job");
        ch.sendToQueue('hyperflow.jobs', new Buffer(JSON.stringify(message)), {replyTo: queue, contentType: 'application/json', correlationId: corrId});
        return answer.promise;
      }); 

      return ok.then(function(message) {
        var parsed = JSON.parse(message);
        if (parsed.exit_status == "0") {
          console.log("[AMQP][" + corrId + "] Job finished!", outs);
          cb(null, outs);
        } else {
          console.log("[AMQP][" + corrId + "] Error during job execution! " + parsed.exceptions);
          cb(parsed.exceptions, outs);
        }
        ch.close();
      });
    }))
  }).then(null, function(err) { console.trace(err.stack); });
} 


exports.amqpCommand = amqpCommand;
