/* App JS */
// Libraries concatenated & compressed by by jekyll-assets pipeline
//= require jquery.js
//= require modernizr.js
//= require bootstrap.js
//= require underscore.js
//= require backbone.js
//= require backbone.layoutmanager.js
//= require tabletop.js
//= require backbone.tabletopSync.js
//= require isotope.pkgd.js
// Then the JST templates

window.App = {};

// Use the backbone.layoutmanager
// turn it on for all views by default
Backbone.Layout.configure({
    manage: true,
    // This method will check for prebuilt templates first and fall back to
    // loading in via AJAX.
    fetchTemplate: function(path) {
        // Check for a global JST object.  When you build your templates for
        // production, ensure they are all attached here.
        var JST = window.JST || {};

        // If the path exists in the object, use it instead of fetching remotely.
        if (JST[path]) {
            return JST[path];
        }

        // If it does not exist in the JST object, mark this function as
        // asynchronous.
        var done = this.async();

        // Fetch via jQuery's GET.  The third argument specifies the dataType.
        $.get('/ui/templates/' + path + '.jst.ejs', function(contents) {
            // Assuming you're using underscore templates, the compile step here is
            // `_.template`.
            done(_.template(contents));
        }, "text");
    }
});

// Using Tabletop
App.public_spreadsheet_url = 'https://docs.google.com/spreadsheets/d/1G36PR7bNNqDvc5VdKeAErphfi2zM1FxK_dvnJfZNy-0/pubhtml';
App.storage = Tabletop.init( { key: App.public_spreadsheet_url, wait: true } );

// Models

App.Calculator = Backbone.Model.extend({
    defaults: {
        // Just a reminder of what's in the model
        position_yes: 0,
        position_no: 0,
        position_count: 0,
        position_und: 0,
        position_dnr: 0,
        position_nc: 0,
        percent_yes: 0,
        percent_no: 0,
        percent_und: 0,
        percent_dnr: 0,
        percent_nc: 0
    },
    initialize: function(){
    },
    calculate: function(collection) { // Always pass a collection object
        this.set("position_yes", 0);
        this.set("position_no", 0);
        this.set("position_count", 0);
        this.set("position_und", 0);
        this.set("position_dnr", 0);
        this.set("position_nc", 0);
        this.set("percent_yes", 0);
        this.set("percent_no", 0);
        this.set("percent_und", 0);
        this.set("percent_dnr", 0);
        this.set("percent_nc", 0);
        var self = this;
        collection.each(function(m) {
            var count = self.get("position_count");
            var yes = self.get("position_yes");
            var no = self.get("position_no");
            var und = self.get("position_und");
            var dnr = self.get("position_dnr");
            var nc = self.get("position_nc");
            self.set("position_count", count + 1);
            var position = m.get("position");
            switch(position) {
                case "Yes":
                    self.set("position_yes", yes +1);
                break;
                case "No":
                    self.set("position_no", no +1);
                break;
                case "Undecided":
                    self.set("position_und", und +1);
                break;
                case "Did not respond":
                    self.set("position_dnr", dnr +1);
                break;
                case "No comment":
                    self.set("position_nc", nc +1);
                break;
            }
        });
        var count = self.get("position_count");
        var yes = self.get("position_yes");
        var no = self.get("position_no");
        var und = self.get("position_und");
        var dnr = self.get("position_dnr");
        var nc = self.get("position_nc");
        self.set("percent_yes", Math.round(yes / count * 100) );
        self.set("percent_no", Math.round(no / count * 100) );
        self.set("percent_und", Math.round(und / count * 100) );
        self.set("percent_dnr", Math.round(dnr / count * 100) );
        self.set("percent_nc", Math.round(nc / count * 100) );
    }
});

App.Councillor = Backbone.Model.extend({
    initialize: function(){
        var municipality =  this.get('municipality');
        var position =  this.get('position');
        this.set('municipalityId', this.slugify(municipality));
        this.set('positionId', this.slugify(position));
    },
    slugify: function(text)
    // Should move to a utility object
    {
        return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
    }
});

