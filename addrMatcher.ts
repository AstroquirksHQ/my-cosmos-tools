import { pubkeyToAddress } from "@cosmjs/amino";
import { StargateClient } from "@cosmjs/stargate";
import * as fs from "fs";
import { parse } from 'csv-parse';
import * as yargs from "yargs";

async function main(argv: any) {
  const rpcEndpoint = argv.rpcEndpoint || "https://rpc.osmosis.zone:443";
  const client = await StargateClient.connect(rpcEndpoint);

  const data = fs.readFileSync(argv.fromCsv);
  const records = await parse(data, { columns: true });
  const header = 'address,amount\n'
  process.stdout.write(header)
  for await (const record of records) {
    const osmoAddr = record.address;
    const result = await client.getAccount(osmoAddr);

    if (result?.pubkey) {
      const pubkey = result.pubkey;
      const new_address = pubkeyToAddress(pubkey, argv.to);
      const output = `${new_address},${record.amount}\n`;
      process.stdout.write(output)
    } else {
      console.error("pubkey not found for address" + osmoAddr);
      return
    }
  }
}

const argv = yargs
  .option("from-csv", {
    alias: "f",
    describe: "Path to the input CSV file",
    demandOption: true,
    type: "string",
  })
  .option("rpc", {
    alias: "r",
    describe: "RPC endpoint to connect to",
    type: "string",
  })
  .option("to", {
    describe: "The token you want to tranform the address to (ie : stars)",
    type: "string",
  })
  .help()
  .alias("help", "h").argv;

main(argv);