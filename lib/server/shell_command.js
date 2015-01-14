var events = require('events');
var util = require('util');
var spawn = require('child_process').spawn;

var ShellCommand = function (command, opts) {
  events.EventEmitter.call(this);

  var _this = this;
  var killed = false;
  var errs = [];

  console.log('spawn', command, opts.options.join(' '));
  var child = this._child = spawn(command, opts.options);

  function onError(err) {
    _this.emit('error', err);
  }

  function killChild() {
    if (!killed) {
      killed = true;
      child.kill();
    }
  }

  child.stderr.on('error', onError);
  child.stdout.on('error', onError);
  child.on('error', onError);

  child.on('exit', this._handleExit.bind(this));
};
util.inherits(ShellCommand, events.EventEmitter);

ShellCommand.prototype._handleExit = function (code, signal) {
  console.log('exit', code);
  // If the target process didn't exit with code = 0
  // assume something went wrong.
  if (code !== 0) {
    this.emit('error', new Error('Unexpected exit code: '+code));
  } else {
    this.emit('complete');
  }
};

exports.ShellCommand = ShellCommand;
