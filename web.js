var fs = require('fs'); 
var express = require('express');
var htmlFile = 'index.html';
var app = express();

app.use(express.logger());

app.get('/', function(request, response) {
  var content = fs.readFileSync(htmlFile);
  response.send(content.toString());
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
  console.log("Listening on " + port);
});
