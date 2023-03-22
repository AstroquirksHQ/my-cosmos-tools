import { DelegationResponse } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import invariant from "invariant"
import { AstroquirksFinalDelegations, AstroquirksDelegation } from "./model"

export class Utils {
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