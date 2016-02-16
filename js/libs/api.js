module('api', ['http'], function(http) {

    var DummyDataProvider = function() {};

    DummyDataProvider.prototype = {
        _dummy_data: {
            'users': [{
                'key': 'fdslkjafdlkjsafjerqiu',
                'first_name': 'Test',
                'last_name': 'User'
            }]
        },
        
        getData: function(path) {
            if (this._dummy_data[path]) {
                return this._dummy_data[path];
            } else {
                return null;
            }
        }
    };
    
    var dp = new DummyDataProvider();
    
    var JsonSerializer = function(data) { this._init(data); };
    JsonSerializer.prototype = {
        data: null,

        _init: function(data) {
            var self = this;

            if (data instanceof Array) {
                var result = [];

                data.each(function(r){
                    result.push(r);
                });
            } else {
                var result = data;
            }

            return self.data = result;
        }
    };

    var api = function() {};

    api.prototype = {
        _build_url: function(path) {
            if (!path.endsWith('/')) {
                path += '/';
            }
            return '/api/' + path;// + '?format=json';
        },

        _handle_error: function(data) {
            //$.colorbox({html:"<h1>"+data+"</h1>"});

            return data;
        },

        _handle_response: function(response) {
            try {
                var _r = JSON.parse(response);
            } catch (e) {
                return response;
            }

            if (_r.detail) {
                return this._handle_error(_r.detail);
            }

            return new JsonSerializer(_r).data;
        },

        call: function(path, object) {
            return this.list(path, object);
        },

        retrieve: function(path, object) {
            var self = this;

            return new Promise(function(resolve, reject) {
                var _url = self._build_url(path);
                if(object instanceof Array) {
                    _url += object.join('/') + '/';
                }

                http.get(_url).then(function(response) {
                    resolve(self._handle_response(response));
                });
            });
        },

        list: function(path, object) {
            var self = this;

            return new Promise(function(resolve, reject) {
                http.get(self._build_url(path), object).then(function(response) {
                    resolve(self._handle_response(response));
                }, function(error) {
                    //if (settings.api_dummy_data_fallback === true) {
                    if (true) {
                        var dummy_data = dp.getData(path);
                        if (dummy_data) {
                            console.log('Falling back to dummy data for call ['+path+']');
                            resolve(self._handle_response(dummy_data));
                        } else {
                            console.log('Dummy data for call ['+path+'] not available.');
                            reject(self._handle_error(error));
                        }
                    }
                });
            });
        },

        create: function(path, object) {
            var self = this;

            return new Promise(function(resolve, reject) {
                var _url = self._build_url(path);

                http.post(_url, object).then(function(response) {
                    resolve(self._handle_response(response));
                }, function(error_data) {
                    reject(error_data);
                });
            });
        },

        delete: function(path, object) {
            var self = this;

            return new Promise(function(resolve, reject) {
                http.delete(self._build_url(path), object).then(function(response) {
                    resolve(self._handle_response(response));
                }, function(error_data) {
                    reject(self._handle_error(error_data));
                });
            });
        }
    };

    return new api();
});
