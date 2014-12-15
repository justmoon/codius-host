var config = require('./config');
var cloud = require('./cloud');
var log = require('./log');

var Supervisor = require('./server/supervisor').Supervisor;

exports.supervisor = new Supervisor(config, cloud, log.winston);
