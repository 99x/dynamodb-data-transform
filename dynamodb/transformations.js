'use strict';

var BbPromise = require('bluebird'),
    fs = require('fs');

/*
var createTable = function (dynamodb, migration) {
    return new BbPromise(function (resolve) {
        dynamodb.raw.createTable(migration.Table, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Table creation completed for table: " + migration.Table.TableName);
            }
            resolve(migration);
        });
    });
};

var formatTableName = function (tranformation, options) {
    return options.tablePrefix + transformation.Table.TableName + options.tableSuffix;
};

var runSeeds = function (dynamodb, migration) {
    var params,
        batchSeeds = migration.Seeds.map(function (seed) {
            return {
                PutRequest: {
                    Item: seed
                }
            };
        });
    params = {
        RequestItems: {}
    };
    params.RequestItems[migration.Table.TableName] = batchSeeds;
    return new BbPromise(function (resolve, reject) {
        var interval = 0,
            execute = function (interval) {
                setTimeout(function () {
                    dynamodb.doc.batchWrite(params, function (err) {
                        if (err) {
                            if (err.code === "ResourceNotFoundException" && interval <= 5000) {
                                execute(interval + 1000);
                            } else {
                                reject(err);
                            }
                        } else {
                            console.log("Seed running complete for table: " + migration.Table.TableName);
                            resolve(migration);
                        }
                    });
                }, interval);
            };
        execute(interval);
    });
};
*/

var create = function (transformationName, options) {
    return new BbPromise(function (resolve, reject) {
        var template = require('./templates/template');
        template.Table.TableName = transformationName;

        if (!fs.existsSync(options.dir)) {
            fs.mkdirSync(options.dir);
        }

        fs.writeFile(options.dir + '/' + transformationName + '.js', template, function (err) {
            if (err) {
                return reject(err);
            } else {
                resolve('New file created in ' + options.dir + '/' + transformationName + '.json');
            }
        });
    });
};
module.exports.create = create;

var executeAll = function (dynamodb, options) {
    return new BbPromise(function (resolve, reject) {
        fs.readdirSync(options.dir).forEach(function (file) {
            var transformation = require(options.dir + '/' + file);
            transformation.Table.TableName = formatTableName(transformation, options);
            /* 1) Scan sets table records asynchronously
               2) Call transformation.Transform method for the set
               3) Batch Update these records
            */
        });
    });
};
module.exports.executeAll = executeAll;

var execute = function (dynamodb, options) {
    return new BbPromise(function (resolve, reject) {
        var transformation = require(options.dir + '/' + options.transformationName + '.js');
        transformation.Table.TableName = formatTableName(transformation, options);
        /* 1) Scan sets table records asynchronously
           2) Call transformation.Transform method for the set
           3) Batch Update these records
        */
    });
};
module.exports.execute = execute;
