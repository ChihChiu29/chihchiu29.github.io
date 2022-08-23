// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @description  NOT SET
// @version      0.1
// @run-at       document-end
// @match        https://kdpreports.amazon.com/*
// @grant        GM_log
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    GM_log('Welcome to Amazon Royalties Estimator User Improvement Program!');
    function runUntil(fn, intervalSec, untilSec) {
        const intervalId = setInterval(fn, intervalSec * 1000);
        setTimeout(function() {
            clearInterval(intervalId);
        }, untilSec * 1000);
    }

    function parseBookSalesTable() {
        let csvData = '';
        const bookElements = document.querySelectorAll(
            'div.ui.vertically > div.panel-title-new.header-height');
        let processSuccessful = false;
        for (const bookElement of bookElements.slice(1)) {
            const saleInfo = bookElement.innerText.split('\n');
            if (saleInfo.length < 6) {
                continue;
            }
            csvData += saleInfo[5] + ',' + saleInfo.slice(0, 5).join(',') + '\n';
            processSuccessful = true;
        }
        GM_setClipboard(csvData);
        return processSuccessful;
    }

    runUntil(parseBookSalesTable, 5, 30);
})();
