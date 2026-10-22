import Contract from '@/models/Contract';
import { getContractEndDate } from '@/lib/utils';

/**
 * Marks every active contract whose term (startDate + duration months) has
 * passed as expired. Called before contracts are read so statuses stay current.
 */
export async function expireOverdueContracts(): Promise<void> {
  const active = await Contract.find({ status: 'active' }).select('startDate duration').lean();
  const now = new Date();

  const overdueIds = active
    .filter((c) => {
      const end = getContractEndDate(c.startDate, c.duration);
      return end !== null && end <= now;
    })
    .map((c) => c._id);

  if (overdueIds.length > 0) {
    await Contract.updateMany({ _id: { $in: overdueIds } }, { $set: { status: 'expired' } });
  }
}
