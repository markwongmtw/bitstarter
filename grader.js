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

var fs      = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest    = require('restler');
var util    = require('util');

var HTMLFILE_DEFAULT   = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT        = "http://www.notgoogle.com";
var checks             = false;

var assertUrlExists = function(url) {
    var instr = url.toString();

    console.log("instr = " + instr);
    rest.get(instr).once('complete', function(result) {
        console.log("within rest");
        if (result instanceof Error) {
            console.log('Error: ' + result.message);
            process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
        } else {
            checkUrl(result, checks);
            return result;
        }
    });
    return instr;
};

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var cheerioUrl = function(url_str) {
    return cheerio.load(url_str);
};


var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkUrl = function(url_str, checksfile) {
    console.log(url_str);
    $ = cheerioUrl(url_str);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    var outJson = JSON.stringify(out, null, 4);
    console.log(outJson);
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to html file', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to check', clone(assertUrlExists), URL_DEFAULT)
        .parse(process.argv);

    var checkJson = false;
    console.log("program.url = " + program.url);
    checks = program.checks;

    if (program.url.valueOf() == URL_DEFAULT.valueOf()) {
        console.log("calling checkHtmlFile");
        checkJson = checkHtmlFile(program.file, program.checks);
        var outJson = JSON.stringify(checkJson, null, 4);
        console.log(outJson);
    }
 
} else {
    exports.checkHtmlFile = checkHtmlFile;
}