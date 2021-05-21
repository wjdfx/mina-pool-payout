import { Block, Blocks } from "../core/dataprovider-types";
import { PayoutDetails, PayoutTransaction } from "../core/payout-calculator";
import { IBlockProcessor, IPaymentBuilder, PaymentConfiguration, PayoutCalculator } from "./Model";

export class PaymentBuilder implements IPaymentBuilder {
    
    private blockProvider : any
    private stakesProvider : any
    private config : PaymentConfiguration
    private blockHandler : IBlockProcessor
    private payoutCalculator : PayoutCalculator

    public constructor(configuration : PaymentConfiguration, blockHandler: IBlockProcessor, payoutCalculator: PayoutCalculator) {
        this.config = configuration
        this.blockHandler = blockHandler
        this.payoutCalculator = payoutCalculator

        //TODO: remove this to a factory, and use an interface for non-concrete implementations
        this.blockProvider = (this.config.blockDataSource == "ARCHIVEDB") ?
        require("./core/dataprovider-archivedb/block-queries-sql") :
        require("./core/dataprovider-minaexplorer/block-queries-gql")

        this.stakesProvider = (this.config.blockDataSource == "ARCHIVEDB") ?
        require("./core/dataprovider-archivedb/staking-ledger-json-file") :
        require("./core/dataprovider-minaexplorer/staking-ledger-gql")
    }

    async build(): Promise<{payouts: PayoutTransaction[], storePayout: PayoutDetails[], maximumHeight: number, blocks: Block[]}> {
        
        const { configuredMaximum, minimumConfirmations, minimumHeight, stakingPoolPublicKey, commissionRate } = this.config
        
        const latestHeight = await this.blockProvider.getLatestHeight()
        
        const maximumHeight = await this.blockHandler.determineLastBlockHeightToProcess(configuredMaximum, minimumConfirmations, latestHeight)
        
        console.log(`This script will payout from block ${minimumHeight} to maximum height ${maximumHeight}`)

        let blocks : Block[] = await this.blockProvider.getBlocks(stakingPoolPublicKey, minimumHeight, maximumHeight)

        let payouts: PayoutTransaction[] = []
          
        let storePayout: PayoutDetails[] = []

        const ledgerHashes = [...new Set(blocks.map(block => block.stakingledgerhash))]

        return Promise.all(ledgerHashes.map(async ledgerHash => {
            console.log(`### Calculating payouts for ledger ${ledgerHash}`)

            const [stakers, totalStake] = await this.stakesProvider.getStakes(ledgerHash, stakingPoolPublicKey)
            
            console.log(`The pool total staking balance is ${totalStake}`);

            const ledgerBlocks = blocks.filter(x => x.stakingledgerhash == ledgerHash)

            const [ledgerPayouts, ledgerStorePayout, blocksIncluded, totalPayout] = await this.payoutCalculator.getPayouts(ledgerBlocks, stakers, totalStake, commissionRate)
            
            payouts.push(...ledgerPayouts)
            
            storePayout.push(...ledgerStorePayout)

            console.log(`We won these blocks: ${blocksIncluded}`);

            console.log(`The Total Payout is: ${totalPayout} nm or ${totalPayout / 1000000000} mina`)
        })).then( async () => {
            
            return { payouts, storePayout, maximumHeight, blocks}
        })
    }
}