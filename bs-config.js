/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 |
 |  TODO: browser-sync should be basically useless now.
 |
 */

const url = require('url')
const proxy = require('proxy-middleware')
const fs = require('fs')
const ini = require('ini')

var config = ini.parse(fs.readFileSync('config/cmsocial.ini', 'utf-8'))

proxyOptions = url.parse('http://localhost:8888')
proxyOptions.route = "/"

module.exports = {
  "server": {
    "baseDir": "cmsocial-web-build",
    "middleware": [proxy(proxyOptions)]
  },
  "port": 3000,
  "files": []  // TODO: add files to watch
};
