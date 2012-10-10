var md = require("node-markdown").Markdown;

module.exports = {
  helpers: {
    title: "APIme",
    active: "",
    preview: false,
    md: function (mdString) {
      mdString = mdString.replace(/\n/g, '<br />');
      return md(mdString, true, "h1|h2|h3|h4|h5|h6|br|a|small|strong");
    },
    getURL: function (url, preview) {
      if (preview === true) {
        url += "?preview=true";
      }
      return url;
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
    },
    isLoggedIn: function (req, rsp) {
      return !!req.profile;
    }
  }
}