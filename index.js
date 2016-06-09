var express = require('express')
var app = express()

app.set('port', (process.env.PORT || 5000))
app.use(express.static(__dirname + '/public'))
var fs = require('fs');
console.log("fs loaded");
// read binary data
var bitmap = fs.readFileSync('./006.png');
console.log('File loaded.');
// convert binary data to base64 encoded string
var actualBase64 = new Buffer(bitmap).toString('base64');
console.log('Base64 encoded');
var responseData = { 
  actualBase64: actualBase64
}
app.get('/', function(request, response) {
  //response.sendfile('settings.html');
  response.end(JSON.stringify(responseData));
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
