
import { StargateClient } from "@cosmjs/stargate";
import { DelegationResponse } from "osmojs/types/codegen/cosmos/staking/v1beta1/staking";
import { AstroquirksDelegation } from "./model";
import { pubkeyToAddress } from "@cosmjs/amino";
import invariant from "invariant"

export class AddrHelper {
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
                astroDelegation.starsAddr = pubkeyToAddress(pubkey, "stars")
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
