/**
 * Utility for encrypting and decrypting profile data using Web Crypto API.
 */

const ITERATIONS = 100000;
const KEY_LEN = 256;
const SALT_LEN = 16;
const IV_LEN = 12;

/**
 * Derives an encryption key from a password and salt.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new Uint8Array(salt), // Ensure it's not a SharedArrayBuffer
            iterations: ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: KEY_LEN },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts data using AES-GCM with a PBKDF2-derived key.
 * Output format: base64(salt + iv + ciphertext)
 */
export async function encryptData(data: string, password: string): Promise<string> {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));

    const key = await deriveKey(password, salt);
    const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
    );

    const combined = new Uint8Array(SALT_LEN + IV_LEN + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LEN);
    combined.set(new Uint8Array(ciphertext), SALT_LEN + IV_LEN);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data encrypted by {@link encryptData}.
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<string> {
    const combined = new Uint8Array(
        atob(encryptedBase64)
            .split('')
            .map(c => c.charCodeAt(0))
    );

    const salt = combined.slice(0, SALT_LEN);
    const iv = combined.slice(SALT_LEN, SALT_LEN + IV_LEN);
    const ciphertext = combined.slice(SALT_LEN + IV_LEN);

    const key = await deriveKey(password, salt);
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Validates the password according to the rules:
 * - 6-18 characters
 * - Includes numbers, capital letters, and symbols
 */
export function validatePassword(password: string): string | null {
    if (password.length < 6 || password.length > 18) {
        return "Password must be 6-18 characters long.";
    }
    const hasNumber = /[0-9]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    if (!hasNumber) return "Password must contain at least one number.";
    if (!hasUpper) return "Password must contain at least one capital letter.";
    if (!hasSymbol) return "Password must contain at least one symbol.";

    return null;
}
