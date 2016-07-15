'use strict';

var transformations = require('./dynamodb/transformations'),
    tableOpt = {
        prefix: "",
        suffix: ""
    },
    dynamo, dir;

var manager = {
    init: function (dynamodb, transformationDir) {
        dynamo = dynamodb;
        dir = transformationDir;
    },
    create: function (transformationName) {
        return transformations.create(transformationName, {
            dir: dir
        });
    },
    execute: function (transformationName, tableOptions) {
        return transformations.execute(dynamo, {
            dir: dir,
            transformationName: transformationName,
            tablePrefix: tableOptions.prefix || tableOpt.prefix,
            tableSuffix: tableOptions.suffix || tableOpt.suffix
        });
    },
    executeAll: function (tableOptions) {
        return transformations.executeAll(dynamo, {
            dir: dir,
            tablePrefix: tableOptions.prefix || tableOpt.prefix,
            tableSuffix: tableOptions.suffix || tableOpt.suffix
        });
    }
};
module.exports = manager;
