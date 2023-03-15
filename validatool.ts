import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Coin, QueryClient, StakingExtension, StargateClient } from "@cosmjs/stargate";
import { setupStakingExtension } from "@cosmjs/stargate";
import { DelegationResponse, Delegation } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import invariant from "invariant"
import { Pubkey } from "@cosmjs/amino";
import { pubkeyToAddress } from "@cosmjs/amino";

interface AstroquirksDelegation extends DelegationResponse {
    balanceOsmo: Coin
    pubkey: string 
    osmoAddr: string
    network: string
}

// for final ranking
interface AstroquirksDelegations {
    [pubkey: string]: any;
}
// for final ranking
interface AstroquirksFinalDelegations {
    delegations: Delegation[]
    balanceOsmo: Coin
    balances: Coin[]
    pubkey: string
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

    static sortDelegationsByBalanceOsmo(a: AstroquirksFinalDelegations, b: AstroquirksFinalDelegations){
        invariant(a.balanceOsmo, "balance not found")
        invariant(b.balanceOsmo, "balance not found")
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

    static addBalanceInOsmo(delegation: DelegationResponse, priceCoeff: number): AstroquirksDelegation{
        const astroDelegation = delegation as AstroquirksDelegation
        invariant (astroDelegation.balance, "no balance")
        const osmoAmount = Number(astroDelegation.balance.amount) * priceCoeff
        astroDelegation.balanceOsmo = {
            denom: "uosmo",
            amount: osmoAmount.toString()
        }
        return astroDelegation
    }

    
}

class Validator {
    private client!: QueryClient & StakingExtension
    private validatorAddr: string
    private rpcUrl: string
    private network: string

    constructor(validatorAddr: string, rpcUrl: string, network: string){
        this.validatorAddr = validatorAddr
        this.rpcUrl = rpcUrl
        this.network = network
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

class AddrHelper {
    private client!: StargateClient
    private rpcUrl: string
    
    constructor(rpcUrl: string){
        this.rpcUrl = rpcUrl
    }

    async connect():  Promise<void> {
        this.client = await StargateClient.connect(this.rpcUrl)
    }


    async addPubkey(delegation: DelegationResponse){
        const astroDelegation = delegation as AstroquirksDelegation
        invariant(delegation.delegation, "hum")
        console.log(`try add pubkey for ${delegation.delegation.delegatorAddress}`)
        try {
            const account = await this.client.getAccount(delegation.delegation.delegatorAddress)
            if (account == null){
                console.log(`no pubkey for ${delegation.delegation.delegatorAddress}`)
            }
            const pubkey =  account!.pubkey
            if (pubkey == null){
                console.log(`no pubkey for ${delegation.delegation.delegatorAddress}`)
            }
            if (pubkey) {
                astroDelegation.pubkey = pubkey.value
                astroDelegation.osmoAddr = pubkeyToAddress(pubkey, "osmo")
                return astroDelegation
            } else {
                astroDelegation
            }
        } catch (error) {
            console.log(`error with address ${delegation.delegation.delegatorAddress}`)
            return astroDelegation
        }
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

    let top30delegators = []
    for (const validatorInfo of validatorsInfo) {
        console.log(`----------- ${validatorInfo.network} START -----------`)
        const validator = new Validator(validatorInfo.delegatorAddr, validatorInfo.rpcUrl, validatorInfo.network)
        await validator.connect()
        const addrHelper = new AddrHelper(validatorInfo.rpcUrl)
        await addrHelper.connect()
        const myDelegations = await validator.getDelegations()
        myDelegations.sort(Utils.sortDelegations);
        myDelegations.map(x => Utils.addBalanceInOsmo(x, validatorInfo.priceCoeff))
        await Promise.all(myDelegations.map(x => addrHelper.addPubkey(x)))
        top30delegators.push(...myDelegations.map(x => x as AstroquirksDelegation))
        for (let i = 0; i<30; i++){
            console.log(myDelegations[i])
        }
        console.log(`----------- ${validatorInfo.network} END -----------`)
    }
    
    
        
    console.log(`----------- FINAL SORT BY OSMO BALANCE and pubkey START -----------`)

    // do some reduce
    // loop through the objects
    const top30ByPkeydelegators: AstroquirksDelegations = {};
    for (const delegator of top30delegators) {
        invariant(delegator.delegation, "NOPE")

        // if we haven't seen this pubkey before, add it to the grouped objects
        if (!top30ByPkeydelegators[delegator.pubkey]) {
            top30ByPkeydelegators[delegator.pubkey] = {
            delegations: [delegator.delegation],
            balances: [delegator.balance],
            balanceOsmo: Number(delegator.balanceOsmo.amount)
            };
        } else {
            // no pubkey so we index by address
            if (delegator.pubkey === 'undefined' || delegator.pubkey == null){
                top30ByPkeydelegators[delegator.delegation.delegatorAddress] = {
                    delegations: [delegator.delegation],
                    balances: [delegator.balance],
                    balanceOsmo: Number(delegator.balanceOsmo.amount)
                }
            } else {
                // if we've seen this pubkey before, update the delegation array and balanceOsmo
                top30ByPkeydelegators[delegator.pubkey].delegations.push(delegator.delegation);
                top30ByPkeydelegators[delegator.pubkey].balances.push(delegator.balance);
                top30ByPkeydelegators[delegator.pubkey].balanceOsmo += Number(delegator.balanceOsmo.amount);
            }
        }
    }
    const finalTop30delegators: AstroquirksFinalDelegations[] = []
    for (const pubkey in top30ByPkeydelegators) {
        const { delegations, balances, balanceOsmo } = top30ByPkeydelegators[pubkey];
        finalTop30delegators.push({
          delegations,
          balances,
          balanceOsmo,
          pubkey,
        });
      }


    finalTop30delegators.sort(Utils.sortDelegationsByBalanceOsmo)
    for (let i = 0; i < 30 && i < finalTop30delegators.length; i++) {
        console.log("-------------------------------")
        console.log(`NUMBER : [${i+1}]`)
        console.log(finalTop30delegators[i])
        console.log("-------------------------------")
    }
    console.log(`----------- FINAL SORT BY OSMO BALANCE END -----------`)

   
}

main();