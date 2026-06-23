import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'

const app = express()

const port = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded())
app.use(cookieParser())

app.get("/", (req,res)=>{
    res.send("hello world")
})

app.listen(port, ()=>{
    console.log(`server is listening on port:${port}`)
})