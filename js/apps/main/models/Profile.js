model('Profile', [], function(models) {

    return {
        first_name: models.CharField({maxlength: 32}),
        last_name: models.CharField({maxlength: 32}),
        birthday: models.DateTimeField()
    }

});