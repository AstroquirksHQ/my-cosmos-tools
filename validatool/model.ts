import { DelegationResponse, Delegation } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import { Coin } from "@cosmjs/stargate";

export interface AstroquirksDelegation extends DelegationResponse {
    balanceOsmo: Coin
    pubkey: string 
    osmoAddr: string
    starsAddr: string
    network: string
}

// for final ranking
export interface AstroquirksDelegations {
    [pubkey: string]: any;
}
// for final ranking
export interface AstroquirksFinalDelegations {
    delegations: Delegation[]
    balanceOsmo: Coin
    balances: Coin[]
    pubkey: string
    starsAddr: string
}

export interface ValidatorInfo {
    network: string
    delegatorAddr: string
    rpcUrl: string
    priceCoeff: number // price value of token in osmo
}