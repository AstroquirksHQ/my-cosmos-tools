import { Tendermint34Client } from "@cosmjs/tendermint-rpc";
import { QueryClient, StakingExtension, StargateClient, setupStakingExtension } from "@cosmjs/stargate";
import { DelegationResponse } from "cosmjs-types/cosmos/staking/v1beta1/staking";

export class Validator {
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
