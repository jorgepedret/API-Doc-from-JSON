var should = require("should");
var redis  = require("redis");
var client = redis.createClient();

describe("multi", function(){
  var obj = {
    owner: 'a-b-c',
    id: 'foo',
    name: 'bar',
    created_at: '2012-10-06T09:26:25.596Z',
    updated_at: '2012-10-06T09:28:54.929Z'
  };
  var obj2 = {
    owner: 'a-b-c',
    id: 'baz',
    name: 'pub',
    created_at: '2012-10-06T09:26:25.596Z',
    updated_at: '2012-10-06T09:28:54.929Z'
  };

  var replies = ["foo", "baz"];

  before(function(done){
    // Setting the values
    client.multi()
    .hmset("doc:foo", obj)
    .sadd("user:a-b-c:doc:collection", "foo")
    .hmset("doc:baz", obj2)
    .sadd("user:a-b-c:doc:collection", "baz")
    .exec(function (err, replies) {
      if (!err) done();
    });
  });

  it("should return all the values set", function(done) {
    var tests_count = 100;
    var count = 0;
    for (var i=0; i <= tests_count; i++) {
      client.smembers("user:a-b-c:doc:collection", function (err, reply){
        var transaction = client.multi();
        reply.forEach(function (id) {
          transaction.hgetall("doc:" + id);
        });
        transaction.exec(function (err, replies) {
          should.not.exist(err);
          replies[0].should.have.property("id");
          replies[1].should.have.property("id");
          replies[1].id.should.eql("baz");
          replies[1].name.should.eql("pub");
          count++;
          if (count > tests_count) {
            done();
          }
        });
      });
    }
  });
  
  after(function(done){
    client.multi()
    .del("doc:foo")
    .del("doc:baz")
    .exec(function (err, replies) {
      if (!err) done();
    });
  });
})