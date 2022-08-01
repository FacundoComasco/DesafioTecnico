import mongoose from 'mongoose';


const Temperatura_Schema = mongoose.Schema({    
    Date: Number,
    Temp: Number,
    createdAt:{ type: Date, expires: Number(process.env.ExpireData),  default: Date.now  }
})

export default Temperatura_Schema;