import { IPaymentBuilder, IPaymentProcessor as IPaymentProcessor  } from "./Model"
import { PayoutTransaction } from "../payoutCalculator/Model";
import { PaymentConfiguration } from "../../configuration/Model";
import { ConfigurationManager } from "../../configuration/ConfigurationManager";
import { inject, injectable } from "inversify";
import TYPES from "../../composition/Types";
import { ISender, ITransactionBuilder, ITransactionProcessor } from "../transaction/Model";

@injectable()
export class PaymentProcessor implements IPaymentProcessor {
    
    private paymentBuilder : IPaymentBuilder
    private transactionBuilder : ITransactionBuilder
    private transactionProcessor : ITransactionProcessor
    private sender : ISender

    public constructor(
        @inject(TYPES.IPaymentBuilder) paymentBuilder: IPaymentBuilder,
        @inject(TYPES.ITransactionBuilder) transactionBuilder: ITransactionBuilder,
        @inject(TYPES.ITransactionProcessor) transactionProcessor: ITransactionProcessor,
        @inject(TYPES.ISender) sender: ISender
    ) {
        this.paymentBuilder = paymentBuilder,
        this.transactionBuilder = transactionBuilder,
        this.transactionProcessor = transactionProcessor,
        this.sender = sender
    }

    async run(args: any): Promise<void> {
        ConfigurationManager.build(args)
        
        const configuration = ConfigurationManager.Setup 

        if (this.isValid(configuration)) {
            
            let paymentProcess = await this.paymentBuilder.build() 
            
            let transactions = await this.transactionBuilder.build(paymentProcess,configuration)

            paymentProcess.totalPayoutFundsNeeded = await this.calculateTotalPayoutFundsNeeded(transactions)
            
            await this.transactionProcessor.write(transactions, configuration, paymentProcess) 

            await this.sender.send(configuration, transactions, paymentProcess)
            
        } else {
            //TODO: Use a custom error class
            throw new Error ('Unkown Data Source')
        }
        
    }

    private async calculateTotalPayoutFundsNeeded(transactions: PayoutTransaction[]) : Promise<number> {
        let totalPayoutFundsNeeded = 0

        transactions.map((t) => {totalPayoutFundsNeeded += t.amount + t.fee}); //probably move this

        console.log(`Total Funds Required for Payout = ${totalPayoutFundsNeeded}`);

        return totalPayoutFundsNeeded
    }

    private async isValid(config : PaymentConfiguration) : Promise<boolean> {
        
        if (config.blockDataSource != "ARCHIVEDB" && config.blockDataSource != "MINAEXPLORER") {
            return false
        }

        return true
        }
 }
