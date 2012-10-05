var fs          = require("fs");
var express     = require("express");
var jade        = require("jade");
var slugs       = require("slugs");
var port        = process.env.PORT || 8001;
var app         = express.createServer();

var config      = require("./config");
var doc         = config.doc;

var getResponse = function (group, ep) {
  var data = "Not provided";
  var file = __dirname + "/views/responses/" + group + "/" + ep + "-response.txt";
  if (fs.existsSync(file)) {
    data = fs.readFileSync(file, "utf8");
  }
  return data;
}

// --------------------
// configure
// --------------------

app.configure(function () {
  app.set("view engine", "jade");
  app.set('views', __dirname + '/views'); 
  app.set('view options', {
    layout: "layouts/application",
    pretty: true,
    doc: doc,
    getResponse: getResponse
  });
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

app.get("/new-group", function (req, rsp) {
  rsp.render("new-group", {
    active: "new-group"
  });
});

app.post("/new-group", function (req, rsp) {
  var id = slugs(req.body.name);
  doc.groups[id] = {
    name: req.body.name,
    title: req.body.title,
    intro: req.body.intro
  }
  rsp.status(201);
  rsp.redirect("/endpoints/" + id);
});

app.get("/new-endpoint", function (req, rsp) {
  rsp.render("new-endpoint", {
    active: "new-endpoint"
  });
});
app.post("/new-endpoint", function (req, rsp) {
  var group = doc.groups[req.body.group];
  var id = slugs(req.body.name);
  if (!group.endpoints) group.endpoints = {};
  group.endpoints[id] = {
    method: req.body.method,
    path: req.body.path,
    name: req.body.name,
    description: req.body.description,
    params: req.body.params,
    curl: req.body.curl,
    response: req.body.response
  };
  rsp.redirect("/endpoints/" + req.body.group);
});

app.get("/endpoints", function(req, rsp) {
  rsp.render("endpoints", {
    active: "endpoints"
  });
});

app.get("/endpoints/:group", function(req, rsp) {
  if (doc.groups[req.params.group]) {
    rsp.render("index", {
      active: req.params.group,
      group: doc.groups[req.params.group],
      group_id: req.params.group
    });
  } else {
    rsp.redirect("/endpoints");
  }
});

// --------------------
// listen
// --------------------

app.listen(port)
console.log("API Doc Template Client is running on port ", port)