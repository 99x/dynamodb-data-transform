dynamodb-data-transform
=================================
[![npm version](https://badge.fury.io/js/dynamodb-data-transform.svg)](https://badge.fury.io/js/dynamodb-data-transform)
[![license](https://img.shields.io/npm/l/dynamodb-data-transform.svg)](https://www.npmjs.com/package/dynamodb-data-transform)

This library allows you to manage DynamoDB Data Transformation Files (Where you can write the transformation logic in JavaScript for individual records of a DynamoDB table).

## This Plugin Requires

* Local Dynamodb Instance or AWS Account with Dynamodb Access Configured

## Features

* Create Transformation File
* Execute Transformation Files Individually
* Execute All the Transformation Files At Once

## Installation

`npm install --save dynamodb-data-transform`

## Usage

Usage example

```
var AWS = require('aws-sdk'),
dm = require("dynamodb-data-transform");

/* Note: To configure AWS Credentials refer https://aws.amazon.com/sdk-for-node-js/ */

var dynamodb = {raw: new AWS.DynamoDB() , doc: new AWS.DynamoDB.DocumentClient() };
dm.init(dynamodb, '<myprojectroot>/<transformations>'); /* This method requires multiple dynamodb instances with default Dynamodb client and Dynamodb Document Client. All the other methods depends on this. */
dm.create('sampleTransformation'); /* Use gulp, grunt or serverless to integrate this with the commandline, modify the created file with your custom table schema and seed data */
dm.execute('sampleTransformation', { prefix: 'dev-', suffix: '-sample'}); /* This executes the 'sampleTable' transformation. Note: second parameter is optional. With prefix and suffix actual table name e.g dev-<tablename>-sample
```

Note: For dynamodb local you can initialize the dynamodb variable as follows
```
var  options = { region: 'localhost', endpoint: "http://localhost:8000" },
     dynamodb = {raw: new AWS.DynamoDB(options) , doc: new AWS.DynamoDB.DocumentClient(options) };
```

Note: for the 'init' method, the transformation directory path should be an absolute path. Following example shows how to refer the adbolute path
```
var path = require('path');
var relPath = 'transformations';
var absolutePath = path.dirname(__filename) + '/' + relPath;
```

Supported methods

```
init(dynamodb, transformationsDir)            To initialize DynamoDB Client Instances to execute queries and to initialize the directory where transformation files exists
create(transformationName)                    To create a new file with transformationName included, which you can modify to include other attributes and seed data. More information on transformation file is shown in the following section.
execute(transformationName, tableOptions)     To execute a single transformation file. This create the tables if they don't exists and runs the seeds defined in the transformation file. tableOptions provides, tablePrefix and tableSuffix attributes to be set, if the actual table is different from transformation name
executeAll(tableOptions)               To execute all the transformation files to create tables and run all the seeds
```

## Transformation File

```
module.exports = {
    TableName: "TableName",
    Transformation: function (record) {
        // Write your transformation logic here

        return record;
    }
};
```
Before modifying the transformation file, refer the Dynamodb Client SDK and Dynamodb Document Client SDK links.

## Links
* [Dynamodb Client SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#createTable-property)
* [Dynamodb Document Client SDK](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property)
* [Dynamodb local documentation](http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
* [Contact Us](mailto:ashanf@99x.lk)
* [NPM Registry](https://www.npmjs.com/package/dynamodb-data-transform)

## Contributing

We love our contributors! If you'd like to contribute to the project, feel free to submit a PR. But please keep in mind the following guidelines:

* Propose your changes before you start working on a PR. You can reach us by submitting a Github issue. This is just to make sure that no one else is working on the same change, and to figure out the best way to solve the issue.
* If you're out of ideas, but still want to contribute, help us in solving Github issues already verified.
* Contributions are not just PRs! We'd be grateful for having you, and if you could provide some support for new comers, that be great! You can also do that by answering this plugin related questions on Stackoverflow.
You can also contribute by writing. Feel free to let us know if you want to publish a useful guides, improve the documentation (attributed to you, thank you!) that you feel will help the community.