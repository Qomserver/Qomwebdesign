(function(window, document) {
    'use strict';

    const GGLCT_SYSTEM_CONFIG = {
        version: '2.1.0',
        securityServiceUrl: 'https://gglguard.ir/app/security.php',
        adPlaceholderSelector: '#gglct-ad-placeholder',
        clientIdentifierHeaderName: 'X-GGLCT-Client-Request',
        clientIdentifierHeaderValue: 'GGLCT-PowerScript-Client/1.0',
        nonceHeaderName: 'X-GGLCT-Nonce',
        sharedSecretKeyForVerification: 'ChangeThisToYourVeryStrongAndUniqueSecretKey_GGLCT_2025_XYZ',
        checkInterval: 30000,
        maxRetries: 3,
        retryDelay: 5000,
        debugMode: false
    };

    let systemState = {
        initialized: false,
        retryCount: 0,
        tokenPayload: null,
        signature: null,
        verificationTimer: null,
        adRendered: false
    };

    function gglctLog(message, type = 'info') {
        if (GGLCT_SYSTEM_CONFIG.debugMode || type === 'error' || type === 'warn') {
            console[type]('[GGLCT System]', message);
        }
    }

    async function gglctGenerateHmacSha256(dataObject, secret) {
        const sortedKeys = Object.keys(dataObject).sort();
        let queryString = '';
        
        for (const key of sortedKeys) {
            if (key === 'ad_html') continue;
            if (queryString !== '') {
                queryString += '&';
            }
            queryString += `${encodeURIComponent(key)}=${encodeURIComponent(dataObject[key])}`;
        }

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

    function gglctDecodeBase64(base64String) {
        try {
            return window.atob(base64String);
        } catch (e) {
            gglctLog('Error decoding base64 content: ' + e.message, 'error');
            return '<p>Error displaying content.</p>';
        }
    }

    async function gglctFetchAdData() {
        gglctLog('Fetching advertising and security data...');
        
        const nonce = gglctGenerateNonce();
        const headers = new Headers();
        
        headers.append('Accept', 'application/json');
        headers.append(GGLCT_SYSTEM_CONFIG.clientIdentifierHeaderName, GGLCT_SYSTEM_CONFIG.clientIdentifierHeaderValue);
        headers.append(GGLCT_SYSTEM_CONFIG.nonceHeaderName, nonce);
        
        try {
            const response = await fetch(GGLCT_SYSTEM_CONFIG.securityServiceUrl, {
                method: 'GET',
                headers: headers,
                cache: 'no-store'
            });

            if (!response.ok) {
                const errorText = await response.text();
                gglctLog(`Server error: ${response.status}. Response: ${errorText}`, 'error');
                return null;
            }

            const data = await response.json();
            
            if (!data || data.status !== 'success' || !data.payload || !data.signature) {
                gglctLog('Invalid data structure received from security service', 'error');
                return null;
            }

            if (data.payload.nonce !== nonce) {
                gglctLog('Nonce mismatch in response. Security risk detected.', 'error');
                return null;
            }

            if (data.payload.exp < Math.floor(Date.now() / 1000)) {
                gglctLog('Received expired security token', 'warn');
                return null;
            }

            const calculatedSignature = await gglctGenerateHmacSha256(
                data.payload, 
                GGLCT_SYSTEM_CONFIG.sharedSecretKeyForVerification
            );
            
            if (calculatedSignature !== data.signature) {
                gglctLog('Signature verification failed. Data may have been tampered.', 'error');
                return null;
            }
            
            gglctLog('Security verification passed successfully');
            systemState.tokenPayload = data.payload;
            systemState.signature = data.signature;
            
            return data.payload;
            
        } catch (error) {
            gglctLog('Network or processing error: ' + error.message, 'error');
            return null;
        }
    }

    function gglctRenderAd(payload) {
        if (!payload || !payload.ad_html) {
            gglctLog('No advertisement content to render', 'error');
            return false;
        }

        const adPlaceholder = document.querySelector(GGLCT_SYSTEM_CONFIG.adPlaceholderSelector);
        
        if (!adPlaceholder) {
            gglctLog(`Ad placeholder "${GGLCT_SYSTEM_CONFIG.adPlaceholderSelector}" not found in DOM`, 'error');
            return false;
        }

        const adHtml = gglctDecodeBase64(payload.ad_html);
        adPlaceholder.innerHTML = adHtml;
        
        const adElement = document.getElementById(payload.ad_id);
        
        if (!adElement) {
            gglctLog('Ad element not found after rendering', 'error');
            return false;
        }
        
        setTimeout(() => {
            adElement.style.opacity = '1';
            adElement.style.transform = 'translateY(0)';
        }, 100);
        
        systemState.adRendered = true;
        gglctLog('Advertisement rendered successfully');
        
        return true;
    }

    function gglctLockSystem(message, errorCode = 'INTEGRITY_VIOLATION') {
        gglctLog(`System locked: ${message} (Code: ${errorCode})`, 'error');
        
        if (systemState.verificationTimer) {
            clearInterval(systemState.verificationTimer);
            systemState.verificationTimer = null;
        }
        
        systemState.initialized = false;
        
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
        
        const errorEvent = new CustomEvent('gglctSystemError', { 
            detail: { 
                message: message, 
                code: errorCode 
            } 
        });
        
        document.dispatchEvent(errorEvent);
        
        if (typeof window.stop === 'function') {
            window.stop();
        } else if (typeof document.execCommand === 'function') {
            try { document.execCommand('Stop'); } catch(e) {}
        }
    }

    async function gglctVerifyIntegrity() {
        if (!systemState.initialized || !systemState.tokenPayload) {
            gglctLog('System not fully initialized for integrity check', 'warn');
            return false;
        }

        if (!systemState.adRendered) {
            gglctLog('Advertisement not rendered yet', 'warn');
            return false;
        }

        const payload = systemState.tokenPayload;
        const adElement = document.getElementById(payload.ad_id);
        
        if (!adElement) {
            gglctLog('Ad element missing from DOM during integrity check', 'error');
            return false;
        }

        const titleElement = adElement.querySelector('.' + payload.wm_class + '-title');
        if (!titleElement) {
            gglctLog('Ad title element missing during integrity check', 'error');
            return false;
        }

        const imageElement = adElement.querySelector('.' + payload.wm_class + '-img');
        if (!imageElement || imageElement.src !== payload.ad_image_src) {
            gglctLog('Ad image missing or modified during integrity check', 'error');
            return false;
        }

        return true;
    }

    async function gglctRunIntegrityVerification() {
        const isIntact = await gglctVerifyIntegrity();
        
        if (!isIntact) {
            gglctLockSystem('یکپارچگی سیستم در بررسی دوره‌ای رد شد. محتوای ضروری دستکاری شده یا حذف شده است.', 'INTEGRITY_FAIL_PERIODIC');
            return false;
        }
        
        return true;
    }

    async function gglctFetchWithRetries() {
        let payload = null;
        systemState.retryCount = 0;
        
        while (systemState.retryCount < GGLCT_SYSTEM_CONFIG.maxRetries && !payload) {
            payload = await gglctFetchAdData();
            
            if (payload) return payload;
            
            systemState.retryCount++;
            
            if (systemState.retryCount < GGLCT_SYSTEM_CONFIG.maxRetries) {
                const delay = GGLCT_SYSTEM_CONFIG.retryDelay * systemState.retryCount;
                gglctLog(`Retrying data fetch (${systemState.retryCount}/${GGLCT_SYSTEM_CONFIG.maxRetries}) in ${delay/1000}s...`, 'warn');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        return null;
    }

    async function gglctInitializeSystem() {
        gglctLog(`Initializing GGLCT System v${GGLCT_SYSTEM_CONFIG.version}...`);
        
        const adData = await gglctFetchWithRetries();
        
        if (!adData) {
            gglctLockSystem('عدم امکان برقراری ارتباط با سرویس امنیتی یا دریافت داده‌های نامعتبر.', 'SERVICE_UNREACHABLE');
            return;
        }
        
        const renderSuccess = gglctRenderAd(adData);
        
        if (!renderSuccess) {
            gglctLockSystem('خطا در نمایش بخش‌های ضروری سیستم.', 'RENDER_FAILURE');
            return;
        }
        
        const integrityPassed = await gglctVerifyIntegrity();
        
        if (!integrityPassed) {
            gglctLockSystem('یکپارچگی سیستم تایید نشد. محتوای ضروری دستکاری شده یا حذف شده است.', 'INTEGRITY_FAIL_INITIAL');
            return;
        }
        
        systemState.initialized = true;
        gglctLog('GGLCT System initialized successfully');
        
        const randomJitter = Math.floor(Math.random() * 5000);
        systemState.verificationTimer = setInterval(
            gglctRunIntegrityVerification, 
            GGLCT_SYSTEM_CONFIG.checkInterval + randomJitter
        );
        
        const readyEvent = new CustomEvent('gglctSystemReady', { 
            detail: { 
                payload: systemState.tokenPayload, 
                signature: systemState.signature 
            } 
        });
        
        document.dispatchEvent(readyEvent);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', gglctInitializeSystem);
    } else {
        gglctInitializeSystem();
    }

    window.GGLCT_System = {
        version: GGLCT_SYSTEM_CONFIG.version,
        isInitialized: () => systemState.initialized,
        getCurrentPayload: () => systemState.tokenPayload ? {...systemState.tokenPayload} : null,
        getSecurityToken: () => {
            if (systemState.initialized && 
                systemState.tokenPayload && 
                systemState.tokenPayload.exp > Math.floor(Date.now() / 1000)) {
                return systemState.tokenPayload.security_token || null;
            }
            return null;
        },
        forceIntegrityCheck: async () => {
            if (!systemState.initialized) return false;
            const intact = await gglctVerifyIntegrity();
            if (!intact) {
                gglctLockSystem('یکپارچگی سیستم در بررسی دستی رد شد.', 'INTEGRITY_FAIL_MANUAL');
            }
            return intact;
        }
    };

})(window, document);
