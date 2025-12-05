import forge from 'node-forge';
import { ParsedPFX } from '../types';

/**
 * Reads a File object as an ArrayBuffer
 */
export const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Reads a File object as Text
 */
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as Text"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};

/**
 * Extracts Key, Certificate, and CA Bundle from a PFX/P12 file buffer
 */
export const extractFromPFX = (
  pfxBuffer: ArrayBuffer, 
  password: string, 
  outputKeyPassword?: string
): ParsedPFX => {
  try {
    const p12Der = forge.util.createBuffer(pfxBuffer);
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    
    // Decrypt PFX
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, password);

    let keyPem: string | null = null;
    let certPem: string | null = null;
    const caPems: string[] = [];

    // Iterate through safe bags to find keys and certificates
    // p12.safeContent is an array of SafeContent structures
    // Each SafeContent contains an array of SafeBags
    for (const safeContent of p12.safeContents) {
      for (const safeBag of safeContent.safeBags) {
        // If it's a key bag (PKCS#8 shrouded or simple key)
        if (safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag || safeBag.type === forge.pki.oids.keyBag) {
            if (safeBag.key) {
                if (outputKeyPassword) {
                    // Encrypt the key with the new password (PKCS#8)
                    const encryptedKey = forge.pki.encryptPrivateKey(safeBag.key, outputKeyPassword, {
                        algorithm: 'aes256',
                    });
                    keyPem = forge.pki.encryptedPrivateKeyToPem(encryptedKey);
                } else {
                    // Standard unencrypted PEM
                    keyPem = forge.pki.privateKeyToPem(safeBag.key);
                }
            }
        } 
        // If it's a certificate bag
        else if (safeBag.type === forge.pki.oids.certBag) {
          if (safeBag.cert) {
            const pem = forge.pki.certificateToPem(safeBag.cert);
            
            // Heuristic to distinguish Leaf Cert from CA:
            // This is basic; in reality, we should build a chain. 
            // Here we assume the first one found or one with a matching localKeyId is the leaf, others are CA.
            // For simplicity in this demo: First cert is treated as Main, subsequent as CAs unless we can match localKeyId.
            // A better way is to check if it has a matching private key, but the key might be in a different bag.
            
            if (!certPem) {
                certPem = pem;
            } else {
                caPems.push(pem);
            }
          }
        }
      }
    }

    return {
      key: keyPem,
      cert: certPem,
      ca: caPems.length > 0 ? caPems.join('\n') : null,
    };
  } catch (error: any) {
    if (error.message && error.message.includes('password')) {
       throw new Error("Invalid password or corrupted file.");
    }
    throw new Error("Failed to parse PFX: " + (error instanceof Error ? error.message : String(error)));
  }
};

/**
 * Creates a PFX/P12 file from PEM encoded components
 */
export const createPFX = (
  keyPem: string,
  certPem: string,
  caPem: string | null,
  password: string
): string => {
  try {
    // Parse Private Key
    const privateKey = forge.pki.privateKeyFromPem(keyPem);
    
    // Parse Certificate
    const cert = forge.pki.certificateFromPem(certPem);
    
    // Parse Chain (if any)
    const chain: forge.pki.Certificate[] = [];
    chain.push(cert);

    if (caPem) {
        // Split concatenation if multiple CAs
        // Simple split by END CERTIFICATE
        const caBlocks = caPem.split('-----END CERTIFICATE-----');
        for (const block of caBlocks) {
            const trimmed = block.trim();
            if (trimmed) {
                try {
                    const caCert = forge.pki.certificateFromPem(trimmed + '\n-----END CERTIFICATE-----');
                    chain.push(caCert);
                } catch (e) {
                    // Ignore invalid blocks/newlines
                }
            }
        }
    }

    // Create PFX
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
        privateKey,
        chain,
        password,
        {
            algorithm: '3des', // Triple DES is standard for max compatibility, though AES is newer
            generateLocalKeyId: true,
            friendlyName: 'CertSmith Export'
        }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    // Return binary string (React will handle download as blob)
    return p12Der;
    
  } catch (error) {
    throw new Error("Failed to generate PFX. Ensure your Private Key and Certificate match and are valid PEM format.");
  }
};

/**
 * Converts a binary string to a Unit8Array for Blob creation
 */
export const binaryStringToUint8Array = (binaryString: string): Uint8Array => {
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}