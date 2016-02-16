module('http', ['utils', 'CookieManager'], function(utils, cookie) {

    if (!window.XMLHttpRequest && 'ActiveXObject' in window) {
        window.XMLHttpRequest = function() {
            return new ActiveXObject('MSXML2.XMLHttp');
        };
    }
    
    var HTTP = function () {
        
    };
    
    HTTP.prototype = {
        _call: function(url, parameters, async, method) {
            var async = async || true,
                _params = [],
                _send_params = null;

            for (var param in parameters) {
                _params.push(param + '=' + parameters[param]);
            }
            
            var _params = _params.join('&'),
                suffix = null;
            
            if (!tk.settings.cache_requests) {
                if (url.contains('?')) {
                    suffix = '&_t=' + utils.time.now();
                } else {
                    suffix = '?_t=' + utils.time.now();
                }
            }
            
            var url = url + suffix,
                _m = method.toUpperCase();
            
            if (["POST", "PUT"].contains(_m)) {
                var url = url,
                    _send_params = _params;
            } else if(_params.length) {
                if (url.contains('?')) {
                    var url = url + '&' + _params;
                } else {
                    var url = url + '?' + _params;
                }
            }
            
            var xhr = new XMLHttpRequest();
            xhr.open(method, url, async);
            xhr.setRequestHeader("X-CSRFToken", cookie.get('csrftoken'));
            
            if (["POST", "PUT"].contains(_m)) {
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.setRequestHeader("Content-length", _params.length);
                xhr.setRequestHeader("Connection", "close");
            }
            
            if (async) {
                return new Promise(function(resolve, reject){
                    xhr.send(_send_params);
                    xhr.onload = function(){
                        if (xhr.status == 200) {
                            resolve(xhr.responseText);
                        } else {
                            reject(Error("Something went wrong."));
                        }
                    };
                });
            } else {
                xhr.send(_send_params);
                return xhr.responseXML;
            }
            
        },
        
        get: function(url, parameters, async) {
            return this._call(url, parameters, async, "GET");
        },
        
        post: function(url, parameters, async) {
            return this._call(url, parameters, async, "POST");
        },
        
        put: function(url, parameters, async) {
            return this._call(url, parameters, async, "PUT");
        },
        
        delete: function(url, parameters, async) {
            return this._call(url, parameters, async, "DELETE");
        }
    };
    
    return new HTTP();
});