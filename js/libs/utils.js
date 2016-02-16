module('utils', [], function(){
    
    var utils = {
        
        /**
         * Time utilities
         */
        time: {
            now: function() {
                return new Date().getTime();
            }
        },
        
        /**
         * DOM utilities
         */
        dom: {
            traverse: function (__element, _search_value, _search_type, _depth) {
                var elementsFound = [],
                    depth = _depth || 1,
                    search_value = _search_value.toLowerCase() || null,
                    search_type = _search_type || 'attribute';
                
                if (__element && __element.children) {
                    
                    for (var i=0; i<__element.children.length; i++) {
                        var e = __element.children[i];
                        
                        if (!search_value) {
                            elementsFound.push(e);
                        } else if (search_type == 'attribute' && e.attributes.hasOwnProperty(search_value)) {
                            elementsFound.push(e);
                        } else if (search_type == 'tag' && e.nodeName.toLowerCase() == search_value) {
                            elementsFound.push(e);
                        }
                        
                        if (e.children.length > 0) {
                            elementsFound = elementsFound.concat(this.traverse(e, search_value, search_type, depth+1));
                        }
                    }
                } else {
                    console.log('Empty element given');
                    console.dir({element:__element});
                    // Element has no children
                }
                
                return elementsFound;
            }
        }
        
    };
    
    return utils
});