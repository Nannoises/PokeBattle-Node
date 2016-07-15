var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
app.use(express.static(__dirname + '/blastoise50'))
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var Transform = require('stream').Transform;
var util = require('util');
var $ = require('jQuery');
var webRequest = require('request');
var pokemonNames = undefined;

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
app.get('/sprites/*', function(request, response){
  var logData = { "originalUrl": request.originalUrl, "url": request.url, "baseUrl": request.baseUrl, "path": request.path, "route": request.route};
  //response.end(JSON.stringify(logData));
  var url = "http://www.pokestadium.com";
  url += request.path;
  webRequest(url).pipe(response);
  /*webRequest(url, function(error, innerResponse, body){
    console.log("InnerResponse: " + innerResponse);
    console.log("Body:" + body);
    response.end("Body downloaded.");
  });*/
});
app.get('/getSprites', function(request, response){
  var pokemonName = request.param('Name');
  if(!pokemonName){
    response.end("No Pokemon name specified!");
  }
  var url = "http://www.pokestadium.com/tools/search-pokemon-sprites?search-query=" + pokemonName + "&mode=main-series&background-color=transparent";
  console.log("Requesting: " + url);
  //webRequest(url).pipe(response);
  webRequest(url, function(error, innerResponse, body){
    console.log("InnerResponse: " + innerResponse);
    console.log("Body:" + body);
    //Remove gifs.
    //$('img[src$=".gif"]', body).remove();
    $(body).find('img[src$=".gif"]');   
    response.end(body);
  });
});
app.get('/pokemonNames', function(request, response){
  if(pokemonNames !== undefined){
     response.end(JSON.stringify(pokemonNames));
  } else {
    webRequest('http://pokeapi.co/api/v2/pokemon?limit=1000', function (error, innerResponse, body) {
      if (!error && response.statusCode == 200) {
        console.log('body ' + body);
        var results = JSON.parse(body).results;
        pokemonNames = {};
        for(var i=0;i<results.length;i++){
          var pokemonName = results[i].name;
          if(pokemonName.indexOf('-') > -1){
            pokemonName = pokemonName.substring(0, pokemonName.indexOf('-'));
          }
          if(!(pokemonName in pokemonNames)){
            pokemonNames[pokemonName] = 1;
          }
        }
        response.end(JSON.stringify(pokemonNames));
      }
    });
  }
});
app.get('/formatImage', function(request, response) {
  var imageUrl = request.param('ImageUrl');
  if(!imageUrl){
    response.end("No image URL provided!");
  }
  var dither = request.param('Dither') && (request.param('Dither').toLowerCase() == 'true' ||  request.param('Dither') == '1');
  response.writeHead(200, {'Content-Type': 'image/png' });
  webRequest.get({url: imageUrl, encoding: null}, function(error, innerResponse, body){
    console.log('recieved body: ' + JSON.stringify(body));
    var sizeCheck = gm(body).size(function (err, size) {
      if (!err){
        console.log('width: ' + size.width + ' height: ' + size.height);
        var imageName = 'sprite.png';
        if(imageUrl.endsWith('.gif')){
          imageName = 'spirte.gif[0]';
        }
        var command = gm(body, imageName);
        
        if(!dither){
          command.dither(false);
        }
        
        command.map('pebble_64_transparent.gif');
        
        if(size.width > 96 || size.height > 96){
          command.resize(96,96);
        }
        
        //command.quality(50);
        
        console.log('gm command: ' + JSON.stringify(command));
        command.toBuffer('PNG',function (err, buffer) {
         if(err){
           console.log('err: ' + err);
         }
         response.end(buffer);
        });
        /*command.stream('png', function(err, stdout, stderr){
          console.log('err: ' + err);
          stdout.pipe(response);
        });
        */
      }
      else
        console.log('Error checking size: ' + err);
    });
  });
})

