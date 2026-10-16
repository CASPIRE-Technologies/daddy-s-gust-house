import express from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const dataDir=path.join(__dirname,'data');
const dbFile=path.join(dataDir,'site-data.json');
const rooms=[{id:'deluxe-double',name:'Deluxe Double Room',capacity:2},{id:'king-view',name:'King Mountain View Room',capacity:2},{id:'family-suite',name:'Family Suite',capacity:4},{id:'triple',name:'Triple Room',capacity:3}];
const seed={reviews:[{id:'seed-1',name:'Thomas Richter',rating:5,comment:'A wonderful place to stay before our Adam’s Peak hike. Friendly family, clean rooms, and a great location.'},{id:'seed-2',name:'Sarah Morris',rating:5,comment:'Amazing hospitality and beautiful views. The room was spacious and the family was so welcoming.'},{id:'seed-3',name:'Julien Dupont',rating:5,comment:'Clean, comfortable and peaceful. Great Sri Lankan dinner cooked fresh on site.'}],reservations:[]};
async function readDb(){try{return JSON.parse(await fs.readFile(dbFile,'utf8'));}catch{await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(dbFile,JSON.stringify(seed,null,2));return seed;}}
async function writeDb(db){await fs.mkdir(dataDir,{recursive:true});await fs.writeFile(dbFile,JSON.stringify(db,null,2));}
const app=express();app.use(express.json());
app.get('/api/health',(_req,res)=>res.json({ok:true,service:'daddys-guest-api'}));
app.get('/api/rooms',(_req,res)=>res.json(rooms));
app.get('/api/reviews',async(_req,res)=>res.json((await readDb()).reviews));
app.post('/api/reviews',async(req,res)=>{const{name,comment,rating=5}=req.body||{};if(!name||!comment)return res.status(400).json({error:'Name and comment are required.'});const db=await readDb();const review={id:`review-${Date.now()}`,name,comment,rating:Number(rating)};db.reviews.unshift(review);await writeDb(db);res.status(201).json(review);});
app.post('/api/reservations',async(req,res)=>{const{name,whatsapp}=req.body||{};if(!name||!whatsapp)return res.status(400).json({error:'Name and WhatsApp number are required.'});const db=await readDb();const reservation={...req.body,id:`reservation-${Date.now()}`,createdAt:new Date().toISOString(),status:'new'};db.reservations.unshift(reservation);await writeDb(db);res.status(201).json({ok:true,reservation});});
app.post('/api/admin/login',(req,res)=>{if((req.body?.password||'')!==(process.env.ADMIN_PASSWORD||'daddysguest'))return res.status(401).json({error:'Invalid password'});res.json({token:Buffer.from(`admin:${Date.now()}`).toString('base64')});});
function adminOnly(req,res,next){if(!req.headers.authorization?.startsWith('Bearer '))return res.status(401).json({error:'Unauthorized'});next();}
app.get('/api/admin/reservations',adminOnly,async(_req,res)=>res.json((await readDb()).reservations));
const distDir=path.join(__dirname,'../dist');
app.use(express.static(distDir));
app.get(/^(?!\/api).*/,(_req,res)=>res.sendFile(path.join(distDir,'index.html')));
const port=process.env.API_PORT||3001;app.listen(port,()=>console.log(`Daddy's Guest API listening on http://localhost:${port}`));
