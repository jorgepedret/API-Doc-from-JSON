(function (app, window) {
  "use stric";
  $(function () {
    app.router = new app.Router();
    Backbone.history.start({ pushState: true });
  });
})(app, window, undefined);