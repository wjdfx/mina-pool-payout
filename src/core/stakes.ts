export type StakingKey = {
  publicKey: string,
  total: number,
  stakingBalance: number,
  untimedAfterSlot: number
};

// for a given key, find all the stakers delegating to the provided public key (according to the provided epoch staking ledger)
// calculate timed weighting
export function getStakes(ledger: any[], key: string, globalSlotStart: number, slotsPerEpoch: number): [StakingKey[], number] {
  const stakes = ledger.filter((x) => x.delegate == key);
  let stakers: StakingKey[] = [];
  let totalStakingBalance: number = 0;

  stakes.forEach((stake: any) => {
    const balance = Number(stake.balance);
    stakers.push({
      publicKey: stake.pk,
      total: 0,
      stakingBalance: balance,
      untimedAfterSlot: calculateUntimedSlot(stake)
    });
    totalStakingBalance += balance;
  });
  return [stakers, totalStakingBalance];
}

// Changed from original implementation to simply return the slot number at which account beomes untimed
function calculateUntimedSlot(stake: any): number {

  // account is not locked if there is no timing section at all
  if (typeof (stake.timing) === 'undefined') {
    // Untimed for full epoch so we have the maximum weighting of 1
    return 0;
  } else {
    const vestingPeriod: number = Number(stake.timing.vesting_period);
    const vestingIncrement: number = Number(stake.timing.vesting_increment);
    const cliffTime: number = Number(stake.timing.cliff_time);
    const cliffAmount: number = Number(stake.timing.cliff_amount);
    const initialMinimumBalance: number = Number(stake.timing.initial_minimum_balance);

    if (vestingIncrement == 0) {
      //if vestingIncrement is zero, account may never unlock
      if (cliffAmount == initialMinimumBalance) {
        return cliffTime;
      } else {
        throw new Error('Timed Account with no increment - unsure how to handle');
      }
    } else {
      return ((((initialMinimumBalance - cliffAmount) / vestingIncrement) * vestingPeriod) + cliffTime);
    }
  }
}
