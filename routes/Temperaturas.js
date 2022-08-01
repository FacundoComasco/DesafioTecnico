import express from 'express';
import mongoose from 'mongoose';
import Tabla_Sensores from '../Schemas/Sensores.js'
import Temperatura_Schema from '../Schemas/Temperaturas.js'


const Temperaturas = express.Router();
//Middleware

Temperaturas.use((req,res,next) =>{
    //console.log("Esto se ejecuta antes de cada get post o delete");
    next();
})

//Obtener valores de algun sensor
Temperaturas.get('/', async (req,res) =>{    
    //return res.send(req.query.Id);
   
    const {Id , Tinicial , Tfinal, Opcion} = req.body;
   
    if(!Id)return res.sendStatus(Number(process.env.Temperatura_Err0)).send({err : "Metodo erroneo, falta ID"});
   
    const Sensor = await Tabla_Sensores.findById(Id).exec();
    if(Sensor===null){
        return res.status(Number(process.env.Sensor_Dispositivo_No_Encontrado)).send({err: "Sensor no encontrado"});
    }
    else{       
        var Ti=0;var Tf=Date.now();
        if(Tinicial!=undefined)Ti=Number(Tinicial);
        if(Tfinal!=undefined)Tf=Number(Tfinal);
        console.log(Ti + " - " + Tf);

        //Rango de temperaturas entre T_Inicial y T_Final
        //Calculando el promedio
        if(!Opcion){
            var SensorT = mongoose.model(Id,Temperatura_Schema,Id);
            const resp = await SensorT.aggregate([{$match:{"Date":{$gt:Ti , $lt:Tf}}}]).exec(); 
            if(resp.length===0)return res.status(Number(process.env.Temperatura_No_Hay_Datos)).send({err: "Sin datos de telemetria"});
            else return res.status(Number(process.env.OK)).send(resp);  
        }
        else if(Opcion===1){
            //Promedio
            var SensorT = mongoose.model(Id,Temperatura_Schema,Id);
            //const resp = await SensorT.find().exec(); 
            const resp = await SensorT.aggregate([{$match:{"Date":{$gt:Ti , $lt:Tf}}},{$group: {_id: null,T_Avg: { $avg: "$Temp"},Mediciones: { $sum: 1 }}}]).exec(); 
            if(resp.length===0)return res.status(Number(process.env.Temperatura_No_Hay_Datos)).send({err: "Sin datos de telemetria"});
            else return res.status(Number(process.env.OK)).send(resp);  
        }
        else if(Opcion===2){
            //Maxima
            var SensorT = mongoose.model(Id,Temperatura_Schema,Id);
            //const resp = await SensorT.find().exec(); 
            const resp = await SensorT.aggregate([{$match:{"Date":{$gt:Ti , $lt:Tf}}},{$group: {_id: null,T_Max: { $max: "$Temp"},Mediciones: { $sum: 1 }}}]).exec(); 
            if(resp.length===0)return res.status(Number(process.env.Temperatura_No_Hay_Datos)).send({err: "Sin datos de telemetria"});
            else return res.status(Number(process.env.OK)).send(resp); 
        }
        else if(Opcion===3){
            //Minima
            var SensorT = mongoose.model(Id,Temperatura_Schema,Id);
            //const resp = await SensorT.find().exec(); 
            const resp = await SensorT.aggregate([{$match:{"Date":{$gt:Ti , $lt:Tf}}},{$group: {_id: null,T_Min: { $min: "$Temp"},Mediciones: { $sum: 1 }}}]).exec(); 
            if(resp.length===0)return res.status(Number(process.env.Temperatura_No_Hay_Datos)).send({err: "Sin datos de telemetria"});
            else return res.status(Number(process.env.OK)).send(resp); 
        }
        else {
            return res.status(Number(process.env.Temperatura_Err4)).send({err: "Codigo de opcion inválido"}); 
        }  
    }   
});
Temperaturas.post('/', async (req,res) =>{    
    //Metodo POST se utiliza para cargar datos de temperaturas medidas en sensores
    const {Id,TEMP,Timestamp} = req.body;
    if(!Id)return res.status(Number(process.env.Temperatura_Err0)).send({err : "Metodo erroneo, falta ID"});   
    if(TEMP==undefined)return res.status(Number(process.env.Temperatura_Err1)).send({err : "Metodo erroneo, falta TEMP"});
    //El dato de temperatura medido puede ser utilizado con el horario de medicion o asignar el horario de carga a la misma
    var TS=0;
    if(!Timestamp)TS=Date.now();
    else TS=Timestamp;
    if(TS===0)TS=Date.now();    
    
    //Buscamos el Id en la base de datos para ver si el sensor existe
    const Sensor = await Tabla_Sensores.findById(Id).exec();   
    if(Sensor === null){
        //No existe el sensor, se descarta el dato
        return res.status(Number(process.env.Temperatura_Err2)).send({err : "Sensor inexistente"});      
    }
    else{
        //El sensor existe
        //Verificar que el dato es posterior al minuto de dado de alta
        if(TS >=Number(Sensor.Alta) + Number(process.env.T_ALTA) ){            
            const number = mongoose.model(Sensor.id,Temperatura_Schema,Sensor.id);
            const New_Temp = new number ({Date:TS,Temp:TEMP});        
            await New_Temp.save();
            return res.status(Number(process.env.Temperatura_Guardada)).send({msg: "OK"});
        }
        else{
            var Restante = (Number(Sensor.Alta) + Number(process.env.T_ALTA) -TS)/1000;
            Restante = Math.trunc(Restante);
            return res.status(Number(process.env.Temperatura_Err3)).send({err : "No paso el minuto desde el alta del sensor. Restante: " + Restante + " segundos"});
        }       
    }
    
});

export default Temperaturas;