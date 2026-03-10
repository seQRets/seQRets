
export interface EncryptedInstruction {
    salt: string; // base64
    data: string; // base64 of (nonce + encrypted gzipped data)
}

export interface RawInstruction {
    fileName: string;
    fileContent: string; // base64
    fileType: string;
}

export interface QrCodeData {
    shares: string[];
    totalShares: number;
    requiredShares: number;
    label?: string;
    setId: string;
    isTextOnly?: boolean;
}

export interface CreateSharesRequest {
    secret: string;
    password: string;
    totalShares: number;
    requiredShares: number;
    label?: string;
    keyfile?: string; // Base64 encoded keyfile content
}

export interface CreateSharesResult extends QrCodeData {
    encryptedInstructions?: EncryptedInstruction;
}

export interface RestoreSecretRequest {
    shares: string[];
    password: string;
    keyfile?: string; // Base64 encoded keyfile content
}

export interface RestoreSecretResult {
    secret: string;
    label?: string;
}

export interface DecryptInstructionRequest {
    encryptedData: string; // The full JSON string of the EncryptedInstruction object
    password: string;
    keyfile?: string; // Base64 encoded keyfile content
}

export type DecryptInstructionResult = RawInstruction;

// Represents an encrypted vault file (.seqrets) protected with an additional vault password
export interface EncryptedVaultFile {
    version: 2;
    encrypted: true;
    salt: string;   // base64
    data: string;   // base64(nonce + ciphertext of gzipped JSON)
}
