const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const { performance } = require("perf_hooks");
const utils = require("../utiF/tools");
const blockMult = require("../utiF/blockmult");
const PROTO_PATH = "blockmult.proto";

//  loading GRPC and generating client service
const definition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  arrays: true,
});

const BlockMultService = grpc.loadPackageDefinition(definition)
  .BlockMultService;

//the following code makes GRPC instance for each port
function makeClient(i) {
  const port = process.env.PORT || `3004${i}`;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;
  const client = new BlockMultService(
    address,
    grpc.credentials.createInsecure()
  );

  return client;
}

const constants = {
  // deadline, time in ms
  deadline: 50,
  // the foot print hasnt been activated yet
  footprint: -1,
  // number of multiplication block calls (multiB)
  numberOfCalls: 7,
  clients: [{ client: makeClient(0), id: 0 }],
  clientIndex: 0,
};

// calculating and generating the required number of clients
function scale() {
  let numberOfClients = Math.ceil(
    (constants.footprint * constants.numberOfCalls) /
      Math.abs(constants.deadline - constants.footprint)
  );

  console.log("footprint: " + constants.footprint);
  if (numberOfClients > 8) {
    numberOfClients = 8;
  }
  console.log("Scaling to: " + numberOfClients);
  for (let i = 1; i < numberOfClients; i++) {
    constants.clients[i] = {
      id: i,
      client: makeClient(i),
    };
  }
}


function getClient() {
  const client = constants.clients[constants.clientIndex];
  constants.clientIndex = ++constants.clientIndex % constants.clients.length;

  if (!client) {
    console.log("Unable to find the client");
    process.exit(1);
  }

  return client;
}

//resetting
function resetGrpcClient() {
  constants.footprint = -1;
  constants.clientIndex = 0;

  // Close all activate connections
  for (const clientObj of constants.clients) {
    clientObj.client.close();
  }

  constants.clients = [{ client: makeClient(0), id: 0 }];
}

function setDeadline(deadline) {
  constants.deadline = deadline;
}

//connects to the next available client
async function rpcMultB(A, B, MAX) {
  const client = await getClient();

  console.log("Using client: " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);
    const footPrintTimer1 = performance.now();

    client.client.multiB(block, (err, res) => {
      if (err) reject(err);

      // measure the foot print and proceed to scaling
      if (constants.footprint === -1) {
        constants.footprint = performance.now() - footPrintTimer1;
        scale();
      }

      const matrix = utils.convertProtoBufToArray(res.block);
      resolve(matrix);
    });
  });
}


async function rpcAddB(A, B, MAX) {
  // Get the next available client
  const client = await getClient();

  console.log("current client ID--> " + (client.id + 1));

  return new Promise((resolve, reject) => {
    const block = utils.createBlock(A, B, MAX);

    client.client.addBlock(block, (err, res) => {
      if (err) reject(err);
      // Make client available again
      client.isAvailable = true;

      const matrix = utils.convertProtoBufToArray(res.block);
      resolve(matrix);
    });
  });
}

module.exports = {
  rpcAddB,
  rpcMultB,
  resetGrpcClient,
  setDeadline,
};
