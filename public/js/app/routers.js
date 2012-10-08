app.Router = Backbone.Router.extend({
  routes: {
    "login": "login",
    "docs/:doc/sharing": "sharing"
  },
  initialize: function () {
    $(".eps-index a").smoothScroll({
      offset: -60
    });
  },
  login: function () {
    $("[name=email]").focus();
  },
  sharing: function () {
    $("[name=access]").on("change", function () {
      var access = $(this).val();
      $(".sharing-option").addClass("hide");
      $(".sharing-option-" + access).removeClass("hide");
    });
  }
});