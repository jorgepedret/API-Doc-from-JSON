var fs          = require("fs");
var express     = require("express");
var jade        = require("jade");
var slugs       = require("slugs");
var md          = require("node-markdown").Markdown;
var port        = process.env.PORT || 8001;
var app         = express.createServer();

var config      = require("./config");
var doc         = config.docs.instagram;

// --------------------
// configure
// --------------------

app.helpers({
  doc: doc,
  title: "APIme",
  md: function (mdString) {
    mdString = mdString.replace(/\n/g, '<br />');
    return md(mdString, true, "br|a|small|strong");
  }
});
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
var checkDoc = function (req, rsp, next) {
  var doc = config.docs[req.params.doc];
  if (typeof doc === "undefined") {
    req.flash('error', "Invalid doc page");
    rsp.redirect("/");
  } else {
    doc.id = req.params.doc;
    req.doc = doc;
    next();
  }
}
var middleware = [];

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

app.get("/", function (req, rsp) {
  rsp.redirect("/dashboard");
});

app.get("/dashboard", function (req, rsp) {
  var docs = config.docs;
  rsp.render("dashboard", {
    title: "Dashboard",
    docs: docs
  });
});

app.get("/new-doc", function (req, rsp) {
  rsp.render("new-doc", {
    title: "Add new doc",
    active: "new-doc"
  });
});

app.post("/new-doc", function (req, rsp) {
  var docs = config.docs;
  var id = slugs(req.body.name);
  if (typeof docs[id] !== "undefined") {
    req.flash('error', "A doc with this name already ");
    rsp.redirect("/new-doc");
  } else {
    docs[id] = {
      "name": req.body.name,
      "base_url": req.body.base_url,
      "intro": req.body.intro,
      "endpoints_intro": req.body.endpoints_intro,
      "groups": {}
    };
    rsp.redirect("/" + id);
  }
});

app.get("/:doc", checkDoc, function (req, rsp) {
  rsp.render("home", {
      layout: "layouts/doc",
      title: "Instagram API",
      active: "home",
      doc: req.doc
    });
});

app.get("/:doc/new-group", checkDoc, function (req, rsp) {
  rsp.render("new-group", {
      title: "Add new group",
      active: "new-group",
      layout: "layouts/doc",
      doc: req.doc
    });
});

app.post("/:doc/new-group", checkDoc, function (req, rsp) {
  var id = slugs(req.body.name);
  if (!req.doc.groups) req.doc.groups = {};
  req.doc.groups[id] = {
    name: req.body.name,
    title: req.body.title,
    intro: req.body.intro
  };

  req.flash('success', "Group successfully created!", req.params.group);
  rsp.status(201);
  rsp.redirect("/" + req.params.doc + "/endpoints/" + id);
});

app.get("/:doc/new-endpoint", checkDoc, function (req, rsp) {
  rsp.render("new-endpoint", {
    title: "Add new endpoint",
    active: "new-endpoint",
    layout: "layouts/doc",
    doc: req.doc
  });
});
app.post("/:doc/new-endpoint", checkDoc, function (req, rsp) {

  var group = req.doc.groups[req.body.group];
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
    rsp.redirect("/" + req.params.doc + "/endpoints/" + req.body.group);
  }
});

app.get("/:doc/endpoints", checkDoc, function(req, rsp) {
  rsp.render("endpoints", {
    title: "Endpoints overview",
    active: "endpoints",
    layout: "layouts/doc",
    doc: req.doc
  });
});

app.get("/:doc/endpoints/:group", checkDoc, function(req, rsp) {
  if (req.doc.groups[req.params.group]) {
    rsp.render("index", {
      layout: "layouts/doc",
      title: req.doc.groups[req.params.group].name,
      active: req.params.group,
      group: req.doc.groups[req.params.group],
      group_id: req.params.group,
      doc: req.doc
    });
  } else {
    req.flash('error', "Invalid group: %s", req.params.group);
    rsp.redirect("/" + req.params.doc + "/endpoints");
  }
});

// --------------------
// listen
// --------------------

app.listen(port)
console.log("API Doc Template Client is running on port ", port)