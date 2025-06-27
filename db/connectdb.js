const mongoose=require('mongoose')
const connectdb=async ()=>{
    try{
        const conn=await mongoose.connect('mongodb://localhost:27017/freshbasket',{})
        console.log("mongodb connected");
        
    }catch(error){
        console.log(error);
        process.exit(1)
        
    }
};

module.exports=connectdb