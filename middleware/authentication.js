
module.exports = {

   userAuth : (req, res, next) => {
        if (req.session.user) {
        next()
    } else {
       
        res.redirect('/login')
    }
    },
     logger : (req, res, next) => {
    if (req.session.isUserLogged ) {
       
        res.redirect('/')
    }
    else {
       next()
    }
}
   
}