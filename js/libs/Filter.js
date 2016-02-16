module('Filter', [], function() {
    var Filter = function(options) { this.init(options); };
    Filter.prototype = {
        _data: null,

        init: function(options) {
            this._event_element = options.event_element || document;
            this._filter_event = options.filter_event || 'FILTER_UPDATED';
            this._data = options.initial;
        },

        get: function(key) {
            if(!this._data) { return null; }
            return this._data[key];
        },

        remove: function(key, fire_event) {
            delete this._data[key];
            if(!(fire_event === false)) {
                $(this._event_element).trigger(this._filter_event);
            }
        },

        update: function(key, value, fire_event) {
            this._data[key] = value;

            if(!(fire_event === false)) {
                $(this._event_element).trigger(this._filter_event);
            }
        },
        reset: function() {
            this._data = {};
            $(this._event_element).trigger(this._filter_event);
        },
        to_dict: function() {
            return this._data;
        }
    };

    return Filter;
});