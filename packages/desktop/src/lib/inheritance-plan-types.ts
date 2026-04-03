// ── Inheritance Plan Types ──────────────────────────────────────────
// Defines the data model for the in-app inheritance plan builder.
// Plans are serialized to JSON, encrypted via the existing
// encryptInstructions pipeline, and stored on smart card or file.

export const INHERITANCE_PLAN_VERSION = 4;
export const INHERITANCE_PLAN_FILENAME = 'inheritance-plan.json';
export const INHERITANCE_PLAN_FILETYPE = 'application/json';

export interface PlanInfo {
  preparedBy: string;
  dateCreated: string;
  lastUpdated: string;
  reviewSchedule: string;
  planVersion: string;
  changeLog: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  contactInfo: string;
  assignedAssets: string;
}

export interface QardLocation {
  id: string;
  qardNumber: number;
  location: string;
  heldBy: string;
  accessNotes: string;
}

/** A single secret protected by seQRets — password, keyfile, Qard locations, and smart card info. */
export interface SecretSet {
  id: string;
  description: string;
  password: string;
  keyfilePrimaryLocation: string;
  keyfileBackupLocation: string;
  configuration: string;
  label: string;
  qardLocations: QardLocation[];
  vaultFileLocation: string;
  smartCardPin: string;
  smartCardReaderModel: string;
}

export interface DigitalAsset {
  id: string;
  name: string;
  type: string;
  platform: string;
  loginEmail: string;
  approxValue: string;
  twoFactorMethod: string;
  recoverySeed: string;
  specialInstructions: string;
}

export interface DeviceAccount {
  id: string;
  label: string;
  type: string;
  location: string;
  username: string;
  password: string;
  notes: string;
}

export interface ProfessionalContact {
  id: string;
  role: string;
  name: string;
  phone: string;
  email: string;
}

export interface EmergencyAccess {
  emergencyContact: string;
  triggerConditions: string;
  accessProcedure: string;
  immediateActions: string;
  scopeLimitations: string;
}

export interface InheritancePlan {
  version: number;
  planInfo: PlanInfo;
  beneficiaries: Beneficiary[];
  distributionInstructions: string;
  secretSets: SecretSet[];
  deviceAccounts: DeviceAccount[];
  digitalAssets: DigitalAsset[];
  howToRestore: string;
  professionalContacts: ProfessionalContact[];
  emergencyAccess: EmergencyAccess;
  personalMessage: string;
}

const DEFAULT_RESTORE_STEPS = `1. Download seQRets from seqrets.app or use the web app.
2. Open the app and click "Restore Secret".
3. Gather the required Qards from the locations listed in the Secret Sets section above.
4. Import the Qards (scan QR, drag & drop, smart card, vault file, or paste text).
5. Enter the password from the matching Secret Set in this plan.
6. If a keyfile was used, toggle "Was a Keyfile used?" and load it from the location listed.
7. Click "Restore Secret".
8. Write down the restored secret on paper immediately. Do not save it digitally.
9. Use the restored secret to access your assets per the Digital Asset Inventory.
10. After securing all assets, delete all unencrypted copies of this document.`;

export function createBlankSecretSet(): SecretSet {
  return {
    id: crypto.randomUUID(),
    description: '',
    password: '',
    keyfilePrimaryLocation: '',
    keyfileBackupLocation: '',
    configuration: '2-of-3',
    label: '',
    qardLocations: [
      { id: crypto.randomUUID(), qardNumber: 1, location: '', heldBy: '', accessNotes: '' },
      { id: crypto.randomUUID(), qardNumber: 2, location: '', heldBy: '', accessNotes: '' },
      { id: crypto.randomUUID(), qardNumber: 3, location: '', heldBy: '', accessNotes: '' },
    ],
    vaultFileLocation: '',
    smartCardPin: '',
    smartCardReaderModel: '',
  };
}

export function createBlankPlan(): InheritancePlan {
  const today = new Date().toISOString().split('T')[0];
  return {
    version: INHERITANCE_PLAN_VERSION,
    planInfo: {
      preparedBy: '',
      dateCreated: today,
      lastUpdated: today,
      reviewSchedule: 'Every 6 months',
      planVersion: '',
      changeLog: '',
    },
    beneficiaries: [
      { id: crypto.randomUUID(), name: '', relationship: '', contactInfo: '', assignedAssets: '' },
    ],
    distributionInstructions: '',
    secretSets: [createBlankSecretSet()],
    deviceAccounts: [
      { id: crypto.randomUUID(), label: '', type: 'Computer', location: '', username: '', password: '', notes: '' },
      { id: crypto.randomUUID(), label: '', type: 'Password Manager', location: '', username: '', password: '', notes: '' },
      { id: crypto.randomUUID(), label: '', type: '2FA / Authenticator App', location: '', username: '', password: '', notes: '' },
    ],
    digitalAssets: [
      { id: crypto.randomUUID(), name: '', type: '', platform: '', loginEmail: '', approxValue: '', twoFactorMethod: '', recoverySeed: '', specialInstructions: '' },
    ],
    howToRestore: DEFAULT_RESTORE_STEPS,
    professionalContacts: [
      { id: crypto.randomUUID(), role: 'Estate Attorney', name: '', phone: '', email: '' },
      { id: crypto.randomUUID(), role: 'Financial Advisor', name: '', phone: '', email: '' },
      { id: crypto.randomUUID(), role: 'Accountant / CPA', name: '', phone: '', email: '' },
      { id: crypto.randomUUID(), role: 'Technical Contact', name: '', phone: '', email: '' },
      { id: crypto.randomUUID(), role: 'Trusted Friend / Advisor', name: '', phone: '', email: '' },
    ],
    emergencyAccess: {
      emergencyContact: '',
      triggerConditions: '',
      accessProcedure: '',
      immediateActions: '',
      scopeLimitations: '',
    },
    personalMessage: '',
  };
}
