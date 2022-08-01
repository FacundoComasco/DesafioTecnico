import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Tabla_Sensores from '../Schemas/Sensores.js'

import { parse } from 'csv-parse';
import fs from 'fs'
import multer from 'multer'
import os from 'os'
const upload = multer({ dest: os.tmpdir() })

dotenv.config();
const Dispositivos = express.Router();
const LETRAS_PERMITIDAS="ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890" 
//Middleware

Dispositivos.use((req,res,next) =>{
    //console.log("Esto se ejecuta antes de cada get post o delete");
    next();
})

//Obtener valores de algun sensor
Dispositivos.get('/', async (req,res) =>{       
    const {Id} = req.body;   
    if(!Id)return res.status(Number(process.env.Sensor_Consulta_Invalida)).send({err: "No hay 'ID' en la consulta"});
   
    //Validamos los caracteres del id
    for(var i=0;i<Id.length;i++)
        if(LETRAS_PERMITIDAS.indexOf(Id[i]) == -1) return res.status(Number(process.env.Sensor_Id_Invalido)).send({err: "LETRA NO PERMITIDA"});
    const Sensor = await Tabla_Sensores.findById(Id).exec()
    if(Sensor===null)return res.status(Number(process.env.Sensor_Dispositivo_No_Encontrado)).send({err: "El dispositivo no existe"});
    else return res.status(Number(process.env.Sensor_Dispositivo_Encontrado)).send(Sensor);
});

Dispositivos.post('/',upload.single('file'), async (req,res) =>{    
    //Debe venir el id en el body del alta en formato json
    const {Id} = req.body;
    
    //Verificamos si recibimos informacion en un archivo csv     
    if(req.file===undefined){
        console.log("Sin archivo");
        if(!Id)return res.status(Number(process.env.Sensor_Consulta_Invalida)).send({err: "No hay 'ID' en la consulta"});
        for(var i=0;i<Id.length;i++)
        if(LETRAS_PERMITIDAS.indexOf(Id[i]) == -1) return res.status(Number(process.env.Sensor_Id_Invalido)).send({err: "LETRA NO PERMITIDA"});
        
        const Sensor = await Tabla_Sensores.findById(Id).exec();   
        if(Sensor === null){
              //No existe entonces lo creamos          
              const DateN = Date.now()
              const New_Sensor = new Tabla_Sensores({_id:Id,Alta:DateN});
              await New_Sensor.save();          
              return res.status(Number(process.env.Sensor_Alta_OK)).send({msg: "Sensor "+Id+ " dado de alta a las "+ Date(DateN)});   
        }
        else{
            //El sensor que se quiere dar de alta ya existe        
            return res.status(Number(process.env.Sensor_Alta_Err0)).send({err: "El dispositivo ya se encuentra dado de alta. Fecha de alta: "+ new Date(Number(Sensor.Alta))});
        }  
    }
    else{
        const data = fs.readFileSync(req.file.path)
        parse(data, async (err, records) => {
          if (err) {
            console.error(err)
            return res.status(Number(process.env.Sensor_csv_Err)).json({err: 'Error en lectura de csv'})
          }
      
          for(var i=0;i<records[0].length;i++){               
                var Valido=1;
                var ID=records[0][i];                    
                for(var j=0;j<ID.length;j++)
                if(LETRAS_PERMITIDAS.indexOf(ID[j]) == -1) {
                  Valido=0;
                }
                if(Valido==1){
                    const Sensor = await Tabla_Sensores.findById(ID).exec();   
                    if(Sensor === null){
                        //No existe entonces lo creamos          
                        const DateN = Date.now()
                        const New_Sensor = new Tabla_Sensores({_id:ID,Alta:DateN});
                        await New_Sensor.save();          
                        console.log("Sensor "+ID+" dado de alta a las "+ Date(DateN));   
                    }
                    else{
                        //El sensor que se quiere dar de alta ya existe        
                       console.log("El elemento " + i +"("+ID+") ya se encuentra dado de alta. Fecha de alta: "+ new Date(Number(Sensor.Alta)));
                    }  
                }               
                else{
                    console.log("El elemento " +i + "posee caracteres no permitidos");
                }
               
            }
            return res.status(Number(process.env.OK)).send({msg: "Finalizada carga de csv"});
        })
    }
     
});
Dispositivos.delete('/',upload.single('file'), async (req,res) =>{    
    //Debe venir el id en el body del alta en formato json
    const {Id} = req.body;
    if(req.file===undefined){
        if(!Id)return res.status(Number(process.env.Sensor_Consulta_Invalida)).send({err: "No hay 'ID' en la consulta"});
   
        const Sensor = await Tabla_Sensores.findById(Id).exec();   
        if(Sensor === null){
              //No existe         
              return res.status(Number(process.env.Sensor_Baja_err0)).send({msg: "Sensor inexistente"});   
        }
        else{
            //El sensor que se quiere dar de alta ya existe
            await mongoose.connection.db.dropCollection(Id, function(err, result) {console.log(err)});   
            await Sensor.remove();        
            return res.status(Number(process.env.Sensor_Baja_Ok)).send({msg: "Dispositivo eliminado"});
        }
    }
    else{
        const data = fs.readFileSync(req.file.path)
        parse(data, async (err, records) => {
          if (err) {
            console.error(err)
            return res.status(Number(process.env.Sensor_csv_Err)).json({err: 'Error en lectura de csv'})
          }
      
          for(var i=0;i<records[0].length;i++){               
                var Valido=1;
                var ID=records[0][i];                    
                for(var j=0;j<ID.length;j++)
                if(LETRAS_PERMITIDAS.indexOf(ID[j]) == -1) {
                  Valido=0;
                }
                if(Valido==1){
                    const Sensor = await Tabla_Sensores.findById(ID).exec();   
                    if(Sensor === null){
                        //No existe
                        console.log("El elemento " + i +"("+ID+") No se encuentra dado de alta");    
                        
                    }
                    else{
                        //Existe y lo borramos  
                        await mongoose.connection.db.dropCollection(ID, function(err, result) {console.log(err)});   
                        await Sensor.remove();        
                        console.log("Dispositivo eliminado " + ID );
                    }  
                }               
                else{
                    console.log("El elemento " +i + "posee caracteres no permitidos");
                }
               
            }
            return res.status(Number(process.env.OK)).send({msg: "Finalizado borrado por csv"});
        })
    }
   
    
});

export default Dispositivos;