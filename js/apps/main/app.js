/**
 *
 * App initialization
 *
 */

app('main', ['main.models.User'],  function(User) {

    console.log('Got in main app!');

    /*User.objects.all().then(function(users) {
        console.dir(users);
    });*/

    var user = new User({
        first_name: 'Tom',
        last_name: 'Reitsma'
    });

    user.save();

});
