import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { Coin, QueryClient, StakingExtension, StargateClient } from "@cosmjs/stargate";
import { setupStakingExtension } from "@cosmjs/stargate";
import { DelegationResponse, Delegation } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import invariant from "invariant"
import { Pubkey } from "@cosmjs/amino";
import { pubkeyToAddress } from "@cosmjs/amino";
import { osmosis } from 'osmojs';
import { SuperfluidUtils } from "./validatool/superfluidQuery"
import { AstroquirksDelegation, AstroquirksDelegations, AstroquirksFinalDelegations, ValidatorInfo } from "./validatool/model";
import { Utils } from "./validatool/utils";
import { AddrHelper } from "./validatool/addrHelper";
import { Validator } from "./validatool/validator";


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
            priceCoeff: 0.0218 // 1 STARS = 0.0218 OSMO
        }
    ]

    let top30delegators = []
    const superfluidGammaAddrs = await SuperfluidUtils.getSuperfluidGammaAccounts()
    for (const validatorInfo of validatorsInfo) {
        console.log(`----------- ${validatorInfo.network} START -----------`)
        const validator = new Validator(validatorInfo.delegatorAddr, validatorInfo.rpcUrl, validatorInfo.network)
        await validator.connect()
        const addrHelper = new AddrHelper(validatorInfo.rpcUrl)
        await addrHelper.connect()
        const myDelegations = await validator.getDelegations()
        const myDelegationsFiltered = myDelegations.filter(x => x.delegation && !superfluidGammaAddrs.includes(x.delegation.delegatorAddress))
        myDelegationsFiltered.sort(Utils.sortDelegations);
        myDelegationsFiltered.map(x => Utils.addBalanceInOsmo(x, validatorInfo.priceCoeff))
        await Promise.all(myDelegationsFiltered.map(x => addrHelper.addPubkey(x)))
        top30delegators.push(...myDelegationsFiltered.map(x => x as AstroquirksDelegation))
        for (let i = 0; i<30; i++){
            console.log(myDelegationsFiltered[i])
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
            balanceOsmo: Number(delegator.balanceOsmo.amount),
            starsAddr: delegator.starsAddr
            };
        } else {
            // no pubkey so we index by address
            if (delegator.pubkey === 'undefined' || delegator.pubkey == null){
                top30ByPkeydelegators[delegator.delegation.delegatorAddress] = {
                    delegations: [delegator.delegation],
                    balances: [delegator.balance],
                    balanceOsmo: Number(delegator.balanceOsmo.amount),
                    starsAddr: delegator.starsAddr
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
        const { delegations, balances, balanceOsmo, starsAddr} = top30ByPkeydelegators[pubkey];
        finalTop30delegators.push({
          delegations,
          balances,
          balanceOsmo,
          pubkey,
          starsAddr
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

    
    const slimList = finalTop30delegators.slice(0, 30).filter(x => x.starsAddr !== undefined).map((x, i) => ({
        "recipient": x.starsAddr,
        "token_id": (i+1).toString(),
    }));
    console.log(slimList)

   
}

main();