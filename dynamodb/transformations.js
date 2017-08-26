'use strict';

const BbPromise = require('bluebird'),
    fs = require('fs');

const formatTableName = function formatTableName(transformation, options) {
    return options.tablePrefix + transformation.TableName + options.tableSuffix;
};

const create = function create(transformationName, options) {
  return new BbPromise(function (resolve, reject) {
    const template = require('./templates/template');
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

const executeAll = function executeAll(dynamodb, options) {
  return new BbPromise(function (resolve, reject) {
    fs.readdirSync(options.dir).forEach(function(file) {
      const transformation = require(options.dir + '/' + file);
      transformation.TableName = formatTableName(transformation, options);
      /**
      * 1) Scan sets table records asynchronously
      * 2) Call transformation.Transform method for the set
      * 3) Batch Update these records
      */
    });
  });
};
module.exports.executeAll = executeAll;

const execute = function execute(dynamodb, options) {
  return new BbPromise(function(resolve, reject) {
    const transformation = require(options.dir + '/' + options.transformationName + '.js');
    transformation.TableName = formatTableName(transformation, options);

    let lastKey = "";
    let isExecuting = false;
    let updatedCount = 0;
    let readParams = {
      TableName: transformation.TableName,
      Limit: 25,
      Select: 'ALL_ATTRIBUTES'
    };
    let processWriteDataset = function(items, outArray) {
      items.forEach(function(item) {
        const tmpItem = {
          'PutRequest': {
            'Item': item
          }
        };
        outArray.push(tmpItem);
      });
    };
    let executeReadWriteCycle = function(rparams) {
      isExecuting = true;
      dynamodb.doc.scan(rparams, function(err, data) {
        if (err) {
          reject('Scan failed'+err+ JSON.stringify(rparams));
        } else {
          lastKey = data.LastEvaluatedKey ? data.LastEvaluatedKey : "";
          if (data.Items) {
            const processedData = [];
            const writeParams = {
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

    const intvl = setInterval(function() {
      if (!isExecuting) {
        if (lastKey === "") {
          clearInterval(intvl);
          resolve('Updated '+updatedCount+ ' records');
        } else {
          readParams["ExclusiveStartKey"] = lastKey;
          executeReadWriteCycle(readParams);
        }
      }
    }, 10);


  });
};
module.exports.execute = execute;
