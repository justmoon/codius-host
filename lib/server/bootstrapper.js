
var spawn = require('child_process').spawn;
var BootstrapperJob = require('./bootstrapper_job').BootstrapperJob;

var Bootstrapper = function (config) {
  this._config = config;
};

Bootstrapper.prototype.bootstrap = function (server) {
  return new BootstrapperJob(this, server);
};

exports.Bootstrapper = Bootstrapper;
