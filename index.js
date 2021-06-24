#!/usr/bin/env node

require('dotenv').config()
const { ProofStorage } = require('./lib/storage')
const { Aggregator } = require('./lib/aggregator')
const { configureAPI } = require('./lib/api')
const { configureTezosClient } = require('./lib/tezos')
const { Publisher } = require('./lib/publisher')
const { CronJob } = require('cron')

const {
  PROOFS_DIR: proofsDirectory = 'proofs',
  PORT: port = '8080',
  BASE_URL: baseURL = 'http://localhost:8080',
  FAUCET_KEY_PATH: faucetKeyPath,
  TEZOS_WALLET_SECRET: tezosWalletSecret,
  CONTRACT_ADDRESS: contractAddress = 'KT1RHdBdefx1iRMHmgwvzb6oMR2HyWQuayzx',
  RPC_URL: rpcURL = 'https://testnet-tezos.giganode.io/',
  SCHEDULE: schedule = '* * * * *'
} = process.env

/**
 * Server setup
 */
void async function () {
  const storage = new ProofStorage(proofsDirectory)
  const aggregator = new Aggregator()
  const tezosClient = await configureTezosClient(
    tezosWalletSecret,
    faucetKeyPath,
    rpcURL
  )
  const publisher = new Publisher(storage, aggregator, tezosClient)
  await publisher.bind(contractAddress)
  const job = new CronJob(schedule, () => publisher.publish())
  const app = await configureAPI(baseURL, storage, aggregator)
  app.listen(port, () => {
    console.log(`Serving on port ${port}`)
  })
  job.start()
}()
