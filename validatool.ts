import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Coin, QueryClient, StakingExtension } from "@cosmjs/stargate";
import { setupStakingExtension } from "@cosmjs/stargate";
import { DelegationResponse } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import invariant from "invariant"

interface DelegationBalances extends DelegationResponse {
    balanceOsmo: Coin
}

class Utils {
    static sortDelegations(a: DelegationResponse, b: DelegationResponse){
        invariant(a.balance, "balance not found")
        invariant(b.balance, "balance not found")
        const sharesA = BigInt(a.balance.amount);
        const sharesB = BigInt(b.balance.amount); 
        if (sharesA < sharesB) {
        return 1;
        } else if (sharesA > sharesB) {
        return -1;
        } else {
        return 0;
        }
    }

    static sortDelegationsByBalanceOsmo(a: DelegationBalances, b: DelegationBalances){
        invariant(a.balance, "balance not found")
        invariant(b.balance, "balance not found")
        const sharesA = Number(a.balanceOsmo.amount);
        const sharesB = Number(b.balanceOsmo.amount); 
        if (sharesA < sharesB) {
        return 1;
        } else if (sharesA > sharesB) {
        return -1;
        } else {
        return 0;
        }
    }

    static addBalanceInOsmo(delegation: DelegationResponse, priceCoeff: number): DelegationBalances{
        const delegationBalance = delegation as DelegationBalances
        invariant (delegationBalance.balance, "no balance")
        const osmoAmount = Number(delegationBalance.balance.amount) * priceCoeff
        delegationBalance.balanceOsmo = {
            denom: "uosmo",
            amount: osmoAmount.toString()
        }
        return delegationBalance
    }

    
}

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

    async getDelegations(): Promise<DelegationResponse[]> {
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

interface ValidatorInfo {
    network: string
    delegatorAddr: string
    rpcUrl: string
    priceCoeff: number // price value of token in osmo
}

async function main() {
    const osmoDelegatorAddr = "osmovaloper1udp8gef365zcqhlxuepewrxuep9thjanuhxcaw"
    const osmoRpcUrl = "https://osmosis-rpc.polkachu.com"
    // stargaze validator
    const starsDelegatorAddr = "starsvaloper1kekv8xqg7aj628l8av4d95cm79y8lw3clph7u7"
    const starsRpcUrl = "https://stargaze-rpc.polkachu.com"
    // validators
    const validatorsInfo: ValidatorInfo[] = [
        {
            network: "osmosis",
            delegatorAddr: osmoDelegatorAddr,
            rpcUrl: osmoRpcUrl,
            priceCoeff: 1
        },
        {
            network: "stargaze",
            delegatorAddr: starsDelegatorAddr,
            rpcUrl: starsRpcUrl,
            priceCoeff: 0.0237 // 1 STARS = 0.0237 OSMO
        }
    ]

    let top30validator = []
    for (const validatorInfo of validatorsInfo) {
        console.log(`----------- ${validatorInfo.network} START -----------`)
        const validator = new Validator(validatorInfo.delegatorAddr, validatorInfo.rpcUrl)
        await validator.connect()
        const myDelegations = await validator.getDelegations()
        myDelegations.sort(Utils.sortDelegations);
        myDelegations.map(x => Utils.addBalanceInOsmo(x, validatorInfo.priceCoeff))
        top30validator.push(...myDelegations.map(x => x as DelegationBalances))
        for (let i = 0; i<30; i++){
            console.log(myDelegations[i])
        }
        console.log(`----------- ${validatorInfo.network} END -----------`)
    }
    console.log(`----------- FINAL SORT BY OSMO BALANCE START -----------`)
    top30validator.sort(Utils.sortDelegationsByBalanceOsmo)
    for (let i = 0; i < 30 && i < top30validator.length; i++) {
        console.log("-------------------------------")
        console.log(`NUMBER : [${i+1}]`)
        console.log(top30validator[i])
        console.log("-------------------------------")
    }
    console.log(`----------- FINAL SORT BY OSMO BALANCE END -----------`)

   
}

main();