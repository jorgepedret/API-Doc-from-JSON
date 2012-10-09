var slugs = require('slugs');
var uuid = require('node-uuid');
var fs    = require('fs');
var config= require('../config');
var docs_dir = config.docs_dir;

exports.doc = {
  blacklist: function (obj, next) {
    delete obj.id;
    delete obj.slug;
    delete obj.created_at;
    delete obj.updated_at;
    next(obj);
  },
  id: function (obj, next) {
    if (!obj.id) {
      obj.id = uuid.v4();
    }
    next(obj);
  },
  slug: function (obj, next) {
    if (!obj.slug) {
      obj.slug = slugs(obj.name);
    }
    next(obj);
  },
  file: function (obj, next) {
    var filename = obj.id + ".json";
    var dir_path = docs_dir + "/" + obj.owner + "/";
    fs.exists(dir_path, function (ownerExists) {
      if (!ownerExists) fs.mkdirSync(dir_path);
      fs.exists(dir_path + filename, function (exists) {
        if (!exists) {
          fs.writeFile(dir_path + filename, "", "utf8", function () {
            next(obj);
          });
        } else {
          next(obj);
        }
      });
    });
  },
  created_at: function (obj, next) {
    if (!obj.created_at) {
      obj.created_at = (new Date()).toJSON();
    }
    next(obj);
  },
  updated_at: function (obj, next) {
    obj.updated_at = (new Date()).toJSON();
    next(obj);
  }
};

exports.group = {
  blacklist: function (obj, next) {
    delete obj.id;
    delete obj.created_at;
    delete obj.updated_at;
    next(obj);
  },
  id: function (obj, next) {
    if (!obj.id) {
      obj.id = uuid.v4();
    }
    next(obj);
  },
  slug: function (obj, next) {
    obj.slug = slugs(obj.name);
    next(obj);
  },
  created_at: function (obj, next) {
    if (!obj.created_at) {
      obj.created_at = (new Date()).toJSON();
    }
    next(obj);
  },
  updated_at: function (obj, next) {
    obj.updated_at = (new Date()).toJSON();
    next(obj);
  }
};

exports.endpoint = {
  
};