// Keep Alive (Mobile) - SillyTavern Extension
// Prevents mobile browsers (Huawei/Honor/etc.) from killing the tab
// by maintaining a looping silent audio session.

import { extension_settings, getContext } from '../../../extensions.js';

const extensionName = 'keep-alive';
const extensionFolder = `scripts/extensions/third-party/${extensionName}`;
const localStorageKey = 'keepAlive_enabled';

let audioElement = null;
let isActive = false;

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
            // If it still fails, the user will see it stays OFF
            console.warn('[Keep Alive] Play failed:', err);
            setEnabled(false);
            isActive = false;
            updateIndicator();
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

function updateIndicator() {
    const dot = document.getElementById('keep-alive-dot');
    const label = document.getElementById('keep-alive-label');
    if (!dot) return;

    if (isActive) {
        dot.style.backgroundColor = '#4caf50';
        if (label) label.textContent = 'Keep Alive: ON';
    } else {
        dot.style.backgroundColor = '#888';
        if (label) label.textContent = 'Keep Alive: OFF';
    }
}

function onToggle() {
    if (isActive) {
        setEnabled(false);
        stopKeepAlive();
    } else {
        setEnabled(true);
        startKeepAlive();
    }
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
                    Tap the button to start/stop silent audio. Keeps your browser
                    from killing this tab in the background.
                    <br><br>
                    <b style="color:#4caf50;">Green</b> = protected &nbsp;
                    <b style="color:#888;">Gray</b> = off
                    <br><br>
                    <i>You need to tap the button each time you open SillyTavern.</i>
                </p>
            </div>
        </div>
    </div>`;

    $('#extensions_settings2').append(settingsHtml);
    $('#keep-alive-toggle').on('click', onToggle);

    updateIndicator();
});
