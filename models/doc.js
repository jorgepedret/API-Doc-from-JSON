var Thug = require("Thug");
var fs   = require("fs");
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
        filters.file
      ],
      beforeWrite: [
        filters.updated_at,
        filters.created_at
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
    
    client.hgetall(key, function (err, old) {
      var dbObj = {
        owner: obj.owner,
        id: obj.id,
        name: obj.name,
        created_at: obj.created_at,
        updated_at: obj.updated_at
      };
      if (!old) {
        // Couldn't find the object, so it most be a new record
        client.multi()
        .hmset(key, dbObj)
        .zadd(namespace + ":collection", (new Date(obj.created_at).getTime()), obj.id)
        .sadd("user:" + obj.owner + ":doc:collection", obj.id)
        .exec(function (err, replies) {
          callback(err, obj);
        });
      } else {
        client.hmset(key, dbObj, function (err, replies) {
          callback(err, obj);
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
        client.hgetall(namespace + ":" + id, callback);
      });
    } else {
      client.hgetall(namespace + ":" + q, callback);
    }
  }

  doc.constructor.prototype.getByContext = function (identifier, profile, callback) {
    this.read(identifier, function (doc) {
      if (doc) {
        if (doc.isPublic) {
          doc.isOwner = doc.owner === profile.id;
          doc.canEdit = !!doc.canEdit&&doc.canEdit[profile.id];
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
            var canView = !!doc.canView&&doc.canView[profile.id];
            var canEdit = !!doc.canEdit&&doc.canEdit[profile.id];
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
  doc.constructor.prototype.remove = function (identifier, record, callback) {
    var file_path = config.docs_dir + identifier + ".json";
    fs.unlink(file_path, function (err) {
      callback(err);
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
        cb(reply);
      } else {
        var count = reply.length;
        reply.forEach(function (id) {
          client.hgetall(namespace + ":" + id, function (err, obj) {
            docs.push(obj);
            if (--count == 0) {
              cb(docs);
            }
          })
        });
      }
    })
  }

  return doc;
}