const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const app = express();


//login endpoint  

app.post('/login', (req,res)=>{
    const {username,password}= req.body;
    if(username ==='admin', password ==='password'){
       const token = jwt.sign({user:username}, secretKey)
       res.json({token})
    }else{
        res.status(400).json('invalid credentials')
    }
})
