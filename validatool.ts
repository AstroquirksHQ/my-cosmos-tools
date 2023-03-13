import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient, StakingExtension } from "@cosmjs/stargate";
import { setupStakingExtension } from "@cosmjs/stargate";
import invariant from "invariant"

class Validator {
    private client!: QueryClient & StakingExtension;
    private validatorAddr: string
    private rpcUrl: string

    constructor(validatorAddr: string, rpcUrl: string){
        this.validatorAddr = validatorAddr
        this.rpcUrl = rpcUrl
    }

    async connect():  Promise<void> {
        const tmClient = await Tendermint34Client.connect(this.rpcUrl);
        this.client = QueryClient.withExtensions(tmClient, setupStakingExtension)
    }

    async getDelegations(){
        let myDelegations = []
        let pagination = undefined
        do {
            // @ts-ignore
            const delegations = await this.client.staking.validatorDelegations(this.validatorAddr, pagination)
            pagination = delegations.pagination?.nextKey
            myDelegations.push(...delegations.delegationResponses)
            console.log(myDelegations.length)
            console.log(delegations.pagination?.nextKey)
       } while (pagination && pagination.length > 0)
       return myDelegations
    }
}

async function main() {
    const osmoDelegatorAddr = "osmovaloper1udp8gef365zcqhlxuepewrxuep9thjanuhxcaw"
    const rpcUrl = "https://osmosis-rpc.polkachu.com"

    const validator = new Validator(osmoDelegatorAddr, rpcUrl)
    await validator.connect()
    
    const myDelegations = await validator.getDelegations()
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