var _ = require('lodash');
var Promise = require('bluebird');
var crypto = require('crypto');
var net = Promise.promisifyAll(require('net'));

var Supervisor = function (config, backend, bootstrapper, winston) {
  this.config = config;
  this.backend = backend;
  this.bootstrapper = bootstrapper;
  this.winston = winston;

  this.availableMachines = [];
  this.pendingMachines = 0;
  this.machines = [];
};

Supervisor.prototype.listen = function () {
  return net.createServerAsync({
    host: this.config.get('supervisor').host,
    port: this.config.get('supervisor').port
  });
};

Supervisor.prototype.launch = function () {
  var checkinTimeout = this.config.get('supervisor').checkinTimeout;

  var Machines = require('../../models/machine').collection;
  return new Machines().fetch().bind(this).then(function (machines) {
    this.machines = machines;

    if (machines.length) {
      return Promise.delay(checkinTimeout).then(this.review);
    } else {
      return this.review();
    }
  }).then(this.listen).bind();
};

Supervisor.prototype.review = function () {
  var minAvailableMachines = this.config.get('supervisor').minAvailableMachines;
  var launchTimeout = this.config.get('supervisor').launchTimeout;

  if ((this.availableMachines.length - this.pendingMachines) < minAvailableMachines) {
    console.log(this.config.get('supervisor'));

    return this.setupMachine();
    // setTimeout(this.handleLaunchTimeout, launchTimeout);
  } else {
    return Promise.resolve();
  }
};

Supervisor.prototype.deploy = function (token) {
  if (this.availableMachines.length > 0) {
    var server = this.availableMachines.pop();
    this.cloud.bootstrapper.ssh({
      server: server,
      commands: [
        'echo token is '+token
      ]
    }).on('complete', function () {
      console.log('ssh complete', arguments)
    });
  } else {
    throw new Error("No machines available.");
  }
};

Supervisor.prototype.setupMachine = function () {
  var _this = this;

  var machineTag = crypto.pseudoRandomBytes(20).toString('hex');
  var machineName = 'codius-host-'+machineTag
  var machineConfig = _.extend(
    {},
    {
      name: machineName,
      image: this.config.get('supervisor').image,
      flavor: this.config.get('supervisor').flavor,
      files: this.config.get('supervisor').bootstrapFiles,
      commands: this.config.get('supervisor').bootstrapCommands
    },
    this.config.get('supervisor').computeDefaults
  );

  this.pendingMachines++;

  var server = this.backend.orchestrator.createServer(machineConfig);
  var bootstrapJob = this.bootstrapper.bootstrap(server);

  function handleError(err) {
    _this.winston.error("Server error", err);
    _this.pendingMachines--;
  }

  server.on('error', handleError);
  bootstrapJob.on('error', handleError);

  server.on('create', function () {
    _this.winston.info("Starting server "+server.id);
  });

  server.on('active', function () {
    _this.winston.info("Server active "+server.id);
  });

  bootstrapJob.on('connected', function () {
    _this.winston.info("Server connection established "+server.id);
  });

  bootstrapJob.on('complete', function () {
    _this.winston.info("Server ready "+server.id);
    _this.pendingMachines--;
    _this.availableMachines.push(server);
    // var Machine = require('../../models/machine').model;
    //
    // Machine.forge({
    //
    // })
    _this.deploy('test123');
  });
};

exports.Supervisor = Supervisor;
