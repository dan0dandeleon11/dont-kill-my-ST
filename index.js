// Keep Alive (Mobile) - SillyTavern Extension
// Prevents mobile browsers (Huawei/Honor/etc.) from killing the tab
// by maintaining a looping silent audio session.

import { extension_settings, getContext } from '../../../extensions.js';

const extensionName = 'keep-alive';
const extensionFolder = `scripts/extensions/third-party/${extensionName}`;
const localStorageKey = 'keepAlive_enabled';

let audioElement = null;
let isActive = false;
let autoplayListenerAttached = false;

function getEnabled() {
    return localStorage.getItem(localStorageKey) === 'true';
}

function setEnabled(val) {
    localStorage.setItem(localStorageKey, val ? 'true' : 'false');
}

function createFloatingIndicator() {
    if (document.getElementById('keep-alive-floating')) return;

    const floater = document.createElement('div');
    floater.id = 'keep-alive-floating';
    floater.title = 'Keep Alive: Inactive';
    floater.innerHTML = '&#x1f50a;'; // speaker emoji

    Object.assign(floater.style, {
        position: 'fixed',
        bottom: '12px',
        left: '12px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'rgba(80, 80, 80, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '15px',
        zIndex: '99999',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: '2px solid transparent',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
    });

    // Tap the floater to toggle too
    floater.addEventListener('click', (e) => {
        e.stopPropagation();
        onToggle();
    });

    document.body.appendChild(floater);
}

function startKeepAlive() {
    if (audioElement) return;

    audioElement = new Audio(`/${extensionFolder}/silence.mp3`);
    audioElement.loop = true;
    audioElement.volume = 0;

    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isActive = true;
            updateIndicator(true);
            console.log('[Keep Alive] Silent audio loop started.');
        }).catch((err) => {
            console.warn('[Keep Alive] Autoplay blocked, waiting for user interaction...', err);
            waitForInteraction();
        });
    }
}

function stopKeepAlive() {
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
        audioElement = null;
    }
    isActive = false;
    updateIndicator(false);
    console.log('[Keep Alive] Stopped.');
}

function waitForInteraction() {
    if (autoplayListenerAttached) return;
    autoplayListenerAttached = true;

    const handler = () => {
        document.removeEventListener('click', handler);
        document.removeEventListener('touchstart', handler);
        autoplayListenerAttached = false;
        if (getEnabled() && !isActive) {
            startKeepAlive();
        }
    };

    document.addEventListener('click', handler, { once: false });
    document.addEventListener('touchstart', handler, { once: false });
}

function updateIndicator(active) {
    // Settings panel dot
    const dot = document.getElementById('keep-alive-dot');
    if (dot) {
        dot.style.backgroundColor = active ? '#4caf50' : '#888';
        dot.title = active ? 'Keep Alive: Active' : 'Keep Alive: Inactive';
    }

    // Floating indicator
    const floater = document.getElementById('keep-alive-floating');
    if (floater) {
        if (active) {
            floater.innerHTML = '&#x1f50a;'; // speaker with sound
            floater.style.backgroundColor = 'rgba(76, 175, 80, 0.85)';
            floater.style.border = '2px solid #81c784';
            floater.style.animation = 'keepAlivePulse 2s ease-in-out infinite';
            floater.title = 'Keep Alive: Active (tap to stop)';
        } else if (getEnabled()) {
            // Enabled but waiting for interaction
            floater.innerHTML = '&#x23f3;'; // hourglass
            floater.style.backgroundColor = 'rgba(255, 183, 77, 0.85)';
            floater.style.border = '2px solid #ffcc80';
            floater.style.animation = 'none';
            floater.title = 'Keep Alive: Waiting for tap...';
        } else {
            floater.innerHTML = '&#x1f507;'; // muted speaker
            floater.style.backgroundColor = 'rgba(80, 80, 80, 0.6)';
            floater.style.border = '2px solid transparent';
            floater.style.animation = 'none';
            floater.title = 'Keep Alive: Off (tap to start)';
        }
    }
}

function injectStyles() {
    if (document.getElementById('keep-alive-styles')) return;
    const style = document.createElement('style');
    style.id = 'keep-alive-styles';
    style.textContent = `
        @keyframes keepAlivePulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.5); }
            50% { box-shadow: 0 0 0 8px rgba(76, 175, 80, 0); }
        }
    `;
    document.head.appendChild(style);
}

function onToggle() {
    const enabled = getEnabled();
    if (enabled) {
        setEnabled(false);
        stopKeepAlive();
    } else {
        setEnabled(true);
        startKeepAlive();
    }
    updateButtonState();
}

function updateButtonState() {
    const btn = document.getElementById('keep-alive-toggle');
    if (btn) {
        btn.classList.toggle('active', getEnabled());
    }
    updateIndicator(isActive);
}

jQuery(async () => {
    // Inject pulse animation CSS
    injectStyles();

    const settingsHtml = `
    <div id="keep-alive-settings" class="extension_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Keep Alive (Mobile)</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
            </div>
            <div class="inline-drawer-content">
                <div style="display:flex;align-items:center;gap:8px;margin:8px 0;">
                    <button id="keep-alive-toggle" class="menu_button" title="Toggle Keep Alive">
                        <span style="display:flex;align-items:center;gap:6px;">
                            <span id="keep-alive-dot" style="
                                width:10px;height:10px;border-radius:50%;
                                background-color:#888;display:inline-block;
                                transition:background-color 0.3s;
                            "></span>
                            Keep Alive
                        </span>
                    </button>
                </div>
                <p class="hint" style="font-size:0.85em;color:#aaa;">
                    Loops silent audio to prevent mobile browsers from suspending this tab.
                    State is saved across sessions. You can also tap the floating indicator
                    in the bottom-left corner to toggle.
                </p>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(settingsHtml);

    $('#keep-alive-toggle').on('click', onToggle);

    // Create the floating indicator on the main screen
    createFloatingIndicator();

    // Auto-start if previously enabled
    if (getEnabled()) {
        startKeepAlive();
    }

    updateButtonState();
});
