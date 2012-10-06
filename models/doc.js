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
    client.smembers("user:" + owner + ":doc:collection", function (err, reply){
      var total = reply.length;
      var count = 0;
      var transaction = client.multi();
      if (total <= 0) {
        cb(reply);
      } else {
        reply.forEach(function (id) {
          transaction.hgetall(namespace + ":" + id);
        });
        
        transaction.exec(function (err, replies) {
          console.log("ERROR: ", err);
          if (err) cb([]);
          replies.forEach(function (obj, index) {
            that.out(replies[index], function (record) {
              count++;
              if(count === total){
                cb(replies);
              }
            })
          })
        })
      }
    })
  }

  return doc;
}