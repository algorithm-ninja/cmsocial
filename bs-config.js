/*
 |--------------------------------------------------------------------------
 | Browser-sync config file
 |--------------------------------------------------------------------------
 |
 | For up-to-date information about the options:
 |   http://www.browsersync.io/docs/options/
 |
 */

const url = require('url')
const proxy = require('proxy-middleware')
const fs = require('fs')
const ini = require('ini')

var config = ini.parse(fs.readFileSync('config/cmsocial.ini', 'utf-8'))

proxyOptionsAPI = url.parse('http://localhost:8888')
proxyOptionsAPI.route = config.core.base_url + "api/"
proxyOptionsTest = url.parse('http://localhost:3000')
proxyOptionsTest.route = config.core.base_url + "test/"
proxyOptionsTest2 = url.parse('http://localhost:3000')
proxyOptionsTest2.route = config.core.base_url + "test2/"

module.exports = {
  "server": {
    "baseDir": "cmsocial-web.build",
    "middleware": [proxy(proxyOptionsTest), proxy(proxyOptionsTest2), proxy(proxyOptionsAPI)]
  },
  "port": 3000,
  "files": []  // TODO: add files to watch
};
