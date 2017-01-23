var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});
var Transform = require('stream').Transform;
var webRequest = require('request');
var pokemonNames = undefined;
var generationFolders = ["green", "red-blue", "yellow", "silver",  "crystal", "firered-leafgreen", "emerald", "diamond-pearl", "heartgold-soulsilver", "black-white", "xy", "sun-moon"];
var globby = require('globby');

app.get('/', function(request, response) {
  var responseText = fs.readFileSync('settings.html', {'encoding': "utf8"});
  responseText = responseText.replace('ALLYNAMEKEY', request.param('AllyName') || '');
  responseText = responseText.replace('ENEMYNAMEKEY', request.param('EnemyName') || '');
  if(request.param('FocusAnimate') && (request.param('FocusAnimate') == 1 || request.param('FocusAnimate') == 'true' || request.param('FocusAnimate') == 'True'))
    responseText = responseText.replace('FOCUSANIMATEKEY', 'checked="true"');
  if(request.param('FlickAnimate') && (request.param('FlickAnimate') == 1 || request.param('FlickAnimate') == 'true' || request.param('FlickAnimate') == 'True'))
    responseText = responseText.replace('FLICKANIMATEKEY', 'checked="true"');    
  response.end(responseText);
})
app.get('/custom', function(request, response) {
  var responseText = fs.readFileSync('settings-custom.html', {'encoding': "utf8"});
  responseText = responseText.replace(/ALLYNAMEKEY/g, request.param('AllyName') || '');
  responseText = responseText.replace(/ENEMYNAMEKEY/g, request.param('EnemyName') || '');
  responseText = responseText.replace(/ALLYSPRITEURLKEY/g, request.param('AllySpriteUrl') || '');
  responseText = responseText.replace(/ALLYSHINYSPRITEURLKEY/g, request.param('AllyShinySpriteUrl') || '');
  responseText = responseText.replace(/ENEMYSPRITEURLKEY/g, request.param('EnemySpriteUrl') || '');
  if(request.param('RandomMode') == 1 || request.param('RandomMode') == '1' || request.param('RandomMode') == true || request.param('RandomMode') == 'true'){
    responseText = responseText.replace(/RANDOMMODEKEY/g, 'checked');
  }
  responseText = responseText.replace(/WEATHERAPIKEY/g, request.param('WeatherAPIKey') || '');
  response.end(responseText);
})
app.get('/custom-beta', function(request, response) {
  var responseText = fs.readFileSync('settings-custom-beta.html', {'encoding': "utf8"});
  responseText = responseText.replace(/ALLYNAMEKEY/g, request.param('AllyName') || '');
  responseText = responseText.replace(/ENEMYNAMEKEY/g, request.param('EnemyName') || '');
  responseText = responseText.replace(/ALLYSPRITEURLKEY/g, request.param('AllySpriteUrl') || '');
  responseText = responseText.replace(/ALLYSHINYSPRITEURLKEY/g, request.param('AllyShinySpriteUrl') || '');
  responseText = responseText.replace(/ENEMYSPRITEURLKEY/g, request.param('EnemySpriteUrl') || '');
  if(request.param('RandomMode') == 1 || request.param('RandomMode') == '1' || request.param('RandomMode') == true || request.param('RandomMode') == 'true'){
    responseText = responseText.replace(/RANDOMMODEKEY/g, 'checked');
  }
  responseText = responseText.replace(/WEATHERAPIKEY/g, request.param('WeatherAPIKey') || '');
  response.end(responseText);
});

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
        command.toBuffer('PNG8',function (err, buffer) {
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

var loadAndFormatImage = function(path, request, response){
	var dither = request.param('Dither') && (request.param('Dither').toLowerCase() == 'true' ||  request.param('Dither') == '1');
	var sizeCheck = gm(path).size(function (err, size) {
	if (!err){
		console.log('width: ' + size.width + ' height: ' + size.height);
		var command = gm(path);
		if(!dither){
			command.dither(false);
		}
		command.map('pebble_64_transparent.gif');
		if(size.width > 96 || size.height > 96){
			command.resize(96,96);
		}
		console.log('gm command: ' + JSON.stringify(command));
		command.toBuffer('PNG8',function (err, buffer) {
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
};

var getMostRecentSprite = function(subDir, request, response){
	var pokemonName = request.param('Name');
	if(!pokemonName){
		var index = request.param('Index');
		console.log('Index: ' + index);
		console.log('pokemonNames count: ' + pokemonNames.length);
		if(index && pokemonNames && index <=  pokemonNames.length){
		  pokemonName =  pokemonNames[index];
		}
	}
	if(!pokemonName){
		response.end("No Pokemon name specified!");
		return;
	}
	pokemonName = pokemonName.toLowerCase();
	
	var spritePath = GetMostRecentSpritePath(pokemonName, false, subDir);
	loadAndFormatImage(spritePath, request, response);
};
app.get('/getMostRecentBackSprite', function(request, response){
	getMostRecentSprite("back", request, response);
});
app.get('/getMostRecentFrontSpriteShiny', function(request, response){
	getMostRecentSprite("shiny", request, response);
});
app.get('/getMostRecentFrontSprite', function(request, response){
	getMostRecentSprite("", request, response);
});
app.get('/getMostRecentBackSpriteShiny', function(request, response){
	getMostRecentSprite("shiny/back", request, response);
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
var retrieveNames = function(){
	pokemonNames = JSON.parse(fs.readFileSync('pokemonNames.txt', 'utf8'));
	console.log("Pokemon names retrieved: " + pokemonNames);
};
app.get('/pokemonNames', function(request, response){
	response.end(JSON.stringify(pokemonNames));
});
app.get('/pokemonName', function(request, response){
	var pokemonName = 'Name not found.';
	var index = request.param('Index');
	if(index && index <=  pokemonNames.length){
		pokemonName =  pokemonNames[index];
	}
	response.end(pokemonName);
});
app.get('/formatImage', function(request, response) {
  var imageUrl = request.param('ImageUrl');
  if(!imageUrl){
    response.end("No image URL provided!");
  }
  getAndFormatImage(imageUrl, request, response);
});

function GetMostRecentSpritePath(pokemonName, baseFormOnly, subDir){
	if(!pokemonName){
		console.log("GetMostRecentFrontSpritePath: No Pokemon name specified!");
		return;
	}
	
	pokemonName = pokemonName.replace(" ", "").replace(":", "");
	
	for(var i = generationFolders.length - 1; i > -1; i--)
	{
		var currentPath = "public/sprites/" + generationFolders[i] + "/";
		if(subDir)
			currentPath += subDir + "/";	
		if(baseFormOnly){	
			currentPath += pokemonName + ".png";
			if(fs.existsSync(currentPath)){
				return currentPath;
			}
		} else{
			var files = globby.sync(currentPath + pokemonName + '*.png');
			//console.log(files);			
			if(files && files.length > 0){
				var random = Math.floor(Math.random() * files.length);
				//console.log(random);
				return files[random];
			}							
		}
	}
	
	var message = "No sprite found for name: " + pokemonName;
	if(subDir)
		message += " in subdirectory: " + subDir;
	console.log(message);
}

retrieveNames();