// Model: Quote
App.Quote = Backbone.Model.extend({
    defaults: {
    },
    initialize: function(){
    }
});

// Model: Location
App.Location = Backbone.Model.extend({
    defaults: {
    },
    initialize: function(){
    }
});
// Model: Chart
App.Chart = Backbone.Model.extend({
    defaults: {
    },
    initialize: function(){
    }
});

// Collections: Councillors, Quotes, Locations, Charts
App.CouncillorsCollection = Backbone.Collection.extend({
    model: App.Councillor,
    tabletop: {
        instance: App.storage,
        sheet: 'Councillors'
    },
    sync: Backbone.tabletopSync
});
App.councillors = new App.CouncillorsCollection();
App.councillors.comparator = 'lastname';

App.QuotesCollection = Backbone.Collection.extend({
    model: App.Quote,
    initialize: function() {
    }
});
App.quotes = new App.QuotesCollection();

App.LocationsCollection = Backbone.Collection.extend({
    model: App.Location,
    initialize: function() {
    }
});
App.locations = new App.LocationsCollection();
App.locations.comparator = 'municipality';

App.ChartCollection = Backbone.Collection.extend({
    model: App.Chart,
    initialize: function() {
    }
});

// Views
// View: QuotesList
App.QuotesListView = Backbone.View.extend({
    //el: false,
    collection: App.quotes,
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "reset", this.render);
    },
    template: "quotes",
    serialize: function() {
    },
    events: {
    },
    beforeRender: function() {
        // This is kinda' silly, but only one quote is needed for now
        var shuffled = this.collection.shuffle();
        var quote    = shuffled.pop(1);
        if (quote) {
            this.setView("#quotes-list", new App.QuotesListItemView({
                model: quote
            }));
        }
    },
    afterRender: function() {
    },
});
// View: QuoteListItem
App.QuotesListItemView = Backbone.View.extend({
    //el: false,
    initialize: function(options) {
    },
    template: "quotes-list-item"
});

// View: LocationList
App.LocationsListView = Backbone.View.extend({
    //el: false,
    collection: App.locations,
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync reset", this.render);
    },
    template: "locations-list",
    serialize: function() {
    },
    events: {
        'change select#locations-list': "filterList"
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(location) {
            this.insertView("#locations-list", new App.LocationsListItemView({
                model: location
            }));
        }, this);
    },
    afterRender: function() {
    },
    filterList: function(e) {
        var elem = e.currentTarget;
        var selection = $( "select#locations-list option:selected" ).text();
        if ( elem.nodeName === 'SELECT') {
            var filterClass;
            if ( $( elem ).val() === '*' ) {
                filterClass = '*';
                // Reset the stats
                App.stats.calculate(App.councillors);
            } else {
                filterClass = '.' + $( elem ).val();
                // Filter the stats
                App.filteredCouncillors = new App.CouncillorsCollection();
                var municipality = App.councillors.where({municipality: selection });
                App.filteredCouncillors.reset(municipality);
                App.stats.calculate(App.filteredCouncillors);
            }
            // Filter the gallery
            App.container.isotope({filter: filterClass });
        }
    }
});
// View: LocationListItem
App.LocationsListItemView = Backbone.View.extend({
    el: false,
    initialize: function(options) {
    },
    events: {
    },
    template: "locations-list-item"
});


