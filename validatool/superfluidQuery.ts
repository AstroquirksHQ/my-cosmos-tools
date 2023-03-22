import { osmosis } from 'osmojs';

export class SuperfluidUtils {
    static async getSuperfluidGammaAccounts(): Promise<string[]> {
        const osmoDelegatorAddr = "osmovaloper1udp8gef365zcqhlxuepewrxuep9thjanuhxcaw"
        const osmoRpcUrl = "https://osmosis-rpc.polkachu.com"
        const { createRPCQueryClient } = osmosis.ClientFactory;
        const osmoCient = await createRPCQueryClient({ rpcEndpoint: osmoRpcUrl });
        const superfluidGammaAccounts = await osmoCient.osmosis.superfluid.allIntermediaryAccounts()
        return superfluidGammaAccounts.accounts.map(x => x.address)
    }
}