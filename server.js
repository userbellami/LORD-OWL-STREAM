const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

let totalVisitors = 0;
let currentWatchers = 0;

const filePath = path.join(__dirname, "visitors.json");
if(fs.existsSync(filePath)){
  const data = JSON.parse(fs.readFileSync(filePath,"utf8"));
  totalVisitors = data.totalVisitors || 0;
}

const server = http.createServer((req,res)=>{
  if(req.url === "/increment"){
    totalVisitors++;
    fs.writeFileSync(filePath,JSON.stringify({totalVisitors}));
    broadcastCounters();
    res.writeHead(200); res.end("OK");
    return;
  }
  fs.createReadStream("index.html").pipe(res);
});

// WebSocket server
const wss = new WebSocket.Server({server});
function broadcastCounters(){
  const data = JSON.stringify({currentWatchers,totalVisitors});
  wss.clients.forEach(client=>{
    if(client.readyState===WebSocket.OPEN) client.send(data);
  });
}
wss.on("connection", ws=>{
  currentWatchers++;
  broadcastCounters();
  ws.on("close", ()=>{
    currentWatchers--;
    broadcastCounters();
  });
});

server.listen(process.env.PORT || 8080, ()=>console.log("Server running on port", server.address().port));