// View: CouncillorsList
App.CouncillorsListView = Backbone.View.extend({
    //el: false,
    collection: App.councillors,
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.collection, "add remove sync reset", this.render);
    },
    template: "councillors-list",
    serialize: function() {
    },
    events: {
        "click .councillor": "viewCouncillor"
    },
    beforeRender: function() {
        // Add the subviews to the view
        this.collection.each(function(councillor) {
            this.insertView("#councillors-list", new App.CouncillorsListItemView({
                model: councillor
            }));
            this.insertView("#councillors-list-mobile", new App.CouncillorsListItemViewMobile({
                model: councillor
            }));
        }, this);
    },
    afterRender: function() {
        App.container = $('.isotope-list');
        App.container.isotope({
            itemSelector: '.councillor',
            layoutMode: 'fitRows'
        });
    },
    viewCouncillor: function(e) {
        var councillorId = $( e.currentTarget ).attr('data-id');
        var councillor = App.councillors.findWhere({id: councillorId });
        var view = App.Layout.setView("#detail", new App.CouncillorDetailView({
            model: councillor
        }));
        view.render();
    }
});

// View: CouncillorsListItem
App.CouncillorsListItemView = Backbone.View.extend({
    //el: false,
    initialize: function(options) {
    },
    template: "councillors-list-item"
});
// View: CouncillorsListItemMobile
App.CouncillorsListItemViewMobile = Backbone.View.extend({
    //el: false,
    initialize: function(options) {
    },
    template: "councillors-list-item-mobile"
});

App.CouncillorDetailView = Backbone.View.extend({
    initialize: function(options) {
    },
    template: "councillor-detail",
    afterRender: function() {
         $('#modalDetail').modal();
    }
});


// View: ChartListItem
App.stats = new App.Calculator();
App.PositionScoreboardView = Backbone.View.extend({
    model: App.stats,
    initialize: function(options) {
        // Listen to events on the collection
        this.listenTo(this.model, "change", this.render);
    },
    template: "position-scoreboard",
    events: {
        "click .positionId": "filterList"
    },
    beforeRender: function() {
    },
    afterRender: function() {
    },
    filterList: function(e) {
        var positionId = $( e.currentTarget ).attr("data-position");
            var filterClass = '.' + positionId;
            // Filter the stats
            App.container.isotope({filter: filterClass });
            // Reset the region select
            $('#locations-list').find('option:first').attr('selected', 'selected');
            // Reset the stats
            App.stats.calculate(App.councillors);
            
        }
});

// Loader
App.LoaderView = Backbone.View.extend({
    initialize: function(options) {
    },
    template: "loader"
});
// ===================================================================
// Layouts
// ===================================================================
App.Layout = new Backbone.Layout({
    // Attach the Layout to the main container.
    el: "body",
    views: {
        //"header": new App.HeaderView(),
        //"footer": new App.FooterView()
        //"#loader": new App.LoaderView()
        //"#quotes": new App.QuotesListView(),
        //"#locations": new App.LocationsListView(),
        //"#councillors": new App.CouncillorsListView(),
        //"#scoreboard": new App.PositionScoreboardView(),
    },
    afterRender: function() {
        $("#loader").remove();
    }
});

$(document).ready( function() {
    // Get the data, re-render the layout
    App.councillors.fetch({ success: function(councillors) { 
        var quotes_only = App.councillors.reject(function(c){ return c.get("quote") === ''; });
        var quotes = quotes_only.map(function(c){ 
            return { "text": c.get("quote"), "id": c.get("id"), "fullname": c.get("fullname") };
        });
        App.quotes.reset(quotes_only);
        var cities = App.councillors.each(function(c){
            if (!App.locations.findWhere({ "municipalityId": c.get("municipalityId") })) {
                App.locations.add({ "municipality": c.get("municipality"), "municipalityId": c.get("municipalityId") });
            }
        });
        //App.calculator = new App.Calculator();
        //App.calculator.calculate(councillors);
        App.stats.calculate(councillors);
        // Render the whole enchillada
        App.Layout.insertView("#quotes", new App.QuotesListView());
        App.Layout.insertView("#locations", new App.LocationsListView());
        App.Layout.insertView("#councillors", new App.CouncillorsListView());
        App.Layout.insertView("#scoreboard", new App.PositionScoreboardView());
        App.Layout.render();
    } });
});
