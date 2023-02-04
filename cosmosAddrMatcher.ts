import { pubkeyToAddress } from "@cosmjs/amino";
import { StargateClient } from "@cosmjs/stargate";
async function main() {
    const osmoAddr = "osmo1s43l7s99hx627scn2ldd3ey50qpj9frv073xj7"

    const rpcEndpoint = "https://rpc.osmosis.zone:443"

    const client = await StargateClient.connect(rpcEndpoint);

    const result = await client.getAccount(osmoAddr);

    if (result?.pubkey) {
        const pubkey = result.pubkey
        const stargaze_address = pubkeyToAddress(pubkey, "stars");
        const juno_address = pubkeyToAddress(pubkey, "juno");
        console.log(stargaze_address); 
        console.log(juno_address); 
    } else {
        console.error("pubkey not found for address" + osmoAddr);
    }

}

main();