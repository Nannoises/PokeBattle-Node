var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/blastoise50'))
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var Transform = require('stream').Transform;
var util = require('util');
var webRequest = require('request');

app.get('/', function(request, response) {
  var responseText = fs.readFileSync('settings.html', {'encoding': "utf8"});
  responseText = responseText.replace('ALLYNAMEKEY', request.param('AllyName') || '');
  responseText = responseText.replace('ENEMYNAMEKEY', request.param('EnemyName') || '');
  if(request.param('FocusAnimate') && (request.param('FocusAnimate') == 1 || request.param('FocusAnimate') == 'true' || request.param('FocusAnimate') == 'True'))
    responseText = responseText.replace('FOCUSANIMATEKEY', 'checked="true"');
  if(request.param('FlickAnimate') && (request.param('FlickAnimate') == 1 || request.param('FlickAnimate') == 'true' || request.param('FlickAnimate') == 'True'))
    responseText = responseText.replace('FLICKANIMATEKEY', 'checked="true"');    
  response.end(responseText);
  //response.sendfile('settings.html');
  //response.end(JSON.stringify(responseData));
})
app.get('/custom', function(request, response) {
  var responseText = fs.readFileSync('settings-custom.html', {'encoding': "utf8"});
  responseText = responseText.replace('ALLYNAMEKEY', request.param('AllyName') || '');
  responseText = responseText.replace('ENEMYNAMEKEY', request.param('EnemyName') || '');
  responseText = responseText.replace('ALLYSPRITEURLKEY', request.param('AllySpriteUrl') || '');
  responseText = responseText.replace('ALLYSHINYSPRITEURLKEY', request.param('AllyShinySpriteUrl') || '');
  responseText = responseText.replace('ENEMYSPRITEURLKEY', request.param('EnemySpriteUrl') || '');
  response.end(responseText);
  //response.sendfile('settings.html');
  //response.end(JSON.stringify(responseData));
})
app.get('/image', function(request, response){
  response.sendfile('009.png');
})
app.get('/imagecount', function(request, response){
  response.end(JSON.stringify(fs.readdirSync(__dirname + '/blastoise50').length));
})
app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
app.get('/formatImage', function(request, response) {
  response.writeHead(200, {'Content-Type': 'image/png' });
  var transformStream = new TransformStream();
  webRequest.get({url: 'https://s31.postimg.org/zetnmyy8b/Tyrantrumfor_DA_zpse9d7d288.png', encoding: null}, function(error, innerResponse, body){
  	console.log('recieved body: ' + JSON.stringify(body));
  	gm(body).colors(64).stream(function(err, stdout, stderr){
  		stdout.pipe(response);
  	});
  });
})

