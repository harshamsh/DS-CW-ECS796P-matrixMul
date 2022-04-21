const cluster = require("cluster");
const grpcRun = require("./grpcServer");
//number of crse that the server will use
const numCPUs = 8; 

//generates unique ports for each instance
if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
       const port = `3004${i}`;
    cluster.fork({
      PORT: port,
    });
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log("worker " + worker.process.pid + " died");
  });
} else {
  grpcRun();
}
