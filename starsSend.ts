import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { STARS_SEND_MNEMO } from "./config";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";

interface TransfertNFT {
  recipient: string
  token_id: string
}

interface TransfertNFTObject {
  transfer_nft: TransfertNFT
}

async function main() {
    const contract = "stars1lq36gkcpa7n8lxkd702wzvmldzfq5atvmcq35llvdk6jhyyxvzcsrzm4sw"
    const recipient = "stars105j5tl5wsvr7u0upaq4lvynpr95jsuuy4pcphg"
    const token_id = "11"

    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(STARS_SEND_MNEMO, {
        prefix: 'stars',
      });
    const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com:443"
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);
    const balance = await client.getBalance(firstAccount.address, "ustars")
    
    console.log("Account balance", balance)
    
    const contractResp = await client.getContract(contract)
    console.log("NFT contract info", contractResp)

    const nftToTransfert: TransfertNFT = {
      recipient,
      token_id
    }

    const transfertNFTObject: TransfertNFTObject = {
      transfer_nft: nftToTransfert
    }

    const executeContractMsg: MsgExecuteContractEncodeObject = {
      typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
      value: MsgExecuteContract.fromPartial({
        sender: firstAccount.address,
        contract,
        msg: new TextEncoder().encode(JSON.stringify(transfertNFTObject)),
        funds: [],
      }),
    };

    const gasLimit = await client.simulate(firstAccount.address, [executeContractMsg], "from Astroquirks with <3")
    console.log("gasLimit", gasLimit)

    const fee = {
      amount: [{
        denom: "ustars",
        amount: "2000"
      }],
      gas: gasLimit.toString(),
    };

    const txBroadcastResult = await client.signAndBroadcast(firstAccount.address, [executeContractMsg], fee, "from Astroquirks with <3");
    console.log(txBroadcastResult.transactionHash)
}

main();