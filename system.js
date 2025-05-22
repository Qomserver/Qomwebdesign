// Filename: system.js
// GGLCT Universal System Integrity and Ad Loader
// Version 2.0.0

(function(window, document) {
    'use strict';

    const GGLCT_SYSTEM_CONFIG = {        securityServiceUrl: 'https://gglguard.ir/app/security.php', // آدرس سرویس امنیتی شما
        adPlaceholderSelector: '#gglct-ad-placeholder', // شناسه یا سلکتور المانی که تبلیغات در آن قرار می‌گیرد
        clientIdentifierHeaderName: 'X-GGLCT-Client-Request',
        clientIdentifierHeaderValue: 'GGLCT-PowerScript-Client/1.0', // باید با security.php مچ باشد
        nonceHeaderName: 'X-GGLCT-Nonce',
        sharedSecretKeyForVerification: 'ChangeThisToYourVeryStrongAndUniqueSecretKey_GGLCT_2025_XYZ', // *** بسیار مهم: این باید با GGLCT_SHARED_SECRET_KEY در security.php یکی باشد ***        checkInterval: 30000, // 30 ثانیه
        maxRetries: 3,
        retryDelay: 5000, // 5 ثانیه
        debugMode: false // برای نمایش لاگ‌های بیشتر در کنسول
    };

    let currentRetryCount = 0;
    let systemInitialized = false;
    let activeTokenPayload = null;
    let activeSignature = null;

    function gglctLog(message, type = 'info') {
        if (GGLCT_SYSTEM_CONFIG.debugMode || type === 'error' || type === 'warn') {
            console[type]('[GGLCT System]', message);
        }
    }

    async function gglctGenerateHmacSha256(dataObject, secret) {
        const sortedKeys = Object.keys(dataObject).sort();
        let queryString = '';        for (const key of sortedKeys) {
            if (queryString !== '') {
                queryString += '&';
            }
            queryString += `${encodeURIComponent(key)}=${encodeURIComponent(dataObject[key])}`;        }

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            "raw",
            encoder.encode(secret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
        );
        const signatureBuffer = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(queryString)
        );
        return Array.from(new Uint8Array(signatureBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    
    function gglctGenerateNonce(length = 32) {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    function gglctDecompressAndDecode(base64CompressedString) {
        try {
            const binaryString = window.atob(base64CompressedString);
            const charData = binaryString.split('').map(function(x){return x.charCodeAt(0);});
            const byteArray = new Uint8Array(charData);

            // Basic GZIP header check (very rudimentary)
            if (byteArray[0] !== 0x1f || byteArray[1] !== 0x8b) {
                 gglctLog('Data does not appear to be GZIP compressed (header mismatch). Trying direct base64 decode.', 'warn');
                 // Fallback to just base64 decoding if not gzipped (or if pako is not available/fails)
                 return window.atob(base64CompressedString); // This assumes the server might send uncompressed base64 if gzcompress fails
            }

            // For full GZIP decompression in browser, a library like pako.js is typically needed.
            // Browsers don't have native GZIP decompression for arbitrary strings.
            // For simplicity here, we'll assume the content is small enough that base64 is the primary concern,
            // or that you'd integrate pako.js if large HTML is frequently sent.
            // This is a placeholder for actual decompression.
            // If pako.js is available:
            // if (typeof pako !== 'undefined') {
            //     const decompressed = pako.inflate(byteArray, { to: 'string' });
            //     return decompressed;
            // } else {
            //     gglctLog('pako.js not found for GZIP decompression. Displaying raw (but base64 decoded) content.', 'warn');
                 return "GZIP Decompression requires pako.js. Content is base64 encoded."; // Placeholder
            // }
            // Simplified: Assuming the server might not always compress, or compression is light.
            // The PHP side uses gzcompress, which is zlib. pako can handle zlib.            // For this example to work without external libs, let's assume the server sends plain base64 if no compression,
            // and for compressed, we'd need pako. Let's adjust the PHP to not compress for this basic example.
            // Or, for a real solution, include pako.js.
            // For now, we'll just decode base64.
             return window.atob(base64CompressedString);

        } catch (e) {
            gglctLog('Error decompressing/decoding ad HTML: ' + e.message, 'error');
            return '<p style="color:red;">Error displaying ad content.</p>';
        }
    }


    async function gglctFetchAdData() {
        gglctLog('Fetching ad data...');
        const nonce = gglctGenerateNonce();
        try {
            const response = await fetch(GGLCT_SYSTEM_CONFIG.securityServiceUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    [GGLCT_SYSTEM_CONFIG.clientIdentifierHeaderName]: GGLCT_SYSTEM_CONFIG.clientIdentifierHeaderValue,
                    [GGLCT_SYSTEM_CONFIG.nonceHeaderName]: nonce
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                gglctLog(`Failed to fetch ad data. Status: ${response.status}. Response: ${errorText}`, 'error');
                return null;
            }

            const data = await response.json();
            gglctLog('Ad data received:', data);

            if (data.status === 'success' && data.payload && data.signature) {
                const calculatedSignature = await gglctGenerateHmacSha256(data.payload, GGLCT_SYSTEM_CONFIG.sharedSecretKeyForVerification);
                if (calculatedSignature === data.signature) {
                    if (data.payload.nonce !== nonce) {
                        gglctLog('Nonce mismatch in response. Potential replay attack.', 'error');
                        return null; // Nonce returned by server should match the one we sent
                    }
                    if (data.payload.exp < Math.floor(Date.now() / 1000)) {
                        gglctLog('Received token is expired.', 'warn');
                        return null;
                    }
                    gglctLog('Signature verified successfully.');
                    activeTokenPayload = data.payload;
                    activeSignature = data.signature;
                    return data.payload;                } else {
                    gglctLog('Signature verification failed. Data may have been tampered.', 'error');
                    gglctLog('Expected signature for payload:', data.payload);
                    gglctLog('Calculated signature:', calculatedSignature);
                    gglctLog('Received signature:', data.signature);

                    return null;
                }            } else {
                gglctLog('Invalid data structure received from security service.', 'error');
                return null;
            }
        } catch (error) {
            gglctLog('Network error or exception fetching ad data: ' + error.message, 'error');
            return null;
        }
    }

    function gglctRenderAd(payload) {
        const adPlaceholder = document.querySelector(GGLCT_SYSTEM_CONFIG.adPlaceholderSelector);
        if (!adPlaceholder) {
            gglctLog(`Ad placeholder "${GGLCT_SYSTEM_CONFIG.adPlaceholderSelector}" not found.`, 'error');
            return false;
        }

        // const adHtml = gglctDecompressAndDecode(payload.ad_html); // Requires pako for gzdecode
        // For now, let's assume PHP sends uncompressed base64 for simplicity if pako is not used
        const adHtml = window.atob(payload.ad_html); // Use this if PHP does not gzcompress or only base64_encodes

        adPlaceholder.innerHTML = adHtml;
        const adElement = document.getElementById(payload.ad_id);
        if (adElement) {
            setTimeout(() => { // For CSS transition
                adElement.style.opacity = '1';
                adElement.style.transform = 'translateY(0)';
            }, 50);
        }
        gglctLog('Ad rendered successfully.');
        return true;    }

    function gglctShowSystemError(message, errorCode = 'GENERIC_ERROR') {
        gglctLog(`System lockdown triggered: ${message} (Code: ${errorCode})`, 'error');
        document.body.innerHTML = `
            <div style="position:fixed; top:0; left:0; width:100%; height:100%; background-color:rgba(15, 23, 42, 0.98); color:#ef4444; display:flex; flex-direction:column; justify-content:center; align-items:center; z-index:9999999; text-align:center; padding:30px; font-family: Arial, sans-serif; box-sizing: border-box;">
                <div style="font-size: 4.5em; margin-bottom: 25px;">⚠️</div>
                <h3 style="color:#ef4444; margin-bottom:15px; font-size:2em; text-shadow:0 0 10px #ef4444;">خطای یکپارچگی سیستم</h3>
                <p style="margin-bottom:10px; line-height:1.7; color:#e2e8f0; font-size: 1.2em;">${message}</p>
                <p style="margin-bottom:10px; line-height:1.7; color:#e2e8f0; font-size: 1.2em;">برای استفاده از این ابزار، لطفاً از نسخه اصلی و دستکاری‌نشده استفاده نمایید یا با پشتیبانی تماس بگیرید.</p>
                <small style="font-size:0.8em; color:#94a3b8; margin-top:15px;">GGLCT Security Module. Ref: ${errorCode}</small>
            </div>
        `;
        document.body.style.overflow = 'hidden';
        if (window.gglctSystemInterval) {
            clearInterval(window.gglctSystemInterval);
        }
        // Attempt to stop further script execution on the page if possible
        if (typeof window.stop === 'function') {
            window.stop();
        } else if (typeof document.execCommand === 'function') {            try { document.execCommand('Stop'); } catch(e) {}
        }
    }

    async function gglctVerifyIntegrity() {
        if (!activeTokenPayload || !activeSignature) {
            gglctLog('Initial token/payload not available for integrity check.', 'warn');
            return false; // Not initialized yet or fetch failed
        }

        const adElement = document.getElementById(activeTokenPayload.ad_id);
        if (!adElement) {
            gglctLog('Ad element not found in DOM.', 'error');
            return false;
        }

        // Check if crucial elements from ad_html are still present (simple check)
        const titleElement = adElement.querySelector('.' + activeTokenPayload.wm_class + '-title');
        if (!titleElement || !titleElement.textContent.includes('انقلاب کسب‌وکار')) {
            gglctLog('Ad title content seems altered or missing.', 'error');
            return false;
        }

        const adImageElement = adElement.querySelector('.' + activeTokenPayload.wm_class + '-img');
        if (!adImageElement || adImageElement.src !== activeTokenPayload.ad_image_src) {
            gglctLog('Ad image source seems altered or missing.', 'error');
            return false;
        }
        
        // Re-verify signature against current payload (if needed, but payload is from server)
        // For now, we trust the initial signature verification was enough for the payload itself.
        // The main check here is if the DOM elements corresponding to the payload exist.

        gglctLog('DOM integrity check passed for ad element.', 'info');
        return true;
    }


    async function gglctInitializeSystem() {
        gglctLog('Initializing GGLCT System...');
        currentRetryCount = 0;

        const adDataPayload = await gglctFetchAdDataWithRetries();

        if (!adDataPayload) {
            gglctShowSystemError('عدم امکان برقراری ارتباط با سرویس امنیتی یا دریافت داده‌های نامعتبر.', 'SERVICE_UNREACHABLE_OR_INVALID_DATA');
            return;
        }

        const adRendered = gglctRenderAd(adDataPayload);
        if (!adRendered) {
            gglctShowSystemError('خطا در نمایش بخش‌های ضروری سیستم. ممکن است ساختار صفحه تغییر کرده باشد.', 'AD_RENDER_FAIL');
            return;
        }

        const integrityCheckPassed = await gglctVerifyIntegrity();
        if (!integrityCheckPassed) {
            gglctShowSystemError('یکپارچگی سیستم تایید نشد. محتوای ضروری دستکاری شده یا حذف شده است.', 'INTEGRITY_FAIL_INITIAL');
            return;
        }

        systemInitialized = true;
        gglctLog('GGLCT System Initialized Successfully.');

        window.gglctSystemInterval = setInterval(async () => {
            if (!systemInitialized) return;
            gglctLog('Performing periodic integrity check...');
            const stillIntact = await gglctVerifyIntegrity();
            if (!stillIntact) {
                gglctShowSystemError('یکپارچگی سیستم در بررسی دوره‌ای رد شد. سیستم متوقف می‌شود.', 'INTEGRITY_FAIL_PERIODIC');
                clearInterval(window.gglctSystemInterval);
                systemInitialized = false;
            }
        }, GGLCT_SYSTEM_CONFIG.checkInterval + Math.floor(Math.random() * 5000)); // Add jitter
        
        // Expose a global function for other scripts to get the current valid token if needed
        window.GGLCT_getSecurityToken = function() {
            if (systemInitialized && activeTokenPayload && activeTokenPayload.exp > Math.floor(Date.now() / 1000)) {
                return activeSignature; // The signature acts as a token for this context
            }
            return null;
        };
        
        // Dispatch a custom event to notify that the system is ready
        const event = new CustomEvent('gglctSystemReady', { detail: { payload: activeTokenPayload, signature: activeSignature } });
        document.dispatchEvent(event);
    }

    async function gglctFetchAdDataWithRetries() {
        let payload = null;
        while (currentRetryCount < GGLCT_SYSTEM_CONFIG.maxRetries && !payload) {
            payload = await gglctFetchAdData();
            if (payload) {
                return payload;
            }
            currentRetryCount++;            if (currentRetryCount < GGLCT_SYSTEM_CONFIG.maxRetries) {
                gglctLog(`Retry ${currentRetryCount}/${GGLCT_SYSTEM_CONFIG.maxRetries} for fetching ad data in ${GGLCT_SYSTEM_CONFIG.retryDelay / 1000}s...`, 'warn');
                await new Promise(resolve => setTimeout(resolve, GGLCT_SYSTEM_CONFIG.retryDelay));
            }        }
        return null;
    }

    // --- Initialization ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', gglctInitializeSystem);
    } else {
        gglctInitializeSystem();
    }

    // Add a global reference to GGLCT for potential external interaction or debugging
    window.GGLCT_System = {
        config: GGLCT_SYSTEM_CONFIG,
        isInitialized: () => systemInitialized,
        getCurrentPayload: () => activeTokenPayload,
        forceIntegrityCheck: async () => {
            if (!systemInitialized) return false;
            const intact = await gglctVerifyIntegrity();
            if (!intact) {
                gglctShowSystemError('یکپارچگی سیستم در بررسی دستی رد شد.', 'INTEGRITY_FAIL_MANUAL');
            }
            return intact;
        }    };

})(window, document);
