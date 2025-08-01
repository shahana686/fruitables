
const express=require("express")
const app=express()
const path=require('path')
const cookieParser=require('cookie-parser')
const hbs = require('hbs');


const userRoutes=require('./routes/user')
const adminRoutes=require('./routes/admin')
const connectdb = require('./db/connectdb')
require('dotenv').config();
const checkUser = require('./middleware/checkUser');




// //view engine setup
app.set("views",path.join(__dirname,'views'))
app.set('view engine', 'hbs');


//app.use(nocache())

// app.use(express.static("public"))
app.use(express.static(path.join(__dirname, 'public')))


//convert data into json format
app.use(express.json())
app.use(express.urlencoded({extended:false}))

app.use(cookieParser());
app.use(checkUser);

// app.use((req, res, next) => {
//   res.locals.token = req.cookies.token || null;
//   next();
// });

app.use('/user',userRoutes)
app.use('/admin',adminRoutes)


hbs.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
})

// 🔽 New multiply helper
hbs.registerHelper('multiply', function (a, b) {
  return a * b;
});


// ✅ Capitalize helper
hbs.registerHelper('capitalize', function (str) {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});



//order admin

hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

hbs.registerHelper('json', function (context) {
  return JSON.stringify(context);
});



connectdb()
 
const PORT=process.env.PORT

app.listen(PORT,()=>{
    console.log("server started");
    
})