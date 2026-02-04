/**
 * True Hours Concierge - Verification Badge Embed Script
 * 
 * Usage: Add this script to your website's HTML:
 * Use the auto-detect version (detects domain automatically):
 * <script src="https://truehoursconcierge.com/embed/truehours-embed.js"></script>
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        apiBaseUrl: 'https://truehoursconcierge.com/api',
        verificationPageUrl: 'https://truehoursconcierge.com/sitecheck',
        badgeSize: 80, // Size of the floating badge in pixels
        badgePosition: 'bottom-right', // Options: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
        zIndex: 999999
    };

    // Get the current script element to read data attributes
    const currentScript = document.currentScript || document.querySelector('script[src*="truehours-embed.js"]');
    const clientKey = currentScript ? currentScript.getAttribute('data-client-key') : null;

    // Detect the current domain
    const currentDomain = window.location.hostname.replace(/^www\./, '');

    // State
    let clientData = null;
    let badgeElement = null;

    /**
     * Fetch client verification data from the API
     */
    async function fetchClientData() {
        try {
            const endpoint = clientKey 
                ? `${CONFIG.apiBaseUrl}/verify?key=${encodeURIComponent(clientKey)}`
                : `${CONFIG.apiBaseUrl}/verify?domain=${encodeURIComponent(currentDomain)}`;

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                console.warn('[True Hours] Verification data not found for this domain');
                return null;
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('[True Hours] Failed to fetch verification data:', error);
            return null;
        }
    }

    /**
     * Generate the SVG badge with dynamic date
     */
    function generateBadgeSVG(lastCheckedDate) {
        const date = new Date(lastCheckedDate);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const formattedDate = `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;

        // Simplified compact badge SVG (you can replace this with your actual curved_badge.svg content)
        return `
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                <circle cx="512" cy="512" r="480" fill="#0A253E" />
                <circle cx="512" cy="512" r="400" fill="#E8E8E7" />
                <path d="M300 500 L450 650 L750 350" fill="none" stroke="#166640" stroke-width="60" stroke-linecap="round" stroke-linejoin="round" />
                <path id="textCurve" d="M 312,750 A 250,250 0 0 0 712,750" fill="none" />
                <text font-family="Arial, sans-serif" font-size="52" fill="#0A253E" text-anchor="middle">
                    <textPath href="#textCurve" startOffset="50%">
                        Checked: ${formattedDate}
                    </textPath>
                </text>
            </svg>
        `;
    }

    /**
     * Create and inject the floating badge
     */
    function createBadge() {
        if (!clientData) return;

        // Create badge container
        badgeElement = document.createElement('div');
        badgeElement.id = 'truehours-verification-badge';
        badgeElement.setAttribute('role', 'button');
        badgeElement.setAttribute('aria-label', 'View verification details');
        badgeElement.setAttribute('tabindex', '0');

        // Position styles
        const positionStyles = {
            'bottom-right': 'bottom: 20px; right: 20px;',
            'bottom-left': 'bottom: 20px; left: 20px;',
            'top-right': 'top: 20px; right: 20px;',
            'top-left': 'top: 20px; left: 20px;'
        };

        // Apply styles
        badgeElement.style.cssText = `
            position: fixed;
            ${positionStyles[CONFIG.badgePosition]}
            width: ${CONFIG.badgeSize}px;
            height: ${CONFIG.badgeSize}px;
            cursor: pointer;
            z-index: ${CONFIG.zIndex};
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: white;
            padding: 4px;
        `;

        // Add SVG content
        badgeElement.innerHTML = generateBadgeSVG(clientData.LastCheckedDateTime);

        // Hover effect
        badgeElement.addEventListener('mouseenter', () => {
            badgeElement.style.transform = 'scale(1.1)';
            badgeElement.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.25)';
        });

        badgeElement.addEventListener('mouseleave', () => {
            badgeElement.style.transform = 'scale(1)';
            badgeElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        });

        // Click handler - opens verification page
        badgeElement.addEventListener('click', openVerificationPopup);
        badgeElement.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                openVerificationPopup();
            }
        });

        // Inject into page
        document.body.appendChild(badgeElement);
    }

    /**
     * Open the verification popup/modal
     */
    function openVerificationPopup() {
        const domain = clientKey || currentDomain;
        const popupUrl = `${CONFIG.verificationPageUrl}?domain=${encodeURIComponent(domain)}`;

        // Option 1: Open in a centered popup window
        const width = 450;
        const height = 650;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        window.open(
            popupUrl,
            'TrueHoursVerification',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        // Option 2: Alternative - Open in an iframe modal (uncomment to use)
        // createIframeModal(popupUrl);
    }

    /**
     * Alternative: Create an iframe modal overlay (instead of popup window)
     */
    function createIframeModal(url) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            z-index: ${CONFIG.zIndex + 1};
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease;
        `;

        // Create iframe container
        const container = document.createElement('div');
        container.style.cssText = `
            position: relative;
            width: 90%;
            max-width: 450px;
            height: 90%;
            max-height: 650px;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `;

        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 32px;
            height: 32px;
            border: none;
            background: rgba(0, 0, 0, 0.5);
            color: white;
            font-size: 24px;
            border-radius: 50%;
            cursor: pointer;
            z-index: 1;
            line-height: 1;
        `;
        closeBtn.onclick = () => document.body.removeChild(overlay);

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
        `;

        container.appendChild(closeBtn);
        container.appendChild(iframe);
        overlay.appendChild(container);

        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        });

        document.body.appendChild(overlay);
    }

    /**
     * Initialize the embed script
     */
    async function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        console.log('[True Hours] Initializing verification badge...');

        // Fetch client data
        clientData = await fetchClientData();

        if (!clientData) {
            console.warn('[True Hours] No verification data available. Badge will not be displayed.');
            return;
        }

        // Create and display badge
        createBadge();

        console.log('[True Hours] Verification badge loaded successfully');
    }

    // Start initialization
    init();

})();
