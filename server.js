var fs          = require("fs");
var express     = require("express");
var jade        = require("jade");
var slugs       = require("slugs");
var redis       = require("redis");
var client      = redis.createClient();
var RedisStore  = require('connect-redis')(express);
var rolodex     = require("rolodex")();

var port        = process.env.PORT || 5001;
var app         = express.createServer();

var config      = require("./config");
var helpers     = require("./lib/helpers");
var middleware  = require("./lib/middleware");

var Doc         = require("./models/doc")(client);

var checkDoc = function (req, rsp, next) {
  Doc.getByContext(req.params.doc, req.profile, function (err, doc) {
    if (err) {
      req.flash("error", err.message);
      switch(err.type) {
        case 'login':
          rsp.redirect("/docs/" + req.params.doc + "/login");
          break;
        case 'forbidden':
          rsp.redirect("/dashboard");
          break;
        case 'invalid':
        default:
          rsp.redirect("/");
          break;
      }
    } else {
      req.doc = doc;
      next();
    }
  });
};

var authorized = [middleware.profile, middleware.authorized];
var unauthorized = [middleware.profile, middleware.unauthorized];

// --------------------
// configure
// --------------------
app.helpers(helpers.helpers);
app.dynamicHelpers(helpers.dynamicHelpers);

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

app.get("/features", middleware.profile, function (req, rsp) {
  rsp.render("features", {
    layout: "layouts/sales",
    active: "features"
  });
});

app.get("/examples", middleware.profile, function (req, rsp) {
  rsp.render("examples", {
    layout: "layouts/sales",
    active: "examples"
  });
});

app.get("/github", middleware.profile, function (req, rsp) {
  rsp.render("github", {
    layout: "layouts/sales",
    active: "github"
  });
});

app.get("/support", middleware.profile, function (req, rsp) {
  rsp.render("support", {
    layout: "layouts/sales",
    active: "support"
  });
});

app.get("/logout", authorized, function (req, rsp) {
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
      req.flash("error", err.messages);
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
      fs.mkdir(__dirname + "/docs/" + account.id, "0777", function () {
        req.session.account = account;
        rsp.redirect("/dashboard");
      })
    }
  })
});

app.get("/dashboard", authorized, function (req, rsp) {
  Doc.allByOwnerId(req.profile.id, function (docs) {
    rsp.render("dashboard", {
      title: "Dashboard",
      docs: docs
    });
  });
});

app.get("/docs/new", authorized, function (req, rsp) {
  rsp.render("new-doc", {
    title: "Add new doc",
    active: "new-doc"
  });
});

app.post("/docs/new", authorized, function (req, rsp) {
  Doc.set({
    owner: req.profile.id,
    name: req.body.name,
    slug: req.body.slug,
    base_url: req.body.base_url,
    intro: req.body.intro,
    endpoints_intro: req.body.endpoints_intro,
    groups: {}
  }, function (err, doc) {
    if (err) {
      req.flash("error", err.messages);
      rsp.redirect("/docs/new");
    } else {
      req.flash('success', "Doc created successfully! Time to <a href='#'>add a group</a>");
      rsp.redirect("/docs/" + doc.slug);
    }
  });
});

app.get("/docs/checkSlug", function (req, rsp) {
  var slug = req.query.slug||'';
  Doc.get({ slug: slug }, function (doc) {
    if (!doc) {
      rsp.status(200);
      rsp.send("");
    } else {
      rsp.status(409);
      rsp.send({
        messages: [ "This URL is already taken" ],
        details: { "url": "already taken" }
      });
    }
  });
});

app.get("/docs/:doc", middleware.profile, checkDoc, function (req, rsp) {
  var params = {
    layout: "layouts/doc-edit",
    title: "Instagram API",
    active: "home",
    doc: req.doc
  }
  if (!req.doc.canEdit || req.query.preview) {
    // Read only access
    params.layout = "layouts/doc";
  }
  if (req.query.preview) {
    // Enable preview mode
    params.preview = true;
  }
  rsp.render("doc/intro", params);
});

app.get("/docs/:doc/delete", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/delete", {
    layout: "layouts/doc-edit",
    doc: req.doc
  })
});

app.delete("/docs/:doc", authorized, checkDoc, function (req, rsp) {
  var doc = req.doc;
  // Make sure it's the owner of the doc
  if (doc.owner === req.profile.id) {
    Doc.del(doc.id, function (err) {
      req.flash("success", "Doc deleted");
      rsp.redirect("/dashboard");
    });
  } else {
    req.flash("error", "Sorry, You don't have permission to delete this doc!");
    rsp.redirect("/docs/" + req.params.doc + "");
  }
});

app.get("/docs/:doc/sharing", authorized, checkDoc, function (req, rsp) {
  var doc = req.doc;
  var sharingAccounts = [];
  var editCount = doc.editAccess.length;
  var viewCount = doc.viewAccess.length;
  var totalCount = editCount + viewCount;
  var count = 0;
  function response() {
    rsp.render("doc/sharing", {
      layout: "layouts/doc-edit",
      title: "Sharing | " + req.doc.name,
      active: "asdasda",
      doc: req.doc,
      sharingAccounts: sharingAccounts
    });
  }
  if (totalCount <= 0) {
    response();
  }
  doc.editAccess.forEach(function (userId) {
    rolodex.account.get(userId, function (account) {
      account.canEdit = true;
      sharingAccounts.push(account);
      count++;
      if (count >= totalCount) {
        response();
      }
    });
  });
  doc.viewAccess.forEach(function (userId) {
    rolodex.account.get(userId, function (account) {
      account.canEdit = false;
      sharingAccounts.push(account);
      count++;
      if (count >= totalCount) {
        response();
      }
    });
  });
});

