import 'dotenv/config'
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import app from "./app"

const port = process.env.PORT || 3000;

app.use(pinoHttp({ logger }));

app.listen(port, ()=>{
    console.log(`server is listening on port:${port}`)
})