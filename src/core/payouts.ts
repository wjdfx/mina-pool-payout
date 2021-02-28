import { Block, getBlocks, getLatestHeight } from "./queries";
import { StakingKey, getStakes, timedWeighting } from "./stakes";

export async function getPayouts(stakingPoolKey: string, minHeight: number, globalSlotStart: number, k: number, slotsPerEpoch: number, commissionRate: number) {

  // Initialize some stuff
  let allBlocksTotalRewards = 0;
  let allBlocksTotalFees = 0;
  let blocksIncluded: any[] = [];
  // finality understood to be max height minus k blocks. unsafe to process blocks above maxHeight since they could change if there is a long running, short-range fork
  const finalityHeight = await getLatestHeight() - k; 

  // get the stakes - but maybe move these dependencies up to index vs. payouts -> stakes and queries?
  let [stakers, totalStake] = getStakes(stakingPoolKey, globalSlotStart, slotsPerEpoch);


  console.log(`The pool total staking balance is ${totalStake}`);
  

  const blocks = await getBlocks(stakingPoolKey, minHeight, finalityHeight);

  // TODO: extract to 2-3 functions
  blocks.forEach((block: Block) => {
    // Keep a log of all blocks we processed
    blocksIncluded.push(block.blockheight);

    // TODO: check for no coinbase - if no coinbase, skip the block?
<<<<<<< Updated upstream
    let sumEffectivePoolStakes = 0;
    let effectivePoolStakes: { [key: string]: number } = {};

    // Determine the supercharged weighting for the block
    let txFees = block.usercommandtransactionfees || 0;
    let superchargedWeighting = 1 + 1 / (1 + txFees / block.coinbase);

    // What are the rewards for the block
    let totalRewards = block.blockpayoutamount
    let totalFees = commissionRate * totalRewards;

    console.log(`txfees: ${txFees}, superchargedWeighting: ${superchargedWeighting}, totalRewards: ${totalRewards}, totalFees: ${totalFees}, coinbase: ${block.coinbase}`);

    allBlocksTotalRewards += totalRewards;
    allBlocksTotalFees += totalFees;

    // #TODO this should match the fee transfer to the coinbase receiver. Add an assert it can't be larger.
    // #if "feeTransfer" not in b["transactions"]:
    // #    # Just coinbase so we can't pay out more than the coinbase. We also may have an orphaned block.
    // #    #assert total_rewards <= int(b["transactions"]["coinbase"])
    // #else:
    // #    # There were some fee transfers so let's _really_ make sure we don't pay out more than we received

    // Loop through our list of delegates to determine the weighting per block

    // TODO: need to handle rounding issues 

    stakers.forEach((staker: StakingKey) => {
      let superchargedContribution =
        (superchargedWeighting - 1) * staker.timedWeighting + 1;
      let effectiveStake = staker.stakingBalance * superchargedContribution;
      effectivePoolStakes[staker.publicKey] = effectiveStake;
      sumEffectivePoolStakes += effectiveStake;
    });

    // Sense check the effective pool stakes must be at least equal to total_staking_balance and less than 2x
    //TODO: assert total_staking_balance <= sum_effective_pool_stakes <= 2 * total_staking_balance

    // Determine the effective pool weighting based on sum of effective stakes
    stakers.forEach((staker: StakingKey) => {
      let effectivePoolWeighting =
        effectivePoolStakes[staker.publicKey] / sumEffectivePoolStakes;

        // This must be less than 1 or we have a major issue
      //TODO: assert effective_pool_weighting <= 1

      let blockTotal = Math.round(
        (totalRewards - totalFees) * effectivePoolWeighting
      );
      staker.total += blockTotal;

      // Store this data in a structured format for later querying and for the payment script, handled seperately
      let storePayout = {
        publicKey: staker.publicKey,
        blockHeight: block.blockheight,
        stateHash: block.statehash,
        effectivePoolWeighting: effectivePoolWeighting,
        effectivePoolStakes: effectivePoolStakes[staker.publicKey],
        stakingBalance: staker.stakingBalance,
        sumEffectivePoolStakes: sumEffectivePoolStakes,
        superchargedWeighting: superchargedWeighting,
        dateTime: block.blockdatetime,
        coinbase: block.coinbase,
        totalRewards: totalRewards,
        payout: blockTotal,
      };
      //TODO: Store data 
    });
=======
    if ( typeof(block.coinbase) === 'undefined' || block.coinbase == 0 ) {
      console.log(`skipping block ${block.blockheight} because there is no coinbase`);
    } else {
      
      let sumEffectivePoolStakes = 0;
      let effectivePoolStakes: { [key: string]: number } = {};

      // Determine the supercharged weighting for the block
      let txFees = block.usercommandtransactionfees || 0;
      let superchargedWeighting = 1 + 1 / (1 + txFees / block.coinbase);

      // What are the rewards for the block
      let totalRewards = block.blockpayoutamount
      let totalFees = commissionRate * totalRewards;

      console.log(`txfees: ${txFees}, superchargedWeighting: ${superchargedWeighting}, totalRewards: ${totalRewards}, totalFees: ${totalFees}, coinbase: ${block.coinbase}`);

      allBlocksTotalRewards += totalRewards;
      allBlocksTotalFees += totalFees;

      // #TODO this should match the fee transfer to the coinbase receiver. Add an assert it can't be larger.
      // #if "feeTransfer" not in b["transactions"]:
      // #    # Just coinbase so we can't pay out more than the coinbase. We also may have an orphaned block.
      // #    #assert total_rewards <= int(b["transactions"]["coinbase"])
      // #else:
      // #    # There were some fee transfers so let's _really_ make sure we don't pay out more than we received

      // Loop through our list of delegates to determine the weighting per block

      // TODO: need to handle rounding issues 

      stakers.forEach((staker: any) => {
        let superchargedContribution =
          (superchargedWeighting - 1) * staker.timedWeighting + 1;
        let effectiveStake = staker.stakingBalance * superchargedContribution;
        effectivePoolStakes[staker.publicKey] = effectiveStake;
        sumEffectivePoolStakes += effectiveStake;
      });

      // Sense check the effective pool stakes must be at least equal to total_staking_balance and less than 2x
      //TODO: assert total_staking_balance <= sum_effective_pool_stakes <= 2 * total_staking_balance

      // Determine the effective pool weighting based on sum of effective stakes
      stakers.forEach((staker: any) => {
        let effectivePoolWeighting =
          effectivePoolStakes[staker.publicKey] / sumEffectivePoolStakes;

          // This must be less than 1 or we have a major issue
        //TODO: assert effective_pool_weighting <= 1

        let blockTotal = Math.round(
          (totalRewards - totalFees) * effectivePoolWeighting
        );
        staker.total += blockTotal;

        // Store this data in a structured format for later querying and for the payment script, handled seperately
        let storePayout = {
          publicKey: staker.publicKey,
          blockHeight: block.blockheight,
          stateHash: block.statehash,
          effectivePoolWeighting: effectivePoolWeighting,
          effectivePoolStakes: effectivePoolStakes[staker.publicKey],
          stakingBalance: staker.stakingBalance,
          sumEffectivePoolStakes: sumEffectivePoolStakes,
          superchargedWeighting: superchargedWeighting,
          dateTime: block.blockdatetime,
          coinbase: block.coinbase,
          totalRewards: totalRewards,
          payout: blockTotal,
        };
        //TODO: Store data 
      });
    }
>>>>>>> Stashed changes
  });

  // ################################################################
  // # Print some helpful data to the screen
  // ################################################################

  console.log(`We won these blocks: ${blocksIncluded}`);

  console.log(
    `We are paying out ${allBlocksTotalRewards} nanomina in this window.`
  );

  console.log(`That is ${allBlocksTotalRewards} mina`);

  console.log(`Our fee is is ${allBlocksTotalFees} mina`);

  let payoutJson: { publicKey: string; total: number }[] = [];

  stakers.forEach((staker) => {
    payoutJson.push({
      publicKey: staker.publicKey,
      total: staker.total,
    });
  });

  console.log(payoutJson);
  return payoutJson;
}