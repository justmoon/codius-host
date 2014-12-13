var db = require('../lib/db');
var manager = require('../lib/manager');
var config = require('../lib/config');

module.exports = function (req, res, next) {
  var data = {};

  data.running_instances = {};

  var runningInstances = manager.getRunningInstances();
  Object.keys(runningInstances).forEach(function (token) {
    var runner = runningInstances[token];

    // Get PID
    // TODO: The Sandbox should have a proper documented way of retrieving the PID.
    var pid;
    try {
      pid = runner._sandbox._native_client_child.pid
    } catch (e) {}
    data.running_instances[token] = {
      manifest_name: runner.getManifest().name,
      manifest_hash: runner.getManifestHash(),
      pid: pid
    };
  });

  data.config = config.get();

  res.json(data);
};
