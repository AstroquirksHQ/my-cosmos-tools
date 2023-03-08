import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient } from "@cosmjs/stargate";
import { setupStakingExtension } from "@cosmjs/stargate";
import invariant from "invariant"

async function main() {
    const osmoDelegatorAddr = "osmovaloper1udp8gef365zcqhlxuepewrxuep9thjanuhxcaw"
    const apiUrl = "https://osmosis-mainnet-rpc.allthatnode.com:26657"

    const tmClient = await Tendermint34Client.connect(apiUrl);
    const client = QueryClient.withExtensions(tmClient, setupStakingExtension)

    async function getDelegation(){
        let myDelegations = []
        let pagination = undefined
        do {
            // @ts-ignore
            const delegations = await client.staking.validatorDelegations(osmoDelegatorAddr, pagination)
            pagination = delegations.pagination?.nextKey
            myDelegations.push(...delegations.delegationResponses)
            console.log(myDelegations.length)
            console.log(delegations.pagination?.nextKey)
       } while (pagination && pagination.length > 0)
       return myDelegations
    }
    
    const myDelegations = await getDelegation()
    myDelegations.sort((a, b) => {
        invariant(a.balance, "plop")
        invariant(b.balance, "plop")
        const sharesA = BigInt(a.balance.amount);
        const sharesB = BigInt(b.balance.amount); 
        if (sharesA < sharesB) {
        return 1;
        } else if (sharesA > sharesB) {
        return -1;
        } else {
        return 0;
        }
    });
    for (let i = 0; i<10; i++){
        console.log(myDelegations[i])
    }
}

main();