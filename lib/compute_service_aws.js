var Promise = require('bluebird');
var util = require('util');
var path = require('path');
var winston = require('winston');
var chalk = require('chalk');

var engine = require('./engine');
var formatter = require('./formatter');
var Token = require('../models/token').model;

var ComputeService = require('./compute_service').constructor;
var VM = require('./vm').VM;

var ComputeServiceAws = function () {
  ComputeService.call(this);
};

util.inherits(ComputeServiceAws, ComputeService);

ComputeServiceAws.prototype.startInstance = function(token, container_uri, type, vars, port) {
  var this_ = this;
  return new Promise(function(resolve, reject) {
    ensureToken(token);

    var runId = this_._uniqueRunId++;
    new Token({token: token}).fetch({withRelated: ['contract']}).then(function (model) {
      if (!model) {
        return reject(new Error('Invalid contract token'));
      }
      var contractHash = model.related('contract').get('hash');
      var contractToken = model.get('token');

      var contractIdent = formatter.hash(contractHash) + chalk.dim(':' + runId);

      winston.debug(contractIdent, chalk.dim('+++'), 'Starting new instance');

      // Start the contract if there is no currently running instance yet
      var runner = this_._instanceRunners[contractToken];
      if (runner) {
        winston.debug(contractIdent, chalk.dim('+++'), 'Contract is already running');
        return reject(new Error('Instance already running'));
      }

      var manifest = engine.engine._loadManifest(contractHash);
      if (manifest.docker) {
        runner = new VM(manifest.docker);
        runner.start();
      } else {
        runner = engine.engine.runContract(contractHash);
      }
      this_._instanceRunners[contractToken] = runner;

      // TODO: modify the engine and sandbox to make this work
      // runner._sandbox.pipeStdout({
      //   write: function (output) {
      //     // TODO Redirect to a stream that clients can subscribe to
      //     winston.debug(contractIdent, chalk.dim('...'),output.replace(/\n$/, ''));
      //   }
      // });
      this_._runningInstances[contractToken] = {
        token: contractToken,
        type: type,
        state: 'running',
        container_hash: contractHash,
        port: port,
// TODO: Update engine to assign ip address to instance.
        // ip_address: ,
        container_uri: container_uri
      };

// TODO: Emit 'running' from codius-engine
      // runner.on('running', function() {
      //   this_._runningInstances[contractToken].state = 'running'
      // });

      // If the contract exits by itself, update the state.
      // TODO: Should the host be notified so that the balance is no longer debited?
      // runner.on('exit', function (code, signal) {
      //   // delete this_._runningInstances[contractToken];
      //   this_._runningInstances[contractToken].state = 'stopped'
      // });

      return this_._runningInstances[contractToken];
    })

    .then(resolve)
    .error(reject)
  });
};

function ensureToken(token) {
  if (!token) { throw new Error('token must be provided') }
}

module.exports = new ComputeServiceAws();
