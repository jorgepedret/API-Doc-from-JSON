var fs          = require("fs");
var express     = require("express");
var jade        = require("jade");
var slugs       = require("slugs");
var port        = process.env.PORT || 8001;
var app         = express.createServer();

var config      = require("./config");
var doc         = config.doc;

// --------------------
// configure
// --------------------

app.helpers({ doc: doc });
app.dynamicHelpers({
  flashMessages: function (req, rsp) {
    var html = '';
    ['error', 'info', 'success'].forEach(function (type) {
      var messages = req.flash(type);
      if (messages.length > 0) {
        html += '<div class="alert alert-' + type + '">' + messages.join(', ') + '</div>';
      }
    });
    return html;
  }
});

app.configure(function () {
  app.set("view engine", "jade");
  app.set('views', __dirname + '/views'); 
  app.set('view options', { layout: "layouts/application", pretty: true });
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
  req.flash('success', "Group created successfully!", req.params.group);
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
  if (typeof group === "undefined") {
    req.flash('error', "Invalid group: %s", req.body.group);
    rsp.redirect("/new-group");
  } else {
    var id = slugs(req.body.name);
    if (typeof group.endpoints === "undefined") group.endpoints = {};
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
  }
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
    req.flash('error', "Invalid group: %s", req.params.group);
    rsp.redirect("/endpoints");
  }
});

// --------------------
// listen
// --------------------

app.listen(port)
console.log("API Doc Template Client is running on port ", port)