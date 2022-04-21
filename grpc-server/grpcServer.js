const grpc = require("grpc");
const protoLoader = require("@grpc/proto-loader");
const utils = require("../utiF/tools");
const blockMult = require("../utiF/blockmult");
const PROTO_PATH = "blockmult.proto";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


// The following code runs in each process and creates instances from ports 30040-30047 on GRPC server
function grpcRun() {
  const definition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    arrays: true,
  });
  const blockMultProto = grpc.loadPackageDefinition(definition);
  const server = new grpc.Server();

  const serviceFunctions = {
    multiB: (body, cb) => {
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.multiB(
        utils.convertProtoBufToArray(A),
        utils.convertProtoBufToArray(B),
        MAX
      );

      const response = utils.convertArrayToProtoBuf(multMatrix);
      cb(null, { block: response });


    },
    addBlock: (body, cb) => {
      const { A, B, MAX } = body.request;
      const multMatrix = blockMult.addBlock(
        utils.convertProtoBufToArray(A),
        utils.convertProtoBufToArray(B),
        MAX
      );
      const response = utils.convertArrayToProtoBuf(multMatrix);
      cb(null, { block: response });
    },
  };

  server.addService(blockMultProto.BlockMultService.service, serviceFunctions);

  const port = process.env.PORT || 30043;
  const host = process.env.HOST || "0.0.0.0";
  const address = `${host}:${port}`;

  server.bind(address, grpc.ServerCredentials.createInsecure());
  console.log(`Server running at ${address}`);
  server.start();
}

module.exports = grpcRun;
