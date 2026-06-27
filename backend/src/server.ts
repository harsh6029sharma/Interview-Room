import 'dotenv/config'
import app from "./app"
import { createServer } from 'http';
import { initSocket } from './sockets/socket';

const port = process.env.PORT || 3000;

const httpServer = createServer(app)
initSocket(httpServer)

httpServer.listen(port, ()=>{
    console.log(`server is listening on port:${port}`)
})