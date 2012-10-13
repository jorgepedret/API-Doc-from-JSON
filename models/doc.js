var Thug = require("Thug");
var fs   = require("fs");
var async   = require("async");
var config  = require("../config");
var filters = require("./filters").doc;

module.exports = function (client) {
  var doc = new Thug({
    locals: {
      "client": client,
      "namespace": "doc"
    },
    filters: {
      in: [
        filters.blacklist
      ],
      beforeValidate: [
        filters.id,
        filters.slug,
        filters.file
      ],
      beforeWrite: [
        filters.updated_at,
        filters.created_at,
        filters.clean_up,
        filters.optional_props
      ],
      out: []
    },
    validations: {

    }
  });

  // Write
  doc.constructor.prototype.write = function (identifier, obj, cb) {
    var namespace = this.locals.namespace;
    var client = this.locals.client;
    
    var key = namespace + ":" + obj.id;

    var callback = function (err, obj) {
      var dir_path = config.docs_dir + obj.owner + "/";
      fs.writeFile(dir_path + obj.id + ".json", JSON.stringify(obj, null, 2), "utf8", function (err) {
        if (!err) {
          cb(obj);
        }
      });
    }

    var updatePermissions = function (oldObj, obj, cb) {
      var oldEditAccess = oldObj.editAccess||[];
      var oldViewAccess = oldObj.viewAccess||[];
      var count = 0;

      obj.editAccess = obj.editAccess || [];
      
      oldEditAccess.forEach(function (userId) {
        client.srem("user:" + userId + ":doc:collection");
      });
      obj.editAccess.forEach(function (userId) {
        client.sadd("user:" + userId + ":doc:collection", obj.id);
      });
      
      oldViewAccess.forEach(function (userId) {
        client.srem("user:" + userId + ":doc:collection");
      });
      obj.viewAccess.forEach(function (userId) {
        client.sadd("user:" + userId + ":doc:collection", obj.id);
      });
      cb(null);
    }
    
    client.hgetall(key, function (err, old) {
      var dbObj = {
        owner: obj.owner,
        id: obj.id,
        slug: obj.slug,
        name: obj.name,
        created_at: obj.created_at,
        updated_at: obj.updated_at
      };
      if (!old) {
        // Couldn't find the object, so it most be a new record
        client.multi()
        .hmset(key, dbObj)
        .zadd(namespace + ":collection", (new Date(obj.created_at).getTime()), obj.id)
        .sadd("user:" + obj.owner + ":" + namespace + ":collection", obj.id)
        .set(namespace + ":slug:" + obj.slug, obj.id)
        .exec(function (err, replies) {
          callback(err, obj);
        });
      } else {
        updatePermissions(old, obj, function (err) {
          client.hmset(key, dbObj, function (err, replies) {
            callback(err, obj);
          });
        });
      }
    });
  }
  // Read
  doc.constructor.prototype.read = function (q, cb) {
    var namespace = this.locals.namespace;
    var client = this.locals.client;
    var callback = function (err, obj) {
      if (err) return cb(null);

      var dir_path = config.docs_dir + obj.owner + "/";
      
      fs.readFile(dir_path + obj.id + ".json", "utf8", function (err, data) {
        if (err) return cb(err);
        var jsonData = JSON.parse(data);
        cb(jsonData);
      })
    }
    if (typeof q === 'object') {
      for (var key in q) {
        break;
      }
      client.get(namespace + ":" + key + ":" + q[key], function (err, id){
        if (id) {
          client.hgetall(namespace + ":" + id, callback);
        } else {
          callback("Doesn't exists", null);
        }
      });
    } else {
      client.hgetall(namespace + ":" + q, callback);
    }
  }

  doc.constructor.prototype.getByContext = function (identifier, profile, callback) {
    profile = profile||{};
    this.read({slug: identifier}, function (doc) {
      if (doc) {
        doc.editAccess = doc.editAccess||[];
        doc.viewAccess = doc.viewAccess||[];
        if (doc.isPublic) {
          doc.isOwner = doc.owner === profile.id;
          doc.canEdit = (doc.editAccess&&doc.editAccess[profile.id])||doc.owner === profile.id;
          callback(null, doc);
        } else {
          if (!profile) {
            var error = {
              type: "login",
              message: "Please login to access this doc"
            }
            callback(error, null);
          } else {
            var responseDoc = {};
            var isOwner = doc.owner === profile.id;
            var canView = doc.viewAccess.indexOf(profile.id)!==-1;
            var canEdit = doc.editAccess.indexOf(profile.id)!==-1;
            if (isOwner) {
              responseDoc = doc;
              responseDoc.isOwner = true;
              responseDoc.canEdit = true;
            }
            if (canView) {
              responseDoc = doc;
            }
            if (canEdit) {
              responseDoc = doc;
              responseDoc.canEdit = true;
            }
            if (!isOwner && !canEdit && !canView) {
              var error = {
                type: "forbidden",
                message: "You don't have access to view or edit this doc"
              }
              callback(error, null);
            } else {
              callback(null, responseDoc);
            }
          }
        }
      } else {
        var error = {
          type: "invalid",
          message: "Invalid doc URL"
        }
        callback(error, null);
      }
    });
  }

  // Remove
  doc.constructor.prototype.remove = function (id, obj, cb) {

    var namespace = this.locals.namespace;
    var client = this.locals.client;
    
    var key = namespace + ":" + obj.id;

    client.hgetall(key, function (err, old) {
      client.multi()
      .del(key)
      .zrem(namespace + ":collection", obj.id)
      .srem("user:" + obj.owner + ":doc:collection", obj.id)
      .exec(function (err, replies) {
        var file_path = config.docs_dir + obj.owner + "/" + obj.id + ".json";
        fs.unlink(file_path, function (err) {
          cb(err);
        });
      });
    });
  }

  doc.constructor.prototype.allByOwnerId = function (owner, cb) {
    var client = this.locals.client;
    var namespace = this.locals.namespace;
    var that = this;
    var docs = [];
    client.smembers("user:" + owner + ":doc:collection", function (err, reply){
      var total = reply.length;
      if (total <= 0) {
        cb(docs);
      } else {
        var count = reply.length;
        async.map(reply, function (id, callback) {
          client.hgetall(namespace + ":" + id, function (err, obj) {
            if (!err && obj) docs.push(obj);
            callback(err, obj);
          })
        }, function () {
          cb(docs);
        });
      }
    })
  }

  return doc;
}