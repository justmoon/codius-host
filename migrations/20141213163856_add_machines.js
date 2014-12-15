'use strict';

exports.up = function(knex, Promise) {
  return knex.schema.createTable('machines', function (t) {
    t.increments().primary();
    t.string('tag').unique();
    t.string('ip').unique();
    t.integer('token_id').unsigned().index().references('id').inTable('tokens');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('machines');
};
