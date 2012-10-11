app.NotificationsView = app.View.extend({
  showMessage: function (message) {
    var self = this;
    var html = $("<div class='message'>" + message + "</div>");
    if (this.$el.hasClass("hide")) {
      this.$el.removeClass("hide");
    }
    this.$el.append(html);
    setTimeout(function () {
      html.fadeOut(function () {
        $(this).remove();
        if (self.$(".message").length <= 0) {
          self.$el.addClass("hide");
        }
      });
    }, 3000);
  }
});

app.DocFormView = app.View.extend({
  events: {
    "keyup [name=slug]": "checkSlugAvailability"
  },
  checkSlugAvailability: function (e) {
    var input = $(e.currentTarget);
    var wantedSlug = input.val();
    if (self.timeId) clearTimeout(self.timeId);
    self.timeId = setTimeout(function () {
      $.get("/docs/checkSlug", { slug: wantedSlug })
      .success(function (data, status, rsp) {
        self.$(".slug-status i").prop("class", "icon-ok");
      })
      .error(function (data, status, rsp) {
        self.$(".slug-status i").prop("class", "icon-warning-sign");
      });
    }, 100);
  }
});