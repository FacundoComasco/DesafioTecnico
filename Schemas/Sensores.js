import mongoose from 'mongoose';

const Sensores = mongoose.Schema({
    _id:String,
    Alta: Number
});

const Tabla_Sensores = mongoose.model("Sensores",Sensores);


export default Tabla_Sensores;