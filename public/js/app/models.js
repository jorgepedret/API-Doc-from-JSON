//////////////////////
// Mediator
//////////////////////
app.Mediator = Backbone.Model.extend();
app.mediator = new app.Mediator;
app.View = Backbone.View.extend({ mediator: app.mediator });