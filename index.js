console.clear();
import express from 'express';
import dotenv from 'dotenv';
import Dispositivos from './routes/Dispositivos.js'
import mongoose from 'mongoose'
import Temperaturas from './routes/Temperaturas.js';


dotenv.config();


const PORT = process.env.PORT;
const expressApp = express();

expressApp.use(express.json());

//expressApp.use(express.text());

expressApp.use("/DISPOSITIVOS",Dispositivos);
expressApp.use("/TEMPERATURAS",Temperaturas);
//las rutas dentro de dispositivo son relativas a /Temperaturas


const bootstrap = async () => {
    const Client = await mongoose.connect(process.env.MONGODB_URL);  

    expressApp.listen(PORT, () => 
        console.log("Iniciado en puerto "+PORT)
    );
    
}
bootstrap();
/*
expressApp.get("/asdasd/:id", (req,res) =>{
    console.log(req.params.id);
    console.log(req.headers)
    res.send("asdasd");
})*/
