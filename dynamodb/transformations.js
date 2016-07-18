'use strict';

var BbPromise = require('bluebird'),
    fs = require('fs');

var formatTableName = function(transformation, options) {
    return options.tablePrefix + transformation.TableName + options.tableSuffix;
};

var create = function(transformationName, options) {
    return new BbPromise(function(resolve, reject) {
        var template = require('./templates/template');
        template.Table.TableName = transformationName;

        if (!fs.existsSync(options.dir)) {
            fs.mkdirSync(options.dir);
        }

        fs.writeFile(options.dir + '/' + transformationName + '.js', template, function(err) {
            if (err) {
                return reject(err);
            } else {
                resolve('New file created in ' + options.dir + '/' + transformationName + '.json');
            }
        });
    });
};
module.exports.create = create;

var executeAll = function(dynamodb, options) {
    return new BbPromise(function(resolve, reject) {
        fs.readdirSync(options.dir).forEach(function(file) {
            var transformation = require(options.dir + '/' + file);
            transformation.TableName = formatTableName(transformation, options);
            /* 1) Scan sets table records asynchronously
               2) Call transformation.Transform method for the set
               3) Batch Update these records
            */
        });
    });
};
module.exports.executeAll = executeAll;

var execute = function(dynamodb, options) {
    return new BbPromise(function(resolve, reject) {
        var transformation = require(options.dir + '/' + options.transformationName + '.js');
        transformation.TableName = formatTableName(transformation, options);

        var lastKey = "",
            isExecuting = false,
            updatedCount = 0,
            readParams = {
                TableName: transformation.TableName,
                Limit: 25,
                Select: 'ALL_ATTRIBUTES'
            },
            processWriteDataset = function(items, outArray) {
                items.forEach(function(item) {
                    var tmpItem = {
                        'PutRequest': {
                            'Item': item
                        }
                    };
                    outArray.push(tmpItem);
                });
            },
            executeReadWriteCycle = function(rparams) {
                isExecuting = true;
                dynamodb.doc.scan(rparams, function(err, data) {
                    if (err) {
                        reject("Scan failed"+err+ JSON.stringify(rparams));
                    } else {
                        lastKey = data.LastEvaluatedKey ? data.LastEvaluatedKey : "";
                        if (data.Items) {
                            var processedData = [],
                                writeParams = {
                                    RequestItems: {}
                                };
                                
                            data.Items.forEach(function(item) {
                                transformation.Transformation(item);
                            });

                            processWriteDataset(data.Items, processedData);
                            writeParams.RequestItems[transformation.TableName] = processedData;

                            dynamodb.doc.batchWrite(writeParams, function(err, data) {
                                if (err) {
                                    isExecuting = false;
                                    reject('updated : '+updatedCount+' write failed' +err + JSON.stringify(writeParams) );
                                } else {
                                    isExecuting = false;
                                    updatedCount += writeParams.RequestItems[transformation.TableName].length;
                                }
                            });

                        }
                    }
                });
            };

        executeReadWriteCycle(readParams);

        var intvl = setInterval(function() {
            if (!isExecuting) {
                if (lastKey === "") {
                    clearInterval(intvl);
                    resolve("Updated "+updatedCount+ " records");
                } else {
                    readParams["ExclusiveStartKey"] = lastKey;
                    executeReadWriteCycle(readParams);
                }
            }
        }, 10);


    });
};
module.exports.execute = execute;
