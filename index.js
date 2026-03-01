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
            updateIndicator();
            console.log('[Keep Alive] Silent audio loop started.');
        }).catch((err) => {
            console.warn('[Keep Alive] Autoplay blocked, waiting for user interaction...', err);
            updateIndicator();
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
    updateIndicator();
    console.log('[Keep Alive] Stopped.');
}

function waitForInteraction() {
    if (autoplayListenerAttached) return;
    autoplayListenerAttached = true;

    const handler = () => {
        document.removeEventListener('click', handler, true);
        document.removeEventListener('touchstart', handler, true);
        document.removeEventListener('touchend', handler, true);
        document.removeEventListener('keydown', handler, true);
        autoplayListenerAttached = false;
        if (getEnabled() && !isActive) {
            startKeepAlive();
        }
    };

    // Use capture phase so ST's stopPropagation can't block us
    document.addEventListener('click', handler, { capture: true, once: true });
    document.addEventListener('touchstart', handler, { capture: true, once: true });
    document.addEventListener('touchend', handler, { capture: true, once: true });
    document.addEventListener('keydown', handler, { capture: true, once: true });
}

function updateIndicator() {
    const dot = document.getElementById('keep-alive-dot');
    const label = document.getElementById('keep-alive-label');
    if (!dot) return;

    if (isActive) {
        dot.style.backgroundColor = '#4caf50';
        if (label) label.textContent = 'Keep Alive: ON';
    } else if (getEnabled()) {
        dot.style.backgroundColor = '#ffb74d';
        if (label) label.textContent = 'Keep Alive: Waiting for tap...';
    } else {
        dot.style.backgroundColor = '#888';
        if (label) label.textContent = 'Keep Alive: OFF';
    }
}

function onToggle() {
    if (getEnabled()) {
        setEnabled(false);
        stopKeepAlive();
    } else {
        setEnabled(true);
        startKeepAlive();
    }
    updateIndicator();
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
                <div style="display:flex;align-items:center;gap:8px;margin:10px 0;">
                    <button id="keep-alive-toggle" class="menu_button" title="Toggle Keep Alive">
                        <span style="display:flex;align-items:center;gap:8px;">
                            <span id="keep-alive-dot" style="
                                width:12px;height:12px;border-radius:50%;
                                background-color:#888;display:inline-block;
                                transition:background-color 0.3s;
                            "></span>
                            <span id="keep-alive-label">Keep Alive: OFF</span>
                        </span>
                    </button>
                </div>
                <p class="hint" style="font-size:0.85em;color:#aaa;margin-top:4px;">
                    Loops silent audio to prevent mobile browsers from suspending this tab.
                    <br>
                    <b style="color:#4caf50;">Green</b> = active &nbsp;
                    <b style="color:#ffb74d;">Orange</b> = waiting for first tap &nbsp;
                    <b style="color:#888;">Gray</b> = off
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

    updateIndicator();
});
