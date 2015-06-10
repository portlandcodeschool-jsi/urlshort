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

// request handler to create a new shortened url
router.post('/', function(request, response) {
  var database = app.get('database');

  var urls = database.collection('urls');
  var key = uuid.v4();

  /*
  insert the new url.
  "key" is the uuid, the shortened version of the url.
  "target" is the url to which the user should be redirected.
  "count" is the number of times a user has been redirected.
  */
  urls.insert({target: request.body.url, key: key, count: 0}, function(error) {
    if (error) {
      throw error;
    } else {
      response.redirect('/' + key + '/info');
    }
  });
});

/*
Show info about a url.

The "s" variable is for pluralizing in the template: if the url has redirected once, we want to say
    "1 time"; otherwise we want to say "n times".
*/
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

/*
Redirect to the target URL.
Increments the "count" attribute with an "atomic increment".
Notice that the response.redirect isn't in a callback to the call to update. The
behavior of the redirect doesn't have anything to do with the update, so we can send the
increment command off into the world and immediately redirect the user.
*/
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
