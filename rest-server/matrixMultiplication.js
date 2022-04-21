const {
  rpcAddB,
  rpcMultB,
  resetGrpcClient,
  setDeadline,
} = require("./grpcClient");

//uploaded matrixes are fetched for the multiplication
async function matrixMul(A, B, deadline) {
  setDeadline(deadline);
  //fetching matrix size
  const MAX = A.length;
  const sizeB = 2;

  let A1 = [...Array(MAX)].map((_) => Array(MAX));
  let A2 = [...Array(MAX)].map((_) => Array(MAX));
  let A3 = [...Array(MAX)].map((_) => Array(MAX));
  let B1 = [...Array(MAX)].map((_) => Array(MAX));
  let B2 = [...Array(MAX)].map((_) => Array(MAX));
  let B3 = [...Array(MAX)].map((_) => Array(MAX));
  let C1 = [...Array(MAX)].map((_) => Array(MAX));
  let C2 = [...Array(MAX)].map((_) => Array(MAX));
  let C3 = [...Array(MAX)].map((_) => Array(MAX));
  let D1 = [...Array(MAX)].map((_) => Array(MAX));
  let D2 = [...Array(MAX)].map((_) => Array(MAX));
  let D3 = [...Array(MAX)].map((_) => Array(MAX));
  let res = [...Array(MAX)].map((_) => Array(MAX));

  for (let i = 0; i < sizeB; i++) {
    for (let j = 0; j < sizeB; j++) {
      A1[i][j] = A[i][j];
      A2[i][j] = B[i][j];
    }
  }

  for (let i = 0; i < sizeB; i++) {
    for (let j = sizeB; j < MAX; j++) {
      B1[i][j - sizeB] = A[i][j];
      B2[i][j - sizeB] = B[i][j];
    }
  }

  for (let i = sizeB; i < MAX; i++) {
    for (let j = 0; j < sizeB; j++) {
      C1[i - sizeB][j] = A[i][j];
      C2[i - sizeB][j] = B[i][j];
    }
  }

  for (let i = sizeB; i < MAX; i++) {
    for (let j = sizeB; j < MAX; j++) {
      D1[i - sizeB][j - sizeB] = A[i][j];
      D2[i - sizeB][j - sizeB] = B[i][j];
    }
  }


  const A1A2 = await rpcMultB(A1, A2, MAX);

 
  const multiplyMatrixCalls = [
    rpcMultB(B1, C2, MAX),
    rpcMultB(A1, B2, MAX),
    rpcMultB(B1, D2, MAX),
    rpcMultB(C1, A2, MAX),
    rpcMultB(D1, C2, MAX),
    rpcMultB(C1, B2, MAX),
    rpcMultB(D1, D2, MAX),
  ];

  //running the multiplications at a time
  const [B1C2, A1B2, B1D2, C1A2, D1C2, C1B2, D1D2] = await Promise.all(
    multiplyMatrixCalls
  );

  A3 = await rpcAddB(A1A2, B1C2, MAX);
  B3 = await rpcAddB(A1B2, B1D2, MAX);
  C3 = await rpcAddB(C1A2, D1C2, MAX);
  D3 = await rpcAddB(C1B2, D1D2, MAX);

  for (let i = 0; i < sizeB; i++) {
    for (let j = 0; j < sizeB; j++) {
      res[i][j] = A3[i][j];
    }
  }

  for (let i = 0; i < sizeB; i++) {
    for (let j = sizeB; j < MAX; j++) {
      res[i][j] = B3[i][j - sizeB];
    }
  }

  for (let i = sizeB; i < MAX; i++) {
    for (let j = 0; j < sizeB; j++) {
      res[i][j] = C3[i - sizeB][j];
    }
  }

  for (let i = sizeB; i < MAX; i++) {
    for (let j = sizeB; j < MAX; j++) {
      res[i][j] = D3[i - sizeB][j - sizeB];
    }
  }
  resetGrpcClient();
  return res;
}

module.exports = matrixMul;
