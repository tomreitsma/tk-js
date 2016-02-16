model('User', ['http'], function(models, http) {

    return {
        __api__: 'users',

        key: models.KeyField(),
        first_name: models.CharField(),
        last_name: models.CharField(),

        pre_save: function() {
            console.log('Got in pre-save!');
        },

        post_save: function() {
            console.log('Got in post-save!');
        },

        do_something: function() {
            console.dir({
                http: http,
                key: this.key,
                first_name: this.first_name,
                last_name: this.last_name
            });
        }

    }

});