// Re-export all crypto types from shared package
export type { EncryptedInstruction, RawInstruction, QrCodeData, CreateSharesRequest, CreateSharesResult, RestoreSecretRequest, RestoreSecretResult, DecryptInstructionRequest, DecryptInstructionResult, ExportedVault, EncryptedVaultFile } from '@seqrets/crypto';

// App-specific types (stay here)
import { z } from 'zod';

export const AskBobInputSchema = z.object({
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })),
  question: z.string(),
});
export type AskBobInput = z.infer<typeof AskBobInputSchema>;

export const AskBobOutputSchema = z.string();
export type AskBobOutput = z.infer<typeof AskBobOutputSchema>;
