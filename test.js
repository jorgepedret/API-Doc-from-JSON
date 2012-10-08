var Thug = require("thug");

var Beer = new Thug();

// Define what you want it to do on write
Beer.constructor.prototype.write = function (identifier, record, callback) {
  global[identifier] = record;
  callback(record);
}

//Define how you want it to read
Beer.constructor.prototype.read = function (identifier, callback) {
  callback(global[identifier]);
}

Beer.set("IPA", { name: "IPA", taste: "Bitter" }, function (errors, record) {
  console.log(record);
});

Beer.get("IPA", function (record) {
  console.log(record);
});