var md = require("node-markdown").Markdown;

module.exports = {
  helpers: {
    title: "APIme",
    md: function (mdString) {
      mdString = mdString.replace(/\n/g, '<br />');
      return md(mdString, true, "br|a|small|strong");
    }
  },
  dynamicHelpers: {
    flashMessages: function (req, rsp) {
      var html = '';
      ['error', 'info', 'success'].forEach(function (type) {
        var messages = req.flash(type);
        if (messages.length > 0) {
          html += '<div class="alert alert-' + type + '">' + messages.join(', ') + '</div>';
        }
      });
      return html;
    }
  }
}