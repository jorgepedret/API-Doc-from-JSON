exports.profile = function (req, rsp, next) {
  console.log(req.session.account);
  if (req.session.account) {
    req.profile = req.session.account;
    next();
  } else {
    req.profile = null;
    next();
  }
}

exports.unauthorized = function (req, rsp, next) {
  if (req.profile) {
    rsp.status(401);
    rsp.redirect("/dashboard");
  } else {
    next();
  }
}

exports.authorized = function (req, rsp, next) {
  if (req.profile) {
    next();
  } else {
    rsp.status(401);
    rsp.redirect("/");
  }
}