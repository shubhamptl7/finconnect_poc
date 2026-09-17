import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';

/**
 * Utility to convert base64url to Uint8Array
 */
function base64UrlToUint8Array(base64url) {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Utility to convert Uint8Array to base64url
 */
function uint8ArrayToBase64Url(uint8Array) {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  const base64 = window.btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Generates an official BIP-39 12-word recovery mnemonic.
 * Uses 128 bits of cryptographically secure entropy + 4-bit SHA-256 checksum across 2048 words.
 */
export function generateRecoveryCode() {
  return generateMnemonic(wordlist, 128);
}

/**
 * Validates whether a given string is a valid BIP-39 mnemonic phrase.
 */
export function validateRecoveryCode(mnemonic) {
  if (!mnemonic || typeof mnemonic !== 'string') return false;
  return validateMnemonic(mnemonic.trim().toLowerCase(), wordlist);
}

// --- IndexedDB Storage Helpers ---

const DB_NAME = 'finconnect_e2ee';
const LEGACY_DB_NAME = 'payoman_e2ee';
const STORE_NAME = 'keys';

async function openDb(name = DB_NAME) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storePrivateKey(cryptoKey, publicKeyJwk = null) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(cryptoKey, 'e2ee_private_key');
    if (publicKeyJwk && publicKeyJwk.x) {
      store.put(publicKeyJwk.x, 'e2ee_public_key_x');
    }
    // SECURITY HARDENING: Always purge any legacy plaintext e2ee_recovery_phrase from IndexedDB
    store.delete('e2ee_recovery_phrase');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadPrivateKey() {
  const db = await openDb();
  let key = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('e2ee_private_key');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  // Seamless migration from legacy payoman_e2ee if not found in finconnect_e2ee
  if (!key && typeof indexedDB !== 'undefined') {
    try {
      const legacyDb = await openDb(LEGACY_DB_NAME);
      key = await new Promise((resolve) => {
        const tx = legacyDb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('e2ee_private_key');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
      if (key) {
        await storePrivateKey(key);
      }
    } catch {
      // Legacy store does not exist or cannot be accessed
    }
  }

  return key;
}

export async function getStoredPublicKeyX() {
  const db = await openDb();
  let pubX = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('e2ee_public_key_x');
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });

  if (!pubX && typeof indexedDB !== 'undefined') {
    try {
      const legacyDb = await openDb(LEGACY_DB_NAME);
      pubX = await new Promise((resolve) => {
        const tx = legacyDb.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get('e2ee_public_key_x');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // Ignore
    }
  }

  return pubX;
}

export async function clearPrivateKey() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete('e2ee_private_key');
    store.delete('e2ee_public_key_x');
    store.delete('e2ee_recovery_phrase');
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// --- Crypto Helpers ---

async function deriveWrappingKey(recoveryCode, saltBytes) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(recoveryCode),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 600000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptJwkWithCode(privateKeyJwk, code) {
  const salt = new Uint8Array(32);
  window.crypto.getRandomValues(salt);
  const wrappingKey = await deriveWrappingKey(code, salt);

  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  const privateKeyString = JSON.stringify(privateKeyJwk);
  const enc = new TextEncoder();

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    enc.encode(privateKeyString)
  );

  const ctBytes = new Uint8Array(cipherBuffer.slice(0, cipherBuffer.byteLength - 16));
  const tagBytes = new Uint8Array(cipherBuffer.slice(cipherBuffer.byteLength - 16));

  return {
    pbkdf2_salt: uint8ArrayToBase64Url(salt),
    iv: uint8ArrayToBase64Url(iv),
    ct: uint8ArrayToBase64Url(ctBytes),
    tag: uint8ArrayToBase64Url(tagBytes)
  };
}

/**
 * Generates extractable P-256 ECDH Keypair, wraps private key under 3 distinct secrets
 * (Primary Secret, Emergency Code #1, Emergency Code #2), and stores non-extractable key in IndexedDB.
 */
export async function generateAndBackupKeypair3(primarySecret, emergencyCode1, emergencyCode2) {
  const keyPair = await window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true, // extractable
    ['deriveKey', 'deriveBits']
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

  const primaryPayload = await encryptJwkWithCode(privateKeyJwk, primarySecret);
  const emergency1Payload = await encryptJwkWithCode(privateKeyJwk, emergencyCode1);
  const emergency2Payload = await encryptJwkWithCode(privateKeyJwk, emergencyCode2);

  const backupData = {
    version: 2,
    slots: [
      { id: 'primary', type: 'primary', status: 'AVAILABLE', label: 'Primary Recovery Secret', ...primaryPayload },
      { id: 'emergency_1', type: 'emergency', status: 'AVAILABLE', label: 'Emergency Recovery Code #1', ...emergency1Payload },
      { id: 'emergency_2', type: 'emergency', status: 'AVAILABLE', label: 'Emergency Recovery Code #2', ...emergency2Payload }
    ]
  };

  const nonExtractablePrivateKey = await window.crypto.subtle.importKey(
    'jwk',
    privateKeyJwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, // NOT extractable
    ['deriveBits']
  );

  await storePrivateKey(nonExtractablePrivateKey, publicKeyJwk);

  return { publicKeyJwk, backupBlob: backupData };
}

/**
 * Updates ONLY the Primary Recovery Secret (slot 0) for an existing backup object,
 * preserving existing emergency slots (whether AVAILABLE or CONSUMED).
 */
export async function updatePrimarySecretOnly(newPrimarySecret, existingBackupInput, privateKeyJwk) {
  let backupData = typeof existingBackupInput === 'string' ? JSON.parse(existingBackupInput) : existingBackupInput;

  let slots = [];
  if (backupData && backupData.slots && Array.isArray(backupData.slots)) {
    slots = [...backupData.slots];
  } else if (backupData && (backupData.pbkdf2_salt || backupData.ct)) {
    slots = [{ id: 'primary', type: 'primary', status: 'AVAILABLE', label: 'Primary Recovery Secret', ...backupData }];
  } else {
    slots = [{ id: 'primary', type: 'primary', status: 'AVAILABLE', label: 'Primary Recovery Secret' }];
  }

  const primaryPayload = await encryptJwkWithCode(privateKeyJwk, newPrimarySecret);

  slots[0] = {
    id: 'primary',
    type: 'primary',
    status: 'AVAILABLE',
    label: 'Primary Recovery Secret',
    ...primaryPayload
  };

  return {
    version: 2,
    slots
  };
}

/**
 * Restores private key from 3-slot or legacy backup data.
 */
export async function restoreKeyWithMode(backupDataInput, recoveryCode, isEmergencyMode = false) {
  try {
    const cleanCode = String(recoveryCode || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!cleanCode) return { success: false, error: 'Empty recovery code' };

    let backupData = typeof backupDataInput === 'string' ? JSON.parse(backupDataInput) : backupDataInput;

    let slots = [];
    if (backupData && backupData.slots && Array.isArray(backupData.slots)) {
      slots = backupData.slots;
    } else if (backupData && (backupData.pbkdf2_salt || backupData.ct)) {
      slots = [{ id: 'primary', type: 'primary', status: 'AVAILABLE', ...backupData }];
    }

    const candidateSlots = slots.filter(s => {
      if (s.status === 'CONSUMED') return false;
      if (!s.ct || !s.pbkdf2_salt) return false;
      if (isEmergencyMode) {
        return s.type === 'emergency';
      } else {
        return s.type === 'primary';
      }
    });

    if (candidateSlots.length === 0) {
      return {
        success: false,
        error: isEmergencyMode ? 'No active emergency recovery codes available' : 'Primary recovery secret unavailable'
      };
    }

    for (const slot of candidateSlots) {
      try {
        const salt = base64UrlToUint8Array(slot.pbkdf2_salt);
        const iv = base64UrlToUint8Array(slot.iv);
        const ct = base64UrlToUint8Array(slot.ct);
        const tag = base64UrlToUint8Array(slot.tag);

        const wrappingKey = await deriveWrappingKey(cleanCode, salt);

        const cipherBuffer = new Uint8Array(ct.length + tag.length);
        cipherBuffer.set(ct, 0);
        cipherBuffer.set(tag, ct.length);

        const plaintextBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          wrappingKey,
          cipherBuffer
        );

        const privateKeyString = new TextDecoder().decode(plaintextBuffer);
        const privateKeyJwk = JSON.parse(privateKeyString);

        const nonExtractablePrivateKey = await window.crypto.subtle.importKey(
          'jwk',
          privateKeyJwk,
          { name: 'ECDH', namedCurve: 'P-256' },
          false,
          ['deriveBits']
        );

        await storePrivateKey(nonExtractablePrivateKey, privateKeyJwk);

        return {
          success: true,
          slotId: slot.id,
          slotType: slot.type,
          isEmergency: slot.type === 'emergency'
        };
      } catch (err) {
        // Try next candidate slot
      }
    }

    return { success: false, error: 'Invalid recovery code' };
  } catch (error) {
    console.error('Failed to restore key:', error);
    return { success: false, error: error.message || 'Key recovery failed' };
  }
}

/**
 * Restores a private key from the backup blob using the recovery code.
 */
export async function restoreKey(backupBlob, recoveryCode) {
  const result = await restoreKeyWithMode(backupBlob, recoveryCode, false);
  if (result.success) return true;
  const emergencyResult = await restoreKeyWithMode(backupBlob, recoveryCode, true);
  return emergencyResult.success;
}


/**
 * Decrypts an ECIES JSON envelope.
 */
export async function decryptEcies(envelopeJsonString) {
  if (!envelopeJsonString || typeof envelopeJsonString !== 'string') return envelopeJsonString;
  if (!envelopeJsonString.startsWith('{"v":1')) return envelopeJsonString; // Pre-migration plaintext

  try {
    const envelope = JSON.parse(envelopeJsonString);
    const privateKey = await loadPrivateKey();

    if (!privateKey) throw new Error("Private key not found in storage");

    const epkBytes = base64UrlToUint8Array(envelope.epk);

    const epk = await window.crypto.subtle.importKey(
      'raw',
      epkBytes,
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    const sharedSecretBits = await window.crypto.subtle.deriveBits(
      { name: 'ECDH', public: epk },
      privateKey,
      256
    );

    const hkdfKey = await window.crypto.subtle.importKey(
      'raw',
      sharedSecretBits,
      'HKDF',
      false,
      ['deriveKey']
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: base64UrlToUint8Array(envelope.hkdf_salt),
        info: new TextEncoder().encode(envelope.hkdf_info),
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const ctBytes = base64UrlToUint8Array(envelope.ct);
    const tagBytes = base64UrlToUint8Array(envelope.tag);

    const cipherBuffer = new Uint8Array(ctBytes.length + tagBytes.length);
    cipherBuffer.set(ctBytes, 0);
    cipherBuffer.set(tagBytes, ctBytes.length);

    const iv = base64UrlToUint8Array(envelope.iv);

    const plaintextBytes = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipherBuffer
    );

    return new TextDecoder().decode(plaintextBytes);
  } catch (error) {
    console.warn("Decryption skipped for mismatched or legacy envelope:", error.message || error);
    return null; // Return null so UI can show graceful fallback instead of throwing console errors
  }
}
