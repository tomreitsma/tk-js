module('CookieManager', [], function(){
    var CookieManager = function(){},
        _p;
    
    CookieManager.prototype = {
        _getObject: function() {
            if(document.cookie.length > 0) {
                var c = document.cookie;
                var object = {};
               
                var parts = c.split(';');
                
                parts.each(function(part){
                    var part = part.trim();
                    var _p = part.split('='),
                        key = _p[0], value = _p[1];
                    
                    try {
                        object[key] = JSON.parse(value);
                    } catch (e) {
                        object[key] = value;
                    }
                })
               
                return object;
            }
           
            return {};
        },
        
        _saveObject: function(object) {
            for(var key in object) {
                if(!(typeof object[key] == typeof {})) {
                    object[key] = {
                        value: object[key],
                        expiryDate: this._getExpiryDate()
                    }
                }
               
                document.cookie = [key, JSON.stringify(object[key].value)].join('=') + this._getExpiryString(object[key].expiryDate);
            }
        },
       
        _getExpiryDate: function(days) {
            if(!days) days = 365;
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            return expiryDate;
        },
       
        _getExpiryString: function(exdate) {
            return "; expires="+exdate.toUTCString();
        },
       
        set: function(name, value, expiryDays) {
            console.log('Cookie set!')
            expiryDate = this._getExpiryDate(expiryDays);
           
            _cookie = this._getObject();
            _cookie[name] = {
                value: value,
                expiryDate: expiryDate
            };
           
            this._saveObject(_cookie);
            return _cookie;
        },
        
        get: function(name) {
            var _cookie = this._getObject();
            return _cookie[name] ? _cookie[name] : null;
        },
        
        getObject: function() {
            return this._getObject();
        },
        
        destroy: function(name) {
            var _cookie = this._getObject();
            if(_cookie[name]) {
                var exdate = new Date();
                exdate.setDate(exdate.getDate() - 1);
                document.cookie = [name, ''].join('=') + this._getExpiryString(exdate);
            }
           
            return _cookie;
        }
    };
    
    return new CookieManager();
});