function getAccount(email, cb) {
  rolodex.account.get({ email: email}, function (account) {
    if (!account) {
      rolodex.account.set({
        email: email,
        password: "123456",
        password_confirmation: "123456"
      }, function (err, account) {
        cb(err, account);
      })
    } else {
      cb(null, account);
    }
  });
}

app.post("/docs/:doc/sharing", authorized, checkDoc, function (req, rsp) {
  var doc = req.doc;
  function saveDoc(id, doc) {
    Doc.get({ slug: doc.slug }, function (exists) {
      if (exists) {
        Doc.set(id, doc, function (err, doc) {
          req.flash("success", "Sharing settings saved!");
          rsp.redirect("/docs/" + req.params.doc + "/sharing");
        });
      } else {
        req.flash("error", "Invalid API Doc");
        rsp.redirect("/docs/" + req.params.doc);
      }
    });
  }
  if (doc.isOwner) {
    switch (req.body.access) {
      case 'public':
        doc.isPublic = true;
        doc.editAccess = [];
        doc.viewAccess = [];
        saveDoc(doc.id, doc);
        break;
      case 'emails':
        doc.isPublic = false;
        doc.editAccess = [];
        doc.viewAccess = [];
        var count = 0;
        if (req.body.emails && req.body.emails.length) {
          req.body.emails.forEach(function (email) {
            getAccount(email.email, function (err, account) {
              if (email.canEdit) {
                doc.editAccess.push(account.id);
              } else {
                doc.viewAccess.push(account.id);
              }
              count++;
              if (count >= req.body.emails.length) {
                saveDoc(doc.id, doc);
              }
            });
          });
        }
        break;
      case 'url':
        doc.isPublic = false;
        saveDoc(doc.id, doc);
        break;
    }
  } else {
    req.flash("error", "Access denied");
    rsp.redirect("/docs/" + req.params.doc);
  }
});

app.get("/docs/:doc/new-group", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/new-group", {
      title: "Add new group",
      active: "new-group",
      layout: "layouts/doc-edit",
      doc: req.doc
    });
});

app.post("/docs/:doc/new-group", authorized, checkDoc, function (req, rsp) {
  var id = slugs(req.body.name);
  if (!req.doc.groups) req.doc.groups = {};
  req.doc.groups[id] = {
    name: req.body.name,
    title: req.body.title,
    intro: req.body.intro
  };
  Doc.set(req.doc.id, req.doc, function (err, doc) {
    if (err) {
      req.flash("error", "Fail: ", err.messages);
      rsp.redirect("/docs/" + req.params.doc + "/endpoints");
    } else {
      req.flash('success', "Group successfully created!", req.params.group);
      rsp.status(201);
      rsp.redirect("/docs/" + req.params.doc + "/endpoints/" + id);
    }
  });
});

app.get("/docs/:doc/new-endpoint", authorized, checkDoc, function (req, rsp) {
  rsp.render("doc/new-endpoint", {
    title: "Add new endpoint",
    active: "new-endpoint",
    layout: "layouts/doc-edit",
    doc: req.doc
  });
});

app.post("/docs/:doc/new-endpoint", authorized, checkDoc, function (req, rsp) {
  var group = req.doc.groups[req.body.group];
  if (typeof group === "undefined") {
    req.flash("error", "Invalid group: %s", req.body.group);
    rsp.redirect("/docs/" + req.params.doc + "/new-group");
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
    Doc.set(req.doc.id, req.doc, function (err, doc) {
      if (err) {
        req.flash("error", err.messages);
        rsp.redirect("/docs/" + req.params.doc + "/endpoints/");
      } else {
        rsp.redirect("/docs/" + req.params.doc + "/endpoints/" + req.body.group);
      }
    });
  }
});

app.get("/docs/:doc/endpoints", middleware.profile, checkDoc, function (req, rsp) {
  var params = {
    title: "Endpoints overview",
    active: "endpoints",
    layout: "layouts/doc-edit",
    doc: req.doc
  }
  if (!req.doc.canEdit || req.query.preview) {
    // Read only access
    params.layout = "layouts/doc";
  }
  if (req.query.preview) {
    // Enable preview mode
    params.preview = true;
  }
  rsp.render("doc/endpoints-intro", params);
});

app.get("/docs/:doc/endpoints/:group", middleware.profile, checkDoc, function (req, rsp) {
  if (req.doc.groups[req.params.group]) {
    var params = {
      layout: "layouts/doc-edit",
      title: req.doc.groups[req.params.group].name,
      active: req.params.group,
      group: req.doc.groups[req.params.group],
      group_id: req.params.group,
      doc: req.doc
    }
    if (!req.doc.canEdit || req.query.preview) {
      // Read only access
      params.layout = "layouts/doc";
    }
    if (req.query.preview) {
      // Enable preview mode
      params.preview = true;
    }
    rsp.render("doc/endpoints", params);
  } else {
    req.flash("error", "Invalid group: %s", req.params.group);
    rsp.redirect("/docs/" + req.params.doc + "/endpoints");
  }
});

// --------------------
// listen
// --------------------

app.listen(port)
console.log("API Doc Template Client is running on port ", port)