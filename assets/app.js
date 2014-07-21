console.info("jQuery version: " + jQuery.fn.jquery);
console.info("Lodash version: " + _.VERSION);
console.info("Backbone version: " + Backbone.VERSION);
console.info("Velocity version: " + $.Velocity.version['major'] + "." + $.Velocity.version['minor'] + "." +$.Velocity.version['patch']);

if (window.Sparkle == null) {
  window.Sparkle = {};
}

_.extend(Sparkle, {
  Models: {},
  Collections: {},
  Views: {},
  Routers: {}
});

$(function () {
  Sparkle.mapApp = new Sparkle.Routers.Map
});

;(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Models.Location = (function(_super) {
    __extends(Location, _super);

    function Location() {
      return Location.__super__.constructor.apply(this, arguments);
    }

    Location.prototype.withinDistance = function() {
      if (this.childrenWithinDistance()) {
        return true;
      } else if (this.addressesWithinDistance().length >= 1) {
        return true;
      } else {
        return false;
      }
    };

    Location.prototype.childrenWithinDistance = function() {
      var childNearby, location, location_id, _i, _len, _ref;
      if (this.hasChildren() && this.collection) {
        childNearby = false;
        _ref = this.get('descendant_ids');
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          location_id = _ref[_i];
          if (!(childNearby === false)) {
            continue;
          }
          location = this.collection.get(location_id);
          childNearby = (location != null ? location.addressesWithinDistance().length : void 0) >= 1;
        }
        return childNearby;
      } else {
        return false;
      }
    };

    Location.prototype.directChildren = function() {
      return this.cachedChildren != null ? this.cachedChildren : this.cachedChildren = new Sparkle.Collections.Locations(this.collection.where({
        parent_id: this.id
      }));
    };

    Location.prototype.childrenFinder = function() {
      if (this.collection == null) {
        return [];
      }
      return this.collection.filter((function(_this) {
        return function(location) {
          return location.get('parent_id') === _this.id;
        };
      })(this));
    };

    Location.prototype.isRoot = function() {
      return this.get('parent_id') == null;
    };

    Location.prototype.parent = function() {
      if (this.isRoot()) {
        return null;
      }
      return this.collection.findWhere({
        id: this.get('parent_id')
      });
    };

    Location.prototype.hasChildren = function() {
      return this.get('descendant_ids').length > 0;
    };

    Location.prototype.addressesWithinDistance = function() {
      var latLng, meters, _ref, _ref1;
      if (((_ref = this.collection.searchParams) != null ? _ref['location'] : void 0) && ((_ref1 = this.collection.searchParams) != null ? _ref1['distance'] : void 0)) {
        latLng = this.collection.searchParams['location'];
        meters = this.collection.searchParams['distance'] * 1609.34;
        return _.filter(this.get('addresses'), function(address) {
          var locationLatLng;
          locationLatLng = new google.maps.LatLng(address['lat'], address['lng']);
          return google.maps.geometry.spherical.computeDistanceBetween(locationLatLng, latLng) < meters;
        });
      } else {
        return this.get('addresses');
      }
    };

    return Location;

  })(Backbone.Model);

}).call(this);

