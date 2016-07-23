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
  responseText = responseText.replace(/ALLYNAMEKEY/g, request.param('AllyName') || '');
  responseText = responseText.replace(/ENEMYNAMEKEY/g, request.param('EnemyName') || '');
  responseText = responseText.replace(/ALLYSPRITEURLKEY/g, request.param('AllySpriteUrl') || '');
  responseText = responseText.replace(/ALLYSHINYSPRITEURLKEY/g, request.param('AllyShinySpriteUrl') || '');
  responseText = responseText.replace(/ENEMYSPRITEURLKEY/g, request.param('EnemySpriteUrl') || '');
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
var getAndFormatImage = function(imageUrl, request, response){
  webRequest.get({url: imageUrl, encoding: null}, function(error, innerResponse, body){
    var dither = request.param('Dither') && (request.param('Dither').toLowerCase() == 'true' ||  request.param('Dither') == '1');
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
        console.log('gm command: ' + JSON.stringify(command));
        command.toBuffer('PNG',function (err, buffer) {
         if(err){
           console.log('err: ' + err);
         }
         response.writeHead(200, {'Content-Type': 'image/png' });
         response.end(buffer);
        });
      }
      else
        console.log('Error checking size: ' + err);
    });
  });
};
app.get('/sprites/*', function(request, response){
  var logData = { "originalUrl": request.originalUrl, "url": request.url, "baseUrl": request.baseUrl, "path": request.path, "route": request.route};
  //response.end(JSON.stringify(logData));
  var url = "http://www.pokestadium.com";
  url += request.path;
  webRequest(url).pipe(response);
});

var getMostRecentSprite = function(regex, request, response){
  var pokemonName = request.param('Name');
  if(!pokemonName){
    var index = request.param('Index');
    console.log('Index: ' + index);
    console.log('pokemonNames count: ' +  Object.keys(pokemonNames).length);
    if(index && pokemonNames && index <=  Object.keys(pokemonNames).length){
      pokemonName =  Object.keys(pokemonNames)[index];
    }
  }
  if(!pokemonName){
    response.end("No Pokemon name specified!");
    return;
  }
  pokemonName = pokemonName.toLowerCase();
  var requestParams = {
    url: "http://www.pokestadium.com/tools/search-pokemon-sprites",
    method: "GET",
    qs : {
      "search-query" : pokemonName,
      "mode" : "main-series",
      "background-color" : "transparent"
    }
  };
  console.log("Making request: " + JSON.stringify(requestParams));
  webRequest(requestParams, function(error, innerResponse, body){
    if(error){
      response.end("Unable to find sprites for provided name. Err: " + error);
      return;
    }
    console.log("InnerResponse: " + innerResponse);
    console.log("Body:" + body);
    //Get most recent front sprite
    var matches = body.match(regex);
    if(!matches || matches.length < 1){
      response.end("No sprites found in response: " + body);
      return;
    }
    var path = "";
    var fileNameRegex = new RegExp(pokemonName)
    for(var i=0;i<matches.length;i++){
      if(matches[i].indexOf(pokemonName + ".png") > -1 
      || matches[i].indexOf(pokemonName + "-mega.png") > -1
      || matches[i].indexOf(pokemonName + "-mega-y.png") > -1
      || matches[i].indexOf(pokemonName + "-mega-x.png") > -1){
        console.log("Match found: " + matches[i]);
        path = matches[i];
        break;
      }
      if(path == ""){
        path = matches[0];
      }
    }
    var imageUrl = "http://www.pokestadium.com" + path;
    getAndFormatImage(imageUrl, request, response);
  });
};
app.get('/getMostRecentBackSprite', function(request, response){
  getMostRecentSprite(/\/sprites[^\.]*?\/back\/[^\.]*?\.png/g, request, response);
});
app.get('/getMostRecentFrontSpriteShiny', function(request, response){
  getMostRecentSprite(/\/sprites[^\.]*?\/shiny\/[^\.]*?\.png/g, request, response);
});
app.get('/getMostRecentFrontSprite', function(request, response){
  getMostRecentSprite(/\/sprites[^\.]*?\.png/g, request, response);
});

app.get('/getSprites', function(request, response){
  var pokemonName = request.param('Name');
  if(!pokemonName){
    response.end("No Pokemon name specified!");
  }
  var requestParams = {
    url: "http://www.pokestadium.com/tools/search-pokemon-sprites",
    method: "GET",
    qs : {
      "search-query" : pokemonName,
      "mode" : "main-series",
      "background-color" : "transparent"
    }
  };
  console.log("Making request: " + JSON.stringify(requestParams));
  webRequest(requestParams, function(error, innerResponse, body){
    console.log("InnerResponse: " + JSON.stringify(innerResponse));
    console.log("Body:" + body);
    //Remove gifs.
    body = body.replace(/<img src="[^>]*?\.gif" [^>]*?>/g, "");
    response.end(body);
  });
});
var retrieveNames = function(callback){
  webRequest('http://www.pokestadium.com/pokemon-fusions/pokemon-list', function (error, innerResponse, body) {
      if (!error && innerResponse.statusCode == 200) {
        console.log('body ' + body);
        var results = JSON.parse(body);
        console.log("parsed body: " + JSON.stringify(results));
        pokemonNames = {};
        for(var i=0;i<results.length;i++){
          var pokemonName = results[i];
          if(pokemonName.indexOf('-') > -1){
            if(pokemonName.endsWith('-m')){
              pokemonName = pokemonName.replace('-m','♂');  
            } else if (pokemonName.endsWith('-f')){
              pokemonName = pokemonName.replace('-f','♀');  
            } else if (pokemonName == 'ho-oh'){
              pokemonName = pokemonName;
            } else{
              pokemonName = pokemonName.substring(0, pokemonName.indexOf('-'));
            }
          }
          if (pokemonName == 'farfetchd'){
              pokemonName = "farfetch'd";
          }
          if(!(pokemonName in pokemonNames)){
            pokemonNames[pokemonName] = 1;
          }
        }
      }
     if(callback && typeof callback === "function"){
       callback();
     }      
    });
};
app.get('/pokemonNames', function(request, response){
  if(pokemonNames !== undefined){
     response.end(JSON.stringify(pokemonNames));
  } else {
    retrieveNames(function(){ response.end(JSON.stringify(pokemonNames));});
  }
});
app.get('/formatImage', function(request, response) {
  var imageUrl = request.param('ImageUrl');
  if(!imageUrl){
    response.end("No image URL provided!");
  }
  getAndFormatImage(imageUrl, request, response);
});

retrieveNames();
