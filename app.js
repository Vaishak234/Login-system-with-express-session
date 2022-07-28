const express = require('express')
const session = require('express-session')
const bcrypt = require('bcrypt')
const mongodbStore = require('connect-mongodb-session')(session)
const db = require('./config/connections')
const { urlencoded } = require('express')
const flash = require('express-flash')
const exphbs = require('express-handlebars')
const { validator, validatorResults } = require('./middleware/validation')
const {userAuth,logger} =require('./middleware/authentication')
const app = express()
const port = 3000



app.set('view engine', 'hbs')
app.engine('hbs', exphbs.engine({extname:'hbs', defaultLayout:'layout.hbs'}));
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

db.connect((err)=>{
  if(err) console.log("Database Connection Error"+err);
  else console.log("database Connected Successfully");
})

const url = 'mongodb://localhost:27017/myDb'

const store =new mongodbStore ({
    uri: url,
    collection:'mySession'
    
})

app.use(session({
    secret: "key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge:1000*24*60*60
    },
    store:store
}))
app.use(flash())
// to prevent bakbutton on browser
app.use((req, res, next)=> {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});


 app.get('/',userAuth, (req, res) => {
     let loggedUser = req.session.user
    
     res.render('main',{loggedUser})
    })

app.get('/register',logger,(req, res) => {
    if (req.session.validateErr) {
        let validateErr = req.session.validateErr[0].msg
         req.flash('errMsg',validateErr)
    }
    res.render('register')
  
})

app.post('/register',validator,validatorResults,async(req,res)=>{
    const { name, email, password , confirmpassword } = req.body
   
        let userExist = await db.get().collection('users').findOne({ email: email })
        if (userExist) {
            req.flash('errMsg', 'user with this email already exists')
            console.log('user with this email already exists');
            res.redirect('/register')
        } else {
            let hashedPassword = await bcrypt.hash(password, 10)
            let hashedconfirmPassword = await bcrypt.hash(confirmpassword, 10)
            const userDetails = {
                name: name,
                email: email,
                password: hashedPassword,
                confirmpassword:hashedPassword
            }
            db.get().collection('users').insertOne(userDetails).then((response) => {
                req.session.user = userDetails
                req.session.isUserLogged = true
                delete req.session.validateErr 
                res.redirect('/')
            })
        }
    
})

app.get('/login',logger, (req, res) => {
  res.render('login')
})

app.post('/login', async(req,res)=>{
   const {email,password} = req.body 
    let userExist = await db.get().collection('users').findOne({ email: email })
    if (!userExist) {
        req.flash('errMsg','no user found') 
        console.log('no user found');
        res.redirect('/login')
    } else {
        let isMatch = await bcrypt.compare(password, userExist.password)
        if (!isMatch) {
             req.flash('errMsg','incorrect password') 
            console.log('incorrect password');
            res.redirect('/login')
        } else {
            req.session.isUserLogged=true
            req.session.user = userExist
            console.log('login success');
             res.redirect('/')
        }
    }
})

app.get('/logout', (req, res) => { 
   
    delete req.session.user 
    delete req.session.isUserLogged
    req.flash('errMsg','user logged out') 
    console.log('user logged out');
    res.redirect('/login')
})



app.listen(port,()=>console.log('server is running'))