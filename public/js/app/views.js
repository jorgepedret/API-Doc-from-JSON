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