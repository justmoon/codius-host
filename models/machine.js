var bookshelf = require('../lib/db').bookshelf;

var Token = require('./token');

var Machine = bookshelf.Model.extend({
  tableName: 'machines',
  token: function () {
    return this.belongsTo(Token.model);
  }
});

var Machines = bookshelf.Collection.extend({
  model: Machine
});

exports.model = Machine;
exports.collection = Machines;
