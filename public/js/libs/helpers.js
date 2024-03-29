$.fn.repeatable = function (options) {
  return this.each(function () {
    var that = $(this);
    that.$ = that.find;
    var template = that.$(".repeatable-item-template");
    var addBtn = that.$(".repeatable-add");
    var remBtn = that.$(".repeatable-rem");
    var itemTemplate = function () {
      var newTemplate = template.clone();
      newTemplate
      .removeClass("repeatable-item-template hide")
      .addClass("repeatable-item")
      that.append(newTemplate);
      return newTemplate;
    }
    var checkCount = function () {
      var count = 0;
      that.$(".repeatable-item").each(function () {
        $(this).find("[name*='[]']").prop("name", function (index, oldValue) {
          var newValue = oldValue.replace(/(\[\])/, "[" + count + "]");
          return newValue;
        });
        count++;
      });
      if (that.$(".repeatable-item").length <= 1) {
        that.$(".repeatable-item .repeatable-rem").addClass("invisible");
      } else {
        that.$(".repeatable-item .repeatable-rem").removeClass("invisible");
      }
    }
    var addItem = function (e) {
      e.preventDefault();
      var currentItem = $(e.currentTarget).parents(".repeatable-item");
      currentItem.after(itemTemplate());
      checkCount();
    }
    var removeItem = function (e) {
      e.preventDefault();
      if (that.$(".repeatable-item").length <= 1) return false;
      var item = $(e.currentTarget).parents(".repeatable-item");
      item.remove();
      checkCount();
    }
    if (that.$(".repeatable-item").length <= 0) {
      that.append(itemTemplate());
    }
    checkCount();
    that.on("click", ".repeatable-add", addItem);
    that.on("click", ".repeatable-rem", removeItem);
  });
}