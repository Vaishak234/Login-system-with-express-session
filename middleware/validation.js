const { body, validationResult } = require('express-validator');

module.exports = {

    validator: [
        body('name','please enter your name').trim().notEmpty().isAlpha().withMessage('please enter your name'),
        body('email').isEmail().normalizeEmail().withMessage('enter a valid email addrres'),
        body('password').isLength({ min: 4 }).withMessage('password must be at least 4 characters'),
        body('confirmpassword').custom((value, { req }) => {
          if (value !== req.body.password) {
          throw new Error('Password  does not match ');
    }
    return true;
  })
    ],
    validatorResults : (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) { 
            req.session.validateErr = errors.array()
            return res.redirect('/register')
        }
    
        next()
    }
}

