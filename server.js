var express     = require("express");
var jade        = require("jade");
var port        = process.env.PORT || 8001;
var app         = express.createServer();

var config      = require("./config");
var doc         = config.doc;

// --------------------
// configure
// --------------------

app.configure(function () {
  app.set("view engine", "jade");
  app.set('views', __dirname + '/views'); 
  app.set('view options', { layout: "layouts/application", pretty: true, doc: doc });
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({cookie: { path: '/', httpOnly: true, maxAge: null }, secret:'ahloco'}));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/public"));
});

app.get("/", function(req, rsp) {
  rsp.render("home", {
    active: "home"
  });
});

app.get("/endpoints", function(req, rsp) {
  rsp.render("endpoints", {
    active: "endpoints"
  });
});

app.get("/endpoints/:group", function(req, rsp) {
  rsp.render("index", {
    active: req.params.group,
    group: doc.groups[req.params.group]
  });
});

// --------------------
// listen
// --------------------

app.listen(port)
console.log("API Doc Template Client is running on port ", port)