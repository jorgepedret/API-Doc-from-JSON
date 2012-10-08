app.parseErrors = function (rsp) {
  if (rsp.responseText) {
    try {
      var errors = JSON.parse(rsp.responseText)
      return errors;
    } catch (err) {
      return [rsp.responseText];
    }
  } else {
    return [rsp.statusText||"Sorry, unknown error"];
  }
}