;(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Collections.Locations = (function(_super) {
    __extends(Locations, _super);

    function Locations() {
      this.roots = __bind(this.roots, this);
      this.changeToParent = __bind(this.changeToParent, this);
      this.changeParent = __bind(this.changeParent, this);
      this.clearScope = __bind(this.clearScope, this);
      this.clearSearch = __bind(this.clearSearch, this);
      this.search = __bind(this.search, this);
      this.initialize = __bind(this.initialize, this);
      return Locations.__super__.constructor.apply(this, arguments);
    }

    Locations.prototype.model = Sparkle.Models.Location;

    Locations.prototype.url = '/locations.json';

    Locations.prototype.initialize = function(options) {
      this.currentParent = options != null ? options['parent'] : void 0;
      this.on('search', this.search);
      this.on('reset', this.clearScope);
      this.on('selectLocation', this.changeParent);
      this.on('unselectLocation', this.changeToParent);
      return this.on('clearSearch', this.clearSearch);
    };

    Locations.prototype.search = function(params) {
      this.searchParams = params;
      this.searchScope = this.filter(function(location) {
        if (location.withinDistance()) {
          location.trigger('insideScope');
          return true;
        } else {
          location.trigger('outsideScope');
          return false;
        }
      });
      if (this.searchScope.length > 0) {
        return this.trigger('changeScope');
      } else {
        delete this.searchParams;
        delete this.searchScope;
        return this.trigger('noResults');
      }
    };

    Locations.prototype.clearSearch = function() {
      if (!_.isEmpty(this.searchScope)) {
        delete this.searchParams;
        delete this.searchScope;
        return this.trigger('changeScope');
      }
    };

    Locations.prototype.clearScope = function() {
      if (this.currentScope) {
        delete this.currentScope;
        return this.trigger('changeScope');
      }
    };

    Locations.prototype.changeParent = function(model) {
      this.currentParent = model;
      return this.clearScope();
    };

    Locations.prototype.changeToParent = function(model) {
      this.currentParent = model.parent();
      return this.clearScope();
    };

    Locations.prototype.scopedLocations = function() {
      if (this.currentScope == null) {
        this.currentScope = this.getScope();
      }
      if (this.searchScope) {
        return _.intersection(this.currentScope, this.searchScope);
      } else {
        return this.currentScope;
      }
    };

    Locations.prototype.scopedLocationsWithAddresses = function() {
      var locations, _ref;
      locations = _.filter(this.scopedLocations(), function(location) {
        if ((location != null) && location.get('addresses').length >= 1) {
          return true;
        }
      });
      if (((_ref = this.currentParent) != null ? _ref.get('addresses').length : void 0) >= 1) {
        locations.push(this.currentParent);
      }
      return locations;
    };

    Locations.prototype.getScope = function() {
      var locations;
      if (this.currentParent) {
        return locations = _.map(this.currentParent.get('descendant_ids'), (function(_this) {
          return function(id) {
            return _this.get(id);
          };
        })(this));
      } else {
        return this.models;
      }
    };

    Locations.prototype.roots = function() {
      return new Sparkle.Collections.Locations(this.filter(function(location) {
        return location.get('parent_id') == null;
      }));
    };

    return Locations;

  })(Backbone.Collection);

}).call(this);

;Sparkle.Views.LocationBrowser = Backbone.View.extend({
  el: '#location-browser',
  events: {
  },

  initialize: function () {
  },

  render: function () {
  }
});

;(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Views.NavUL = (function(_super) {
    __extends(NavUL, _super);

    function NavUL() {
      this.listItems = __bind(this.listItems, this);
      return NavUL.__super__.constructor.apply(this, arguments);
    }

    NavUL.prototype.listItems = function() {
      return this.locationsToRender().map(function(location) {
        var options;
        options = {
          model: location,
          collection: this.collection,
          className: "" + Sparkle.Views.NavListItem.prototype.className
        };
        if (location.hasChildren()) {
          options['className'] += " parent";
          if (location.isRoot()) {
            return new Sparkle.Views.NavRootNode(options);
          } else {
            return new Sparkle.Views.NavNode(options);
          }
        } else {
          return new Sparkle.Views.NavLeaf(options);
        }
      });
    };

    return NavUL;

  })(Backbone.View);

  Sparkle.Views.LocationNav = (function(_super) {
    __extends(LocationNav, _super);

    function LocationNav() {
      this.render = __bind(this.render, this);
      return LocationNav.__super__.constructor.apply(this, arguments);
    }

    LocationNav.prototype.el = '.lb-nav';

    LocationNav.prototype.initialize = function() {
      this.listenTo(this.collection, "reset", this.render);
      this.allLocationsLi = new Sparkle.Views.AllLocationsListItem;
      return this.locationsToRender = this.collection.roots;
    };

    LocationNav.prototype.render = function() {
      var listItemEls;
      listItemEls = _.map(this.listItems(), function(li) {
        return li.render().el;
      });
      listItemEls.unshift(this.allLocationsLi.render().el);
      this.$el.append(listItemEls);
      return this;
    };

    return LocationNav;

  })(Sparkle.Views.NavUL);

  Sparkle.Views.ChildLocationList = (function(_super) {
    __extends(ChildLocationList, _super);

    function ChildLocationList() {
      return ChildLocationList.__super__.constructor.apply(this, arguments);
    }

    ChildLocationList.prototype.tagName = 'ul';

    ChildLocationList.prototype.className = 'lb-child-nav';

    ChildLocationList.prototype.initialize = function() {
      return this.locationsToRender = function() {
        return this.collection;
      };
    };

    ChildLocationList.prototype.render = function() {
      var listItemEls;
      listItemEls = _.map(this.listItems(), function(li) {
        return li.render().el;
      });
      this.$el.append(listItemEls);
      return this;
    };

    return ChildLocationList;

  })(Sparkle.Views.NavUL);

}).call(this);

;(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Views.LocationSearch = (function(_super) {
    __extends(LocationSearch, _super);

    function LocationSearch() {
      this.search = __bind(this.search, this);
      return LocationSearch.__super__.constructor.apply(this, arguments);
    }

    LocationSearch.prototype.el = '.lb-search';

    LocationSearch.prototype.events = {
      'submit': 'catchSubmit',
      'click .lb-clear-search': 'resetSearch'
    };

    LocationSearch.prototype.initialize = function() {
      Sparkle.GoogleMaps.addAutoCompleteToField(this.$el.find('.lb-location-input input')[0], this);
      Sparkle.GoogleMaps.onMapsLoaded((function(_this) {
        return function() {
          return google.maps.event.addListener(_this.autocomplete, 'place_changed', _this.search);
        };
      })(this));
      return this.listenTo(this.collection, 'clearSearch', this.clearFields);
    };

    LocationSearch.prototype.params = function() {
      var _ref, _ref1, _ref2;
      return {
        'location': (_ref = (_ref1 = this.autocomplete.getPlace()) != null ? (_ref2 = _ref1.geometry) != null ? _ref2.location : void 0 : void 0) != null ? _ref : this.$el.find('.location input').val(),
        'distance': 5
      };
    };

    LocationSearch.prototype.search = function() {
      return this.collection.trigger('search', this.params());
    };

    LocationSearch.prototype.catchSubmit = function(event) {
      return event.preventDefault();
    };

    LocationSearch.prototype.resetSearch = function(event) {
      event.preventDefault();
      return this.collection.trigger('clearSearch');
    };

    LocationSearch.prototype.clearFields = function() {
      return this.$el.find('input[name="location"]').val('');
    };

    return LocationSearch;

  })(Backbone.View);

  Sparkle.Views.LocationNoResults = (function(_super) {
    __extends(LocationNoResults, _super);

    function LocationNoResults() {
      this.resetSearch = __bind(this.resetSearch, this);
      return LocationNoResults.__super__.constructor.apply(this, arguments);
    }

    LocationNoResults.prototype.className = 'no-results';

    LocationNoResults.prototype.events = {
      'click button': 'resetSearch'
    };

    LocationNoResults.prototype.initialize = function() {
      this.template = _.template($('#no_location_results_template').html());
      this.listenTo(this.collection, 'search', this.removeView);
      return this.listenTo(this.collection, 'clearSearch', this.removeView);
    };

    LocationNoResults.prototype.removeView = function() {
      this.remove();
      return delete this;
    };

    LocationNoResults.prototype.render = function() {
      this.$el.html(this.template());
      return this;
    };

    LocationNoResults.prototype.resetSearch = function() {
      return this.collection.trigger('clearSearch');
    };

    return LocationNoResults;

  })(Backbone.View);

}).call(this);

;(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Views.MapCanvas = (function(_super) {
    __extends(MapCanvas, _super);

    function MapCanvas() {
      this.resetAndCenter = __bind(this.resetAndCenter, this);
      this.initializeMap = __bind(this.initializeMap, this);
      return MapCanvas.__super__.constructor.apply(this, arguments);
    }

    MapCanvas.prototype.el = '#lb-map';

    MapCanvas.prototype.initialize = function() {
      return $(document).one('mapsLoaded', this.initializeMap);
    };

    MapCanvas.prototype.initializeMap = function() {
      var mapOptions;
      mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(32.7153, -117.1564),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        scrollwheel: false,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          style: google.maps.ZoomControlStyle.SMALL,
          position: google.maps.ControlPosition.RIGHT_BOTTOM
        }
      };
      this.mapObject = new google.maps.Map(this.el, mapOptions);
      this.bounds = new google.maps.LatLngBounds();
      this.markers = {};
      this.listenTo(this.collection, 'reset changeScope', this.resetAndCenter);
      this.listenTo(this.collection, 'selectLocation', this.focusMarker);
      return this.resetMarkers();
    };

    MapCanvas.prototype.resetAndCenter = function() {
      return this.resetMarkers();
    };

    MapCanvas.prototype.resetMarkers = function(center) {
      if (center == null) {
        center = null;
      }
      this.deleteMarkers();
      this.bounds = new google.maps.LatLngBounds();
      this.createMarkers(this.collection.scopedLocationsWithAddresses());
      return this.setZoom();
    };

    MapCanvas.prototype.deleteMarkers = function() {
      this.clearMarkers();
      return this.markers = {};
    };

    MapCanvas.prototype.clearMarkers = function() {
      var marker, _i, _len, _ref, _results;
      _ref = _.values(this.markers);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        marker = _ref[_i];
        _results.push(marker.setMap(null));
      }
      return _results;
    };

    MapCanvas.prototype.setZoom = function() {
      this.mapObject.fitBounds(this.bounds);
      if (_.size(this.markers) === 1) {
        return this.mapObject.setZoom(18);
      }
    };

    MapCanvas.prototype.createMarkers = function(locations) {
      var address, latLng, location, marker, _i, _j, _len, _len1, _ref;
      for (_i = 0, _len = locations.length; _i < _len; _i++) {
        location = locations[_i];
        _ref = location.addressesWithinDistance();
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          address = _ref[_j];
          if (!(address['lat'] && address['lng'])) {
            return false;
          }
          latLng = new google.maps.LatLng(address['lat'], address['lng']);
          marker = new google.maps.Marker({
            position: latLng,
            map: this.mapObject,
            title: location.get('name')
          });
          this.markers[address['id']] = marker;
          this.createInfoWindow(location, address, marker);
          this.bounds.extend(latLng);
        }
      }
    };

    MapCanvas.prototype.createInfoWindow = function(location, address, marker) {
      var content, infoWindow;
      content = "<div class='iw-content'> <div class='iw-heading'> <a href='" + (location.get('url')) + "'>" + (location.get('name')) + "</a> </div> <div class='iw-address'> " + address['address'] + "<br> " + address['city'] + ", " + address['state'] + " </div> <a href='http://maps.google.com/?q=" + address['address'] + "+" + address['city'] + "+" + address['state'] + "'> View in Google Maps </a> </div>";
      infoWindow = new google.maps.InfoWindow({
        content: content
      });
      return google.maps.event.addListener(marker, 'click', (function(_this) {
        return function() {
          var _ref;
          if (infoWindow !== _this.infoWindow) {
            location.trigger('selected');
            if ((_ref = _this.infoWindow) != null) {
              _ref.close();
            }
            _this.infoWindow = infoWindow;
            return _this.infoWindow.open(_this.mapObject, marker);
          }
        };
      })(this));
    };

    MapCanvas.prototype.focusMarker = function(location) {
      var currentMarker, firstAddress;
      firstAddress = _.first(location.get('addresses'));
      if (firstAddress != null) {
        currentMarker = this.markers[firstAddress['id']];
        return google.maps.event.trigger(currentMarker, 'click');
      }
    };

    MapCanvas.prototype.render = function() {
      return this;
    };

    MapCanvas.prototype.resize = function() {
      return google.maps.event.trigger(this.mapObject, 'resize');
    };

    MapCanvas.prototype.redraw = function() {
      this.resize();
      return this.deleteMarkers();
    };

    return MapCanvas;

  })(Backbone.View);

}).call(this);

;(function() {
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Views.AllLocationsListItem = (function(_super) {
    __extends(AllLocationsListItem, _super);

    function AllLocationsListItem() {
      return AllLocationsListItem.__super__.constructor.apply(this, arguments);
    }

    AllLocationsListItem.prototype.tagName = 'li';

    AllLocationsListItem.prototype.className = 'lb-nav-all';

    AllLocationsListItem.prototype.render = function() {
      this.$el.text('All Locations');
      return this;
    };

    return AllLocationsListItem;

  })(Backbone.View);

  Sparkle.Views.NavListItem = (function(_super) {
    __extends(NavListItem, _super);

    function NavListItem() {
      return NavListItem.__super__.constructor.apply(this, arguments);
    }

    NavListItem.prototype.tagName = 'li';

    NavListItem.prototype.className = 'lb-nav-location';

    NavListItem.prototype.events = {
      'click a': 'selectLocation'
    };

    NavListItem.prototype.selectedEvents = {
      'click a': 'unselectLocation'
    };

    NavListItem.prototype.initialize = function() {
      this.listenTo(this.model, 'selectLocation', this.selected);
      return this.listenTo(this.model, 'unselectLocation', this.unselected);
    };

    NavListItem.prototype.render = function() {
      var template;
      template = _.template($('#location-anchor-tag').html());
      this.$el.html(template(this.model.attributes));
      return this;
    };

    NavListItem.prototype.selectLocation = function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return this.model.trigger('selectLocation', this.model);
    };

    NavListItem.prototype.unselectLocation = function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return this.model.trigger('unselectLocation', this.model);
    };

    return NavListItem;

  })(Backbone.View);

  Sparkle.Views.NavLeaf = (function(_super) {
    __extends(NavLeaf, _super);

    function NavLeaf() {
      return NavLeaf.__super__.constructor.apply(this, arguments);
    }

    return NavLeaf;

  })(Sparkle.Views.NavListItem);

  Sparkle.Views.NavNode = (function(_super) {
    __extends(NavNode, _super);

    function NavNode() {
      return NavNode.__super__.constructor.apply(this, arguments);
    }

    NavNode.prototype.selected = function() {
      this.delegateEvents(this.selectedEvents);
      this.renderChildList();
      return this.animateSelected();
    };

    NavNode.prototype.unselected = function() {
      this.delegateEvents(this.events);
      this.removeChildList();
      return this.animateUnselected();
    };

    NavNode.prototype.renderChildList = function() {
      this.childList = new Sparkle.Views.ChildLocationList({
        collection: this.model.directChildren()
      });
      this.childList.render().$el.hide();
      this.$el.append(this.childList.el);
      return this.childList.$el.velocity('transition.slideDownIn', {
        delay: 200,
        duration: 200
      });
    };

    NavNode.prototype.removeChildList = function() {
      return this.childList.$el.velocity('reverse', {
        'complete': (function(_this) {
          return function() {
            return _this.childList.remove();
          };
        })(this)
      });
    };

    NavNode.prototype.hideElementCSS = {
      'height': 0,
      'padding-top': 0,
      'padding-bottom': 0,
      'opacity': 0
    };

    NavNode.prototype.animateSelected = function() {
      return this.$el.addClass('selected').parent().siblings('a').velocity(this.hideElementCSS, {
        visibility: 'hidden'
      }).end().end().prevAll().velocity(this.hideElementCSS, {
        visibility: 'hidden'
      }).end().nextAll().velocity(this.hideElementCSS, {
        visibility: 'hidden'
      }).end();
    };

    NavNode.prototype.animateUnselected = function() {
      return this.$el.removeClass('selected').parent().siblings('a').velocity('reverse').end().end().prevAll().velocity('reverse').end().nextAll().velocity('reverse').end();
    };

    return NavNode;

  })(Sparkle.Views.NavListItem);

  Sparkle.Views.NavRootNode = (function(_super) {
    __extends(NavRootNode, _super);

    function NavRootNode() {
      return NavRootNode.__super__.constructor.apply(this, arguments);
    }

    NavRootNode.prototype.animateSelected = function() {
      return this.$el.addClass('selected').prevAll().velocity(this.hideElementCSS, {
        visibility: 'hidden'
      }).end().nextAll().velocity(this.hideElementCSS, {
        visibility: 'hidden'
      }).end();
    };

    NavRootNode.prototype.animateUnselected = function() {
      return this.$el.removeClass('selected').prevAll().velocity('reverse').end().nextAll().velocity('reverse').end();
    };

    return NavRootNode;

  })(Sparkle.Views.NavNode);

}).call(this);

;(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Sparkle.Routers.Map = (function(_super) {
    __extends(Map, _super);

    function Map() {
      this.noResults = __bind(this.noResults, this);
      return Map.__super__.constructor.apply(this, arguments);
    }

    Map.prototype.initialize = function() {
      this.$container = $('#location-browser');
      if (this.$container[0] == null) {
        return false;
      }
      Sparkle.GoogleMaps.Loader();
      this.initializeCollections();
      return this.setupViews();
    };

    Map.prototype.initializeCollections = function() {
      this.locations = new Sparkle.Collections.Locations;
      this.locations.fetch({
        reset: true
      });
      return this.locations.on('noResults', this.noResults);
    };

    Map.prototype.setupViews = function() {
      this.searchPanel = new Sparkle.Views.LocationSearch({
        collection: this.locations
      });
      this.locationSelector = new Sparkle.Views.LocationNav({
        collection: this.locations
      });
      return this.mapView = new Sparkle.Views.MapCanvas({
        collection: this.locations
      });
    };

    Map.prototype.noResults = function() {
      this.noResults = new Sparkle.Views.LocationNoResults({
        collection: this.locations
      });
      return this.$container.append(this.noResults.render().el);
    };

    return Map;

  })(Backbone.Router);

}).call(this);

;(function() {
  if (window.Sparkle == null) {
    window.Sparkle = {};
  }

  Sparkle.GoogleMaps = (function() {
    function GoogleMaps() {}

    GoogleMaps.Loader = function() {
      var _ref;
      if (((_ref = window.google) != null ? _ref.maps : void 0) != null) {
        return $(document).trigger('mapsLoaded');
      } else {
        _.extend(Sparkle, {
          mapsLoaded: function() {
            $(document).trigger('mapsLoaded');
            return delete Sparkle['mapsLoaded'];
          }
        });
        return this.loadMapScript('Sparkle.mapsLoaded');
      }
    };

    GoogleMaps.loadMapScript = function(callback) {
      var script;
      script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "http://maps.googleapis.com/maps/api/js?libraries=places,geometry&sensor=false&callback=" + callback;
      return document.body.appendChild(script);
    };

    GoogleMaps.onMapsLoaded = function(fn) {
      var _ref;
      if (((_ref = window.google) != null ? _ref.maps : void 0) != null) {
        return fn();
      } else {
        return $(document).one('mapsLoaded', fn);
      }
    };

    GoogleMaps.addAutoCompleteToField = function(input, parent) {
      this.initAutoComplete = (function(_this) {
        return function() {
          var bounds, options;
          if (parent.autocomplete) {
            return false;
          }
          bounds = new google.maps.LatLngBounds;
          bounds.extend(new google.maps.LatLng(33.505025, -116.08094));
          bounds.extend(new google.maps.LatLng(32.528832, -117.611081));
          options = {
            types: ['geocode'],
            componentRestrictions: {
              country: 'us'
            },
            bounds: bounds
          };
          parent.autocomplete = new google.maps.places.Autocomplete(input, options);
          return delete _this['initAutoComplete'];
        };
      })(this);
      return Sparkle.GoogleMaps.onMapsLoaded(this.initAutoComplete);
    };

    return GoogleMaps;

  })();

}).call(this);
