const mongoose=require('mongoose')
const connectdb=async ()=>{
    try{
       //const conn=await mongoose.connect('mongodb://localhost:27017/freshbasket',{})
       const conn = await mongoose.connect(process.env.MONGODB_URL, {});

        console.log("mongodb connected");
        
    }catch(error){
        console.log(error);
        process.exit(1)
        
    }
};

module.exports=connectdb