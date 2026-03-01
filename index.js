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
    const dot = document.getElementById('keep-alive-dot');
    if (dot) {
        dot.style.backgroundColor = active ? '#4caf50' : '#888';
        dot.title = active ? 'Keep Alive: Active' : 'Keep Alive: Inactive';
    }
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
                    State is saved across sessions.
                </p>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(settingsHtml);

    $('#keep-alive-toggle').on('click', onToggle);

    // Auto-start if previously enabled
    if (getEnabled()) {
        startKeepAlive();
    }

    updateButtonState();
});
