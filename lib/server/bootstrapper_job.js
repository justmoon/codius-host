var events = require('events');
var util = require('util');

var ShellCommand = require('./shell_command').ShellCommand;

var BootstrapperJob = function (bootstrapper, server) {
  events.EventEmitter.call(this);

  this._bootstrapper = bootstrapper;
  this._server = server;

  // TODO: Make configurable
  this._pollingDelay = 1000;
  this._maxRetries = 10;
  this._keyPath = '/home/moon/.ssh/justmoon.key';
  this._remoteUser = 'root';

  server.on('active', this._handleActive.bind(this));
};
util.inherits(BootstrapperJob, events.EventEmitter);

BootstrapperJob.prototype._handleActive = function (server) {
  var _this = this;

  this._pollSsh(function (err) {
    if (err) {
      _this.emit('error', err);
      return;
    }
    _this.emit('connected');
  });
};

BootstrapperJob.prototype._pollSsh = function (callback) {
  var _this = this;
  var attempts = 0;

  function poll() {
    var child = _this._createSshProcess({
      commands: ['true']
    });

    child.on('error', function () {
      ++attempts;
      if (++attempts >= _this._maxRetries) {
        return callback(new Error('Server didn\'t become active in timely fashion'));
      }

      setTimeout(poll, _this._pollingDelay);
    });

    child.on('complete', function () {
      return callback();
    });
  }

  poll();
};

BootstrapperJob.prototype._createSshProcess = function (opts) {
  var sshOptions;

  sshOptions = [
    '-i',
    this._keyPath,
    '-q',
    '-o',
    'StrictHostKeyChecking=no',
    '-o',
    'PasswordAuthentication=no'
  ];

  return new ShellCommand('ssh', {
    options: sshOptions.concat([
      [this._remoteUser, this._server.getPublicAddress()].join('@'),
      opts.commands.join(' && ')
    ])
  });
};

exports.BootstrapperJob = BootstrapperJob;
