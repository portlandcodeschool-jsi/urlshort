/* jshint node:true */
'use strict';

var express = require('express');
var router = express.Router();
var app = require('../app');
var uuid = require('node-uuid');

/* GET home page. */
router.get('/', function(request, response) {
  response.render('index', {});
});

router.post('/', function(request, response) {
  var database = app.get('database');

  var urls = database.collection('urls');
  var key = uuid.v4();

  urls.insert({target: request.body.url, key: key, count: 0}, function(error) {
    if (error) {
      throw error;
    } else {
      response.redirect('/' + key + '/info');
    }
  });
});

router.get('/:key/info', function(request, response) {
  var database = app.get('database');
  var urls = database.collection('urls');

  urls.find({'key': request.params.key}).toArray(function(error, records) {
    if (error) {
      throw error;
    } else {
      var s = 's',
          url = records[0];
      if (url !== undefined) {
        if (url.count === 1) {
          s = '';
        }
        response.render('info.jade', {url: url, s: s});
      } else {
        response.status(404);
        response.render('404', { key: request.params.key });
      }
    }
  });
});

router.get('/:key', function(request, response) {
  var database = app.get('database');
  var urls = database.collection('urls');

  urls.find({'key': request.params.key}).toArray(function(error, records) {
    if (error) {
      throw error;
    } else {
      var url = records[0];
      if (url !== undefined) {
        console.log(url);
        urls.update({key: request.params.key}, {'$inc': {'count': 1}});
        response.redirect(url.target);
      } else {
        response.status(404);
        response.render('404', { key: request.params.key });
      }
    }
  });
});

module.exports = router;
