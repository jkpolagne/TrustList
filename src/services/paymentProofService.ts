import { paymentProofs as seedProofs } from "../mocks";
import type { PaymentProof, PaymentProofType } from "../types";
import { computeTrancheFromAmount } from "../utils/milestones";
import { formatPHP } from "../utils/finance";
import { _applyClientPayment, getClientById } from "./clientService";
import { recordStatusHistory } from "./clientStatusHistoryService";
import { withDelay } from "./delay";
import { recordMilestoneEvent } from "./milestoneService";
import { loadPersisted, savePersisted } from "./persist";

const STORAGE_KEY = "trustlist.paymentProofs";

const paymentProofs: PaymentProof[] = loadPersisted(STORAGE_KEY, seedProofs);

function persist(): void {
  savePersisted(STORAGE_KEY, paymentProofs);
}

export function getPaymentProofsByClient(clientId: string): Promise<PaymentProof[]> {
  return withDelay(
    paymentProofs
      .filter((p) => p.clientId === clientId)
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()),
  );
}

export interface UploadPaymentProofInput {
  clientId: string;
  amount: number;
  paymentDate: string;
  paymentType: PaymentProofType;
  proofFilename: string;
  uploadedBy: string;
}

export interface UploadPaymentProofResult {
  proof: PaymentProof;
  newTrancheReached: boolean;
  trancheNumber: number;
}

/** Records a payment, recomputes the client's tranche progress, and — if a new
 * tranche threshold was just crossed — logs a milestone event flagged "Pending"
 * for Stage 7's broker voucher workflow to pick up. */
export async function uploadPaymentProof(
  input: UploadPaymentProofInput,
): Promise<UploadPaymentProofResult | undefined> {
  const client = await getClientById(input.clientId);
  if (!client) return undefined;

  const proof: PaymentProof = {
    id: `pay-${Date.now()}`,
    clientId: input.clientId,
    amount: input.amount,
    paymentDate: input.paymentDate,
    paymentType: input.paymentType,
    proofFilename: input.proofFilename,
    uploadedBy: input.uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
  paymentProofs.push(proof);
  persist();

  const newAmountPaid = client.amountPaid + input.amount;
  const newTranche = computeTrancheFromAmount(newAmountPaid, client.contractPrice, client.totalTranches);
  const newTrancheReached = newTranche > client.currentTranche;

  _applyClientPayment(input.clientId, newAmountPaid, newTranche);

  if (newTrancheReached) {
    await recordMilestoneEvent(client.companyId, client.id, newTranche, client.totalTranches);
    const releasedAll = newTranche >= client.totalTranches;
    await recordStatusHistory(
      client.id,
      client.status,
      releasedAll ? "Fully Released" : client.status,
      `Payment of ${formatPHP(input.amount)} received — Tranche ${newTranche} of ${client.totalTranches} milestone reached.`,
      input.uploadedBy,
    );
  } else {
    await recordStatusHistory(
      client.id,
      client.status,
      client.status,
      `Payment of ${formatPHP(input.amount)} received — no new tranche reached yet.`,
      input.uploadedBy,
    );
  }

  return { proof, newTrancheReached, trancheNumber: newTranche };
}
