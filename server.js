var fs          = require("fs");
var express     = require("express");
var jade        = require("jade");
var slugs       = require("slugs");
var RedisStore  = require('connect-redis')(express);
var rolodex     = require("rolodex")();

var port        = process.env.PORT || 8001;
var app         = express.createServer();

var config      = require("./config");
var helpers     = require("./lib/helpers");
var middleware  = require("./lib/middleware");

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
};

var authorized = [middleware.profile, middleware.authorized];
var unauthorized = [middleware.profile, middleware.unauthorized];

// --------------------
// configure
// --------------------
app.helpers(helpers.helpers);
app.dynamicHelpers(helpers.dynamicHelpers);

// var checkDoc = middleware.checkDoc;

app.configure(function () {
  app.set("view engine", "jade");
  app.set('views', __dirname + '/views'); 
  app.set('view options', { layout: "layouts/application", pretty: true });
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: "ahloco", store: new RedisStore }));
  app.use(express.methodOverride());
  app.use(express.static(__dirname + "/public"));
});

app.get("/", unauthorized, function (req, rsp) {
  rsp.render("home", {
    layout: "layouts/sales"
  });
});

app.get("/logout", authorized, function (req, rsp) {
  console.log("SHIT!");
  req.session.account = null;
  rsp.redirect("/");
});

app.get("/login", unauthorized, function (req, rsp) {
  rsp.render("login", {
    layout: "layouts/sales"
  });
});
app.post("/login", unauthorized, function (req, rsp) {
  rolodex.account.authenticate({ email: req.body.email}, req.body.password, function (err, account) {
    if (err) {
      req.flash("error", err);
      rsp.redirect("/login");
    } else {
      req.session.account = account;
      rsp.redirect("/dashboard");
    }

  })
});

app.get("/signup", unauthorized, function (req, rsp) {
  rsp.render("signup", {
    layout: "layouts/sales"
  });
});
app.post("/signup", unauthorized, function (req, rsp) {
  rolodex.account.set({
    email: req.body.email,
    password: req.body.password,
    password_confirmation: req.body.confirm
  }, function (err, account) {
    if (err) {
      req.flash("error", err.messages);
      rsp.redirect("/signup");
    } else {
      req.session.account = account;
      rsp.redirect("/dashboard");
    }
  })
});

app.get("/dashboard", authorized, function (req, rsp) {
  var docs = config.docs;
  rsp.render("dashboard", {
    title: "Dashboard",
    docs: docs
  });
});

app.get("/new-doc", authorized, function (req, rsp) {
  rsp.render("new-doc", {
    title: "Add new doc",
    active: "new-doc"
  });
});

app.post("/new-doc", authorized, function (req, rsp) {
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

app.get("/:doc", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/intro", {
      layout: "layouts/doc",
      title: "Instagram API",
      active: "home",
      doc: req.doc
    });
});

app.get("/:doc/new-group", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/new-group", {
      title: "Add new group",
      active: "new-group",
      layout: "layouts/doc",
      doc: req.doc
    });
});

app.post("/:doc/new-group", authorized, checkDoc, function (req, rsp) {
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

app.get("/:doc/new-endpoint", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/new-endpoint", {
    title: "Add new endpoint",
    active: "new-endpoint",
    layout: "layouts/doc",
    doc: req.doc
  });
});
app.post("/:doc/new-endpoint", authorized, checkDoc, function (req, rsp) {

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

app.get("/:doc/endpoints", authorized, checkDoc, function(req, rsp) {
  rsp.render("doc/endpoints-intro", {
    title: "Endpoints overview",
    active: "endpoints",
    layout: "layouts/doc",
    doc: req.doc
  });
});

app.get("/:doc/endpoints/:group", authorized, checkDoc, function(req, rsp) {
  if (req.doc.groups[req.params.group]) {
    rsp.render("doc/endpoints", {
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