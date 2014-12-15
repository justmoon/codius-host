var Promise = require('bluebird');
var _ = require('lodash');
var pkgcloud = require('pkgcloud');
var Bootstrapper = require('pkgcloud-bootstrapper');

var config = require('./config');

exports.compute = pkgcloud.compute.createClient(config.get('pkgcloud'));

var bootstrapperConfig = _.cloneDeep(config.get('bootstrapper'));
bootstrapperConfig.compute = exports.compute;
exports.bootstrapper = new Bootstrapper(bootstrapperConfig);

Promise.promisifyAll(exports.compute);
