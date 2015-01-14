var config = require('./config');
var log = require('./log');
var backend = require('./backend').backend;
var bootstrapper = require('./bootstrapper');
var Supervisor = require('./server/supervisor').Supervisor;

exports.supervisor = new Supervisor(config, backend, bootstrapper, log.winston);
