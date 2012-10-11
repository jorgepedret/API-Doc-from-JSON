app.Router = Backbone.Router.extend({
  routes: {
    "login": "login",
    "docs/new": "newDoc",
    "docs/:doc/sharing": "sharing",
    "docs/:doc/new-endpoint": "newEndpoint"
  },
  initialize: function () {
    $(".eps-index a").smoothScroll({
      offset: -60
    });
  },
  login: function () {
    $("[name=email]").focus();
  },
  newDoc: function () {
    var docFormView = new app.DocFormView({ el: $("#doc-new") });
  },
  sharing: function () {
    $("[name=access]").on("change", function () {
      var access = $(this).val();
      $(".sharing-option").addClass("hide");
      $(".sharing-option-" + access).removeClass("hide");
    });

    $(".repeatable").repeatable();
  },
  newEndpoint: function () {
    $(".repeatable").repeatable();
  }
});