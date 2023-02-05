import { pubkeyToAddress, decodeAminoPubkey, encodeSecp256k1Pubkey } from "@cosmjs/amino";
import { DirectSecp256k1HdWallet, Registry } from "@cosmjs/proto-signing";
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
async function main() {
    const contract = "stars1qpz580aatpwd7ddluwurzf00khg40v2kp7cgc4rg7wrd0uegl7vqqy7zhf"
    const mnemonic = "mountain prosper second fun text siege shiver rookie entry gold vote success";
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
        prefix: 'stars',
      });
    const rpcEndpoint = "https://rpc.elgafar-1.stargaze-apis.com:443"
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, wallet);
    const fee = {
        amount: [
          {
            denom: "ustars",
            amount: "0",
          },
        ],
        gas: "500000",
      };
    const amount = [
        {
          denom: "ustars",
          amount: "888000000",
        },
      ]
    
    
    const mint = await client.execute(firstAccount.address, contract, {"mint": {}}, fee, "", amount)
    console.log(mint.logs)
}

main();