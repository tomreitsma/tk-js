var Promise, model, module, require, app;(function(scope){
    var global = scope;

    var TK_EXTERNAL_REQUIREMENTS = {
        jQuery: '//code.jquery.com/jquery-1.11.1.min.js',
        THREE: 'js/libs/ext/three.min.js',
        Promise: 'js/libs/ext/promise-1.0.0.js'
    };

    /**
     * Function for exposing parameters to the given scope
     * @param methods
     * @param name
     */

    function expose(methods, name) {
        if(!(Object.prototype.toString.call(methods) === '[object Array]')) {
            methods = [methods];
        }

        for(var i=0; i<methods.length; i++) {
            var method = methods[i],
                ret = method.toString().substr('function '.length),
                _name = ret.substr(0, ret.indexOf('('));
            if (_name.length == 0) { _name = name }

            global[_name] = method;
        }
    }

    /**
     * Generic String prototype helper methods
     */

    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str){
            return this.indexOf(str) == 0;
        };
    }

    if (typeof String.prototype.endsWith != 'function') {
        String.prototype.endsWith = function(suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    if (typeof String.prototype.contains != 'function') {
        String.prototype.contains = function(str) {
            return this.indexOf(str) !== -1;
        };
    }

    if (typeof String.prototype.splitGet != 'function') {
        String.prototype.splitGet = function(str, i) {
            return this.split(str)[i];
        }
    }

    /**
     * Generic Array prototype helper methods
     */

    if(typeof Array.prototype.contains != 'function') {
        Array.prototype.contains = function(src) {
            return this.indexOf(src) > -1;
        }
    }

    if(typeof Array.prototype.each != 'function') {
        Array.prototype.each = function(func) {
            for (var i = 0; i < this.length; i += 1) {
                if (this[i] && func(this[i], i, this)) { break; }
            }
        }
    }

    /**
     * Generic object prototype extensions
     */

    /*if(typeof Object.prototype.extend != 'function') {
        Object.prototype.extend = function(obj) {
            $.each(obj, function(key, value) {
                console.dir({key: key, value: value});
            });
        }
    }*/

    /**
     * @name Model
     * @description Basic data model functionality
     */
    var Model = function(initial) {
        this.__init__(initial);
    };

    Model.prototype = {
        __definition__: {},

        __init__: function(_in) {
            var key;
            for(key in this.__definition__) {
                if(!this.__definition__.hasOwnProperty(key)) {
                    continue;
                }

                if(!key.startsWith('_')) {
                    this[key] = this.__definition__[key];
                }
            }

            /**
             * Possible validation here
             *
             * This overwrites any properties that were already there
             * Need to figure out a clean solution of properties on model instances
             */

            for(key in _in) {
                if(!_in.hasOwnProperty(key)) {
                    continue;
                }

                this[key] = _in[key];
            }

            this.api = tk._registry.retrieve(tk.parseName('api')).initialize();
        },

        save: function() {
            var self = this;
            return new Promise(function(resolve, reject) {
                if($.isFunction(self.pre_save)) {
                    self.pre_save(reject);
                }

                if(!self._pk) {
                    //self.api.create(self);
                } else {
                    //self.api.update(self);
                }

                if($.isFunction(self.post_save)) {
                    self.post_save(resolve);
                }
            });
        }
    };

    Model.extend = function(obj) {
        var key;

        var ConstructedModel = function(initial) {
            this.__init__(initial);
        };

        ConstructedModel.objects = {
            __api_path__: obj.__api__,
            api: tk._registry.retrieve(tk.parseName('api')).initialize(),

            all: function(opts) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    self.api.list(self.__api_path__, opts).then(function(objs) {
                        var res = [];
                        $.each(objs, function() {
                            res.push(new ConstructedModel(this));
                        });
                        resolve(res);
                    }, function(e) {
                        reject(e);
                    });
                });
            },

            get: function(opts) {
                var self = this;
                return new Promise(function(resolve, reject) {
                    self.api.retrieve(self.__api_path__, opts).then(function(object) {
                        resolve(new ConstructedModel(object));
                    }, function(e) {
                        reject(e);
                    });
                });
            }
        };

        for(key in this) {
            if(!this.hasOwnProperty(key)) {
                continue;
            }

            ConstructedModel[key] = this[key];
        }

        for(key in Model.prototype) {
            if(!Model.prototype.hasOwnProperty(key)) {
                continue;
            }

            ConstructedModel.prototype[key] = Model.prototype[key];
        }

        ConstructedModel.prototype.__definition__ = obj;

        return ConstructedModel;
    };

    var ModelField = function(conf) {
        var def = {
            properties: {},
            type: 'modelfield',
            field_type: conf.type,
            value: ''
        };

        for(var prop in conf) {
            if(!conf.hasOwnProperty(prop)) {
                continue;
            }

            def[prop] = conf[prop];
        }

        return function(conf) {
            /**
             * Handle max length stuff here
             */

            var self = this;

            console.dir({def: def});

            return def;
        }

    };

    var models = {
        Model: Model,

        KeyField: ModelField({field_type: 'key', maxlength: 32, readonly: true}),
        CharField: ModelField({field_type: 'chars'}),
        DateField: ModelField({field_type: 'date'}),
        DateTimeField: ModelField({field_type: 'datetime'}),
        ForeignKey: ModelField({field_type: 'foreignkey'})
    };

    /**
     * @name Registry
     * @description Registry stores all instances of registered objects
     */

    var Registry  = function() {
        var self = this;
        self._data = {};
    };

    Registry.prototype = {
        _types: {
            MODULE: 'module',
            MODEL: 'model',
            MANAGER: 'manager',
            APP: 'app'
        },
        _data: null,

        _register: function (name, dependencies, definition, type) {
            var self = this;

            if (!self._data[type]) { self._data[type] = {} }

            self._data[type][name] = {
                name: name,
                type: type,
                dependencies: dependencies,
                definition: definition,
                instance: null,
                initialized: false,
                
                initialize: function() {
                    var _obj_self = this;

                    if (!_obj_self.instance) {
                        var dependencies = [];

                        for (var i=0; i<_obj_self.dependencies.length; i++) {
                            var dependency_name = _obj_self.dependencies[i],
                                lp = tk.parseName(dependency_name),
                                dependency = self.retrieve(lp),
                                result = dependency.initialize();

                            dependencies.push(result);
                        }

                        if(this.definition) {
                            if(_obj_self.type == self._types.MODEL) {

                                (function(def, dep, models) {
                                    var dependencies = [models].concat(dep),
                                        model_definition = definition.apply(this, dependencies);
                                    //_obj_self.instance = //new Model(model_definition);
                                    _obj_self.instance = Model.extend(model_definition);
                                })(definition, dependencies, models);

                            } else {
                                _obj_self.instance = definition.apply(_obj_self, dependencies);
                            }

                        } else {
                            console.warn('No definition for ' + this.name);
                        }

                        _obj_self.initialized = true;
                    }

                    return _obj_self.instance;
                }
            };

            //obj;

            return true;
        },

        register_module: function (name, dependencies, definition) {
            this._register(name, dependencies, definition, this._types.MODULE);
        },

        register_model: function (name, dependencies, definition) {
            this._register(name, dependencies, definition, this._types.MODEL);
        },

        register_app: function(name, dependencies, definition) {
            this._register(name, dependencies, definition, this._types.APP);
        },

        is_defined: function(lp) {

            if (!lp.name || !lp.type) {
                console.error('Name and type required.');
                return false;
            }

            if(!this._data[lp.type]) {
                return false;
            }

            return this._data[lp.type][lp.name] !== undefined;
        },

        retrieve: function(lp) {
            var self = this;

            if (!self.is_defined(lp)) {
                console.log('not defined');
                return null;
            }

            return self._data[lp.type][lp.name];
        }
    };

    /**
     * @name tk
     * @description Main code. Contains load and run functionality
     */

    var tk = {
        _app: null,

        _registry: null,
        _loading_queue: 0,

        _additional: 0,
        _minus: 0,

        settings: {
            BASE_PATH: 'js',
            cache_requests: false
        },

        /**
         * Don't look at me ;(
         */
        parseName: function(name) {
            var parts = name.split('.');
            var name, type, path;

            if(parts.length == 1) {
                // name = name;
                type = 'module';
                path = [this.settings.BASE_PATH, 'libs', name + '.js'].join('/');
            }

            if(['models', 'views', 'functionality'].contains(parts[1])) {
                var app = parts[0],
                    resource = parts[1],
                    object = parts[2];

                name = object;

                if(resource == 'models') {
                    var type = 'model';
                } else if(resource == 'views' ){
                    var type = 'view';
                } else {
                    var type = 'module';
                }

                var path = [this.settings.BASE_PATH, 'apps', app, resource, object + '.js'].join('/');
            } else if(parts[0] == 'apps') {
                var app = parts[1];
                var type = 'app';
                var name = app;
                var path = [this.settings.BASE_PATH, 'apps', app, 'app.js'].join('/');
            }

            return {
                name: name,
                type: type,
                path: path
            }
        },

        include_script: function(path) {
            return new Promise(function(resolve, reject) {
                var script_tag = document.createElement('script');

                if(!tk.settings.cache_requests)
                    path += '?' + new Date().getTime();

                script_tag.src = path;
                script_tag.onload = function() {
                    resolve(path);
                };

                document.head.appendChild(script_tag);
            });
        },

        load: function(lp) {
            var self = this;

            if(self._registry.is_defined(lp)) {
                return new Promise(function(resolve, reject) {
                    resolve(self._registry.retrieve(lp));
                })
            }

            return new Promise(function(resolve, reject) {
                self.include_script(lp.path).then(function(){
                    var _interval = setInterval(function() {
                        if (self._registry.is_defined(lp)) {
                            clearInterval(_interval);
                            resolve(lp);
                        }
                    }, 50);
                });
            }).then(function (lp) {
                var obj = self._registry.retrieve(lp);

                return new Promise(function(resolve, reject) {
                    var dependency_queue = [];

                    if (!obj.dependencies.length)
                        resolve(obj.name);

                    for (var i=0; i<obj.dependencies.length; i++) {
                        var dependency_name = obj.dependencies[i],
                            dep_lp = self.parseName(dependency_name);

                        dependency_queue.push(self.load(dep_lp));
                    }

                    if(!dependency_queue.length) {
                        resolve(lp);
                        return true;
                    }

                    Promise.all(dependency_queue).then(function(r) {
                        resolve(lp);
                    }, function(e) {
                        reject(e);
                    });
                });
            });
        },

        _run: function(name) {
            var self = this;

            if (!self._registry.is_defined(name)) {
                throw Error(name + " is undefined.");
            }
            
            var module = self._registry.retrieve(name);

            module.initialize();
        },

        _initialize_app: function(name) {

        },

        init: function() {
            this._registry = new Registry();
        },

        setup: function(configuration) {
            var self = this,
                queue = [],
                config = configuration;

            for(var rn in TK_EXTERNAL_REQUIREMENTS) {
                var path = TK_EXTERNAL_REQUIREMENTS[rn];

                if(!window.hasOwnProperty(rn)) {
                    console.log('Loading requirement: ' + rn + ' ['+ path +']');
                    queue.push(self.include_script(path));
                }
            }

            if(queue.length > 0) {
                console.log('Requirements needed')

                Promise.all(queue).then(function() {
                    console.log('Pre-requisites met. Loading app.');
                    self.setup(config);
                }, function(e) {
                    console.error('Failed loading external dependencies.');
                    console.dir({e: e});
                });

                return;
            }

            // This doesn't need to be a function
            var run_app = function (name){
                var lp = {name: name, type: 'app'};

                if(self._registry.is_defined(lp)) {
                    var _app = self._registry.retrieve(lp);

                    if(!_app.initialized) {
                        var instance = _app.initialize();
                    }
                }
            };

            self.require = require;

            if (config.app) {
                require('api').then(function () {
                    require('apps.'+config.app).then(function() {
                        run_app(config.app);
                    });
                });
            }
        }
    };

    tk.init();

    module = function module(name, requirements, definition) {
        //console.log('Registering module ' + name);
        tk._registry.register_module(name, requirements, definition);
    };

    model = function model(name, requirements, definition) {
        //console.log('Registering model ' + name);
        tk._registry.register_model(name, requirements, definition);
    };

    app = function app(name, requirements, definition) {
        //console.log('Registering app ' + name);
        tk._registry.register_app(name, requirements, definition);
    };

    require = function require(name) {
        var lp = tk.parseName(name);

        return new Promise(function(resolve, reject) {
            if(tk._registry.is_defined(lp)) {
                resolve(tk._registry.retrieve(lp));
                return;
            }

            tk.load(lp).then(function() {
                resolve(tk._registry.retrieve(lp));
            }, function(error) {
                console.error('Failed loading ' + lp.name);
                console.error(error);
            });
        });
    };

    expose(tk, 'tk');
})(this);