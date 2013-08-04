#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var util = require('util');
var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = "http://intense-lake-8402.herokuapp.com";


/* HTML CHECK */
var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var cheerioHtmlFile = function(fileData) {
    return cheerio.load(fileData);
};

var checkPerform = function(fileData, checksData) {
    $ = cheerioHtmlFile(fileData);

    var out = {};

    for(var ii in checksData) {
        var present = $(checksData[ii]).length > 0;
        out[checksData[ii]] = present;
    }

    return out;
}


/* FILE - PATH */
var assertFileExists = function(inFile) {
    var inStr = inFile.toString();

    if(!fs.existsSync(inStr)) {
        console.log("%s does not exist. Exiting.", inStr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }

    return inStr;
};

var loadFilePath = function(inFile) {
    return fs.readFileSync(inFile);
}

var checkHtmlFilePath = function(filePath, checksFile) {
    assertFileExists(filePath);

    var checksData = loadChecks(checksFile).sort();
    var fileData = loadFilePath(filePath);

    return checkPerform(fileData, checksData);
};


/* FILE - URL */
var urlResponse = function(htmlFileURL, checksFile) {
    var response2console = function(result, response) {
        if (result instanceof Error) {
            console.error('Error: ' + util.format(response.message));
	    process.exit(1);
        } else {
            console.log("URL %s read", htmlFileURL);

	    var checksData = loadChecks(checksFile).sort();
	    var checkJson = checkPerform(result, checksData);
	    var outJson = JSON.stringify(checkJson, null, 4);

	    console.log(outJson);
        }
    };

    return response2console;
};

var checkHtmlFileURL = function(fileURL, checksFile) {
    var fileURLStr = fileURL.toString();
    var checksFileStr = checksFile.toString();
    var urlResp = urlResponse(fileURLStr, checksFileStr);
  
    rest.get(fileURLStr).on('complete', urlResp);
};


var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};


if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html')
        .option('-u, --url <url_link>', 'URL to HTML file', URL_DEFAULT)
        .parse(process.argv);

    console.log("Starting to work on: %s", program.file || program.url);

    if (program.file) {
	var checkJson = checkHtmlFilePath(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);

	console.log(outJson);
    } 
    else if (program.url) {
	checkHtmlFileURL(program.url, program.checks);
    }
} else {
    exports.checkHtmlFilePath = checkHtmlFilePath;
}
