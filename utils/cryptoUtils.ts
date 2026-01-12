
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
 * Extracts Certificates from a P7B/PKCS#7 file buffer
 */
export const extractFromP7B = (p7bBuffer: ArrayBuffer): ParsedPFX => {
  const buffer = forge.util.createBuffer(p7bBuffer);
  let p7;

  // Try DER first (binary P7B)
  try {
      const asn1 = forge.asn1.fromDer(buffer);
      p7 = forge.pkcs7.messageFromAsn1(asn1);
  } catch (e) {
      // Try PEM (text P7B)
      try {
           const pemStr = buffer.toString();
           p7 = forge.pkcs7.messageFromPem(pemStr);
      } catch (e2) {
           throw new Error("Failed to parse P7B. Ensure it is a valid PKCS#7 file (DER or PEM).");
      }
  }

  // forge types for pkcs7 might be incomplete, casting to any to access certificates safely
  const certs = (p7 as any).certificates || [];
  
  if (!certs || certs.length === 0) {
      throw new Error("No certificates found in P7B file.");
  }

  const pemCerts = certs.map((c: any) => forge.pki.certificateToPem(c));
  
  // Return structure matching PFX, but with no private key
  return {
      key: null,
      cert: pemCerts[0] || null,
      ca: pemCerts.length > 1 ? pemCerts.slice(1).join('\n') : null
  };
};

/**
 * Verifies if a certificate PEM matches a private key PEM
 */
export const verifyCertKeyMatch = (certPem: string, keyPem: string, password?: string): boolean => {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    let privateKey: any;

    try {
      // Try unencrypted first
      privateKey = forge.pki.privateKeyFromPem(keyPem);
    } catch (e) {
      // Try encrypted if password provided
      if (password) {
        privateKey = forge.pki.decryptRsaPrivateKey(keyPem, password);
      } else {
        throw new Error("Private key is encrypted. Please provide a password.");
      }
    }

    if (!privateKey) throw new Error("Could not parse private key.");

    // Compare public keys
    // For RSA, compare modulus and exponent
    const certPubKey = cert.publicKey as any;
    
    // Derived public key from private key
    const derivedPubKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);

    const certPubKeyPem = forge.pki.publicKeyToPem(certPubKey);
    const derivedPubKeyPem = forge.pki.publicKeyToPem(derivedPubKey);

    return certPubKeyPem === derivedPubKeyPem;
  } catch (error: any) {
    throw new Error(error.message || "Failed to verify match.");
  }
};

/**
 * Creates a PFX/P12 file from PEM encoded components
 */
export const createPFX = (
  keyPem: string,
  certPem: string,
  caPem: string | null,
  password: string,
  friendlyName?: string
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
            algorithm: '3des', 
            generateLocalKeyId: true,
            friendlyName: friendlyName || 'CertSmith Export'
        }
    );

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    return p12Der;
    
  } catch (error) {
    throw new Error("Failed to generate PFX. Ensure your Private Key and Certificate match and are valid PEM format.");
  }
};

/**
 * Creates a P7B/PKCS#7 file from PEM encoded components (No Private Key)
 */
export const createP7B = (certPem: string, caPem: string | null): string => {
  try {
      const cert = forge.pki.certificateFromPem(certPem);
      const p7 = forge.pkcs7.createSignedData();
      p7.addCertificate(cert);
      
      if (caPem) {
           const caBlocks = caPem.split('-----END CERTIFICATE-----');
           for (const block of caBlocks) {
               const trimmed = block.trim();
               if (trimmed) {
                   try {
                      const caCert = forge.pki.certificateFromPem(trimmed + '\n-----END CERTIFICATE-----');
                      p7.addCertificate(caCert);
                   } catch(e) {}
               }
           }
      }
      
      return forge.pkcs7.messageToPem(p7);
  } catch (e) {
      throw new Error("Failed to create P7B: " + (e instanceof Error ? e.message : String(e)));
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
