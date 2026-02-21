document.addEventListener('DOMContentLoaded', function() {
    // ===== THEME TOGGLE FUNCTIONALITY =====
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    const lightLabel = document.getElementById('light-label');
    const darkLabel = document.getElementById('dark-label');

    const savedTheme = localStorage.getItem('theme') || 'light';

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
            lightLabel.classList.remove('active');
            lightLabel.classList.add('inactive');
            darkLabel.classList.remove('inactive');
            darkLabel.classList.add('active');
        } else {
            body.removeAttribute('data-theme');
            themeSwitch.checked = false;
            lightLabel.classList.remove('inactive');
            lightLabel.classList.add('active');
            darkLabel.classList.remove('active');
            darkLabel.classList.add('inactive');
        }
    }

    applyTheme(savedTheme);

    themeSwitch.addEventListener('change', function() {
        if (this.checked) {
            localStorage.setItem('theme', 'dark');
            applyTheme('dark');
        } else {
            localStorage.setItem('theme', 'light');
            applyTheme('light');
        }
    });

    function isMobile() {
        return window.innerWidth <= 768;
    }

    // Track active input
    let activeInput = null;

    // Get keyboard elements
    const customKeyboard = document.getElementById('custom-keyboard');
    const keyboardClose = document.getElementById('keyboard-close');
    const keyboardDone = document.getElementById('keyboard-done');
    const keyDelete = document.getElementById('key-delete');
    const keyClear = document.getElementById('key-clear');

    // Function to open custom keyboard
    function openCustomKeyboard(input) {
        if (!isMobile()) return; // Only on mobile
        
        activeInput = input;
        customKeyboard.classList.remove('hidden');
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
    }

    // Function to close custom keyboard
    function closeCustomKeyboard() {
        customKeyboard.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Prevent actual keyboard from opening (mobile only)
    document.addEventListener('focusin', function(e) {
        // Only apply on mobile
        if (!isMobile()) return;
        
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            // Don't interfere with our keyboard buttons
            if (e.target.closest('.custom-keyboard')) return;
            
            // For all other inputs, prevent default and open custom keyboard
            e.preventDefault();
            
            // Make input read-only to prevent actual keyboard
            e.target.setAttribute('readonly', true);
            
            // Open custom keyboard
            openCustomKeyboard(e.target);
        }
    });

    // Handle keyboard button clicks
    document.querySelectorAll('.key-btn[data-value]').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!isMobile() || !activeInput) return;
            
            const value = this.dataset.value;
            
            // Validate based on odds format
            const format = document.querySelector('.odds-type-btn.active')?.dataset.format || 'decimal';
            
            // Basic validation - prevent multiple operators
            const currentValue = activeInput.value;
            const lastChar = currentValue.slice(-1);
            const operators = ['+', '-', '/', '.'];
            
            if (operators.includes(value) && operators.includes(lastChar)) {
                return; // Don't allow two operators in a row
            }
            
            // For fractional odds, prevent multiple slashes
            if (format === 'fractional' && value === '/' && currentValue.includes('/')) {
                return;
            }
            
            // For decimal odds, prevent multiple decimals
            if (format === 'decimal' && value === '.' && currentValue.includes('.')) {
                return;
            }
            
            activeInput.value += value;
            
            // Trigger input event
            activeInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    });

    // Delete button (backspace)
    keyDelete.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.value = activeInput.value.slice(0, -1);
        
        // Trigger input event
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Clear button
    keyClear.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.value = '';
        
        // Trigger input event
        activeInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Done button
    keyboardDone.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        // Remove readonly attribute
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    // Close button
    keyboardClose.addEventListener('click', function() {
        if (!isMobile() || !activeInput) return;
        
        activeInput.removeAttribute('readonly');
        activeInput.blur();
        closeCustomKeyboard();
    });

    // Handle window resize (switch between mobile/desktop)
    window.addEventListener('resize', function() {
        if (!isMobile()) {
            // If switching to desktop, close keyboard and remove readonly from all inputs
            customKeyboard.classList.add('hidden');
            document.body.style.overflow = '';
            
            // Remove readonly from all inputs
            document.querySelectorAll('input[readonly]').forEach(input => {
                input.removeAttribute('readonly');
            });
            
            activeInput = null;
        }
    });

    // Close keyboard when clicking outside (mobile only)
    document.addEventListener('click', function(e) {
        if (!isMobile()) return;
        
        if (!customKeyboard.contains(e.target) && 
            !e.target.matches('input, textarea') && 
            !customKeyboard.classList.contains('hidden')) {
            
            if (activeInput) {
                activeInput.removeAttribute('readonly');
                activeInput.blur();
            }
            closeCustomKeyboard();
        }
    });

    let lastWidth = window.innerWidth;

    function handleDetailsForScreen() {
        const currentWidth = window.innerWidth;
        
        // ONLY run the open/close logic if the WIDTH changed.
        // This ignores the height-change caused by mobile address bars hiding.
        if (currentWidth !== lastWidth) {
            const detailsList = document.querySelectorAll("details.instruction-section");
            if (currentWidth >= 1200) {
                detailsList.forEach(detail => detail.setAttribute("open", ""));
            } else {
                detailsList.forEach(detail => detail.removeAttribute("open"));
            }
            lastWidth = currentWidth;
        }
    }

    // Attach the improved resize handler
    window.addEventListener("resize", handleDetailsForScreen);

    // ===== FREE BET CALCULATOR LOGIC =====
    
    // DOM Elements
    const betTypeBtns = document.querySelectorAll('.bet-type-btn');
    const freebetAmountInput = document.getElementById('freebet-amount');
    const freebetOddsInput = document.getElementById('freebet-odds');
    const hedgeOddsInput = document.getElementById('hedge-odds');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const compareBtn = document.getElementById('compare-btn');
    const scenarioBtns = document.querySelectorAll('.scenario-btn');
    const comparisonSection = document.getElementById('comparison-section');
    
    const freebetExample = document.getElementById('freebet-example');
    const hedgeExample = document.getElementById('hedge-example');
    
    const profitValue = document.getElementById('profit-value');
    const profitDescription = document.getElementById('profit-description');
    const resultFreebet = document.getElementById('result-freebet');
    const resultHedge = document.getElementById('result-hedge');
    const resultWinProfit = document.getElementById('result-win-profit');
    const resultHedgeProfit = document.getElementById('result-hedge-profit');
    const resultConversion = document.getElementById('result-conversion');
    const resultEffective = document.getElementById('result-effective');
    const resultRoi = document.getElementById('result-roi');
    const resultRisk = document.getElementById('result-risk');
    const breakdownBody = document.getElementById('breakdown-body');
    const optimalStrategy = document.getElementById('optimal-strategy');
    const nohedgeStrategy = document.getElementById('nohedge-strategy');

    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.getElementById('calculators-dropdown');
    const dropdownIcon = dropdownBtn.querySelector('.fa-chevron-down');

    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = dropdownContent.style.display === 'block';
        dropdownContent.style.display = isOpen ? 'none' : 'block';
        dropdownIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    dropdownContent.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    // ===== GLOBAL ODDS FORMAT =====
    let globalOddsFormat = 'decimal';

    function createGlobalFormatSelector() {
        const inputSection = document.querySelector('.input-section');
        
        if (document.getElementById('global-odds-format')) {
            return;
        }
        
        const globalFormatRow = document.createElement('div');
        globalFormatRow.className = 'input-group global-format-row';
        
        globalFormatRow.innerHTML = `
            <label for="global-odds-format">
                <i class="fas fa-globe"></i> Global Odds Format:
            </label>
            <select id="global-odds-format" class="global-format-select">
                <option value="decimal" selected>Decimal</option>
                <option value="fractional">Fractional</option>
                <option value="american">American</option>
            </select>
            <span class="odds-example" id="global-format-example">All odds use the same format</span>
        `;
        
        inputSection.insertBefore(globalFormatRow, inputSection.firstChild);
        
        const oddsFormatGroup = document.getElementById('odds-format')?.parentNode;
        const hedgeFormatGroup = document.getElementById('hedge-format')?.parentNode;
        
        if (oddsFormatGroup) oddsFormatGroup.remove();
        if (hedgeFormatGroup) hedgeFormatGroup.remove();
        
        const globalFormatSelect = document.getElementById('global-odds-format');
        globalFormatSelect.addEventListener('change', function() {
            globalOddsFormat = this.value;
            updateOddsPlaceholders();
            attemptAutoCalculate();
        });
    }

    // ===== VALIDATION & CONVERSION FUNCTIONS =====
    
    function updateOddsPlaceholders() {
        const format = globalOddsFormat;
        
        switch(format) {
            case 'decimal':
                freebetExample.textContent = 'Decimal example: 3.00';
                freebetOddsInput.placeholder = 'e.g., 3.00';
                hedgeExample.textContent = 'Decimal example: 2.50';
                hedgeOddsInput.placeholder = 'e.g., 2.50';
                break;
            case 'fractional':
                freebetExample.textContent = 'Fractional example: 2/1';
                freebetOddsInput.placeholder = 'e.g., 2/1';
                hedgeExample.textContent = 'Fractional example: 3/2';
                hedgeOddsInput.placeholder = 'e.g., 3/2';
                break;
            case 'american':
                freebetExample.textContent = 'American example: +200';
                freebetOddsInput.placeholder = 'e.g., +200';
                hedgeExample.textContent = 'American example: +150';
                hedgeOddsInput.placeholder = 'e.g., +150';
                break;
        }
    }
    
    function validateOddsInput(inputElement, format) {
        const value = inputElement.value.trim();
        
        if (value === '') return false;
        
        let isValid = false;
        
        switch(format) {
            case 'decimal':
                const decimal = parseFloat(value);
                isValid = !isNaN(decimal) && decimal >= 1 && (/^[0-9.]*$/.test(value)) && (!/([.]).*?\1/.test(value));
                break;
            case 'fractional':
                if (value.includes('/')) {
                    const [numerator, denominator] = value.split('/').map(Number);
                    isValid = !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 && (/^[0-9/]*$/.test(value)) && (!/([/]).*?\1/.test(value));
                }
                break;
            case 'american':
                if ((value.startsWith('+') || value.startsWith('-'))) {
                    const numValue = parseInt(value.substring(1));
                    isValid = !isNaN(numValue) && numValue >= 100 && /^[0-9+-]*$/.test(value) && !/([+-]).*?\1/.test(value) && (/^([^+]*|[^-]*)$/.test(value));
                }
                break;
        }
        
        // Update UI class
        if (!isValid) {
            inputElement.classList.add('invalid');
        } else {
            inputElement.classList.remove('invalid');
        }
        
        return isValid;
    }
    
    function validateStakeAmount() {
        const value = parseFloat(freebetAmountInput.value);
        const isValid = !isNaN(value) && value > 0 && (/^[0-9.]*$/.test(freebetAmountInput.value)) && (!/([.]).*?\1/.test(freebetAmountInput.value)) ;
        
        if (!isValid) {
            freebetAmountInput.classList.add('invalid');
        } else {
            freebetAmountInput.classList.remove('invalid');
        }
        
        return isValid;
    }
    
    function isAllInputsValid() {
        // Check stake amount
        const stakeValid = validateStakeAmount();
        if (!stakeValid) return false;
        
        // Check free bet odds
        const freebetOddsValid = validateOddsInput(freebetOddsInput, globalOddsFormat);
        if (!freebetOddsValid) return false;
        
        // Check hedge odds
        const hedgeOddsValid = validateOddsInput(hedgeOddsInput, globalOddsFormat);
        if (!hedgeOddsValid) return false;
        
        return true;
    }
    
    function toDecimal(odds, format = globalOddsFormat) {
        if (!odds || odds.trim() === '') return null;
        
        const str = odds.trim();
        
        switch(format) {
            case 'decimal':
                const decimal = parseFloat(str);
                return isNaN(decimal) || decimal < 1 ? null : decimal;
            case 'fractional':
                if (!str.includes('/')) return null;
                const [numerator, denominator] = str.split('/').map(Number);
                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
                return (numerator / denominator) + 1;
            case 'american':
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (100 / Math.abs(value)) + 1;
                } else {
                    return null;
                }
            default:
                return null;
        }
    }
    
    function formatCurrency(amount, showSign = true) {
        if (isNaN(amount) || amount === null) return '-';
        const formattedValue = '$' + Math.abs(parseFloat(amount)).toFixed(2);
        
        if (amount > 0) {
            return showSign ? '+' + formattedValue : formattedValue;
        } else if (amount < 0) {
            return '-' + formattedValue;
        } else {
            return '$0.00';
        }
    }
    
    function formatPercentage(value, showSign = true) {
        if (isNaN(value) || value === null) return '-';
        const formattedValue = Math.abs(parseFloat(value)).toFixed(2) + '%';
        
        if (value > 0) {
            return showSign ? '+' + formattedValue : formattedValue;
        } else if (value < 0) {
            return '-' + formattedValue;
        } else {
            return '0.00%';
        }
    }
    
    function applyResultColors() {
        const profitVal = parseFloat(profitValue.textContent.replace(/[^0-9.-]/g, ''));
        if (!isNaN(profitVal)) {
            profitValue.classList.remove('positive', 'negative');
            profitValue.classList.add(profitVal > 0 ? 'positive' : profitVal < 0 ? 'negative' : '');
        }
        
        const winProfitVal = parseFloat(resultWinProfit.textContent.replace(/[^0-9.-]/g, ''));
        if (!isNaN(winProfitVal)) {
            resultWinProfit.classList.remove('positive', 'negative');
            resultWinProfit.classList.add(winProfitVal > 0 ? 'positive' : winProfitVal < 0 ? 'negative' : '');
        }
        
        const hedgeProfitVal = parseFloat(resultHedgeProfit.textContent.replace(/[^0-9.-]/g, ''));
        if (!isNaN(hedgeProfitVal)) {
            resultHedgeProfit.classList.remove('positive', 'negative');
            resultHedgeProfit.classList.add(hedgeProfitVal > 0 ? 'positive' : hedgeProfitVal < 0 ? 'negative' : '');
        }
        
        const roiVal = parseFloat(resultRoi.textContent.replace(/[^0-9.-]/g, ''));
        if (!isNaN(roiVal)) {
            resultRoi.classList.remove('positive', 'negative');
            resultRoi.classList.add(roiVal > 0 ? 'positive' : roiVal < 0 ? 'negative' : '');
        }
    }

    // ===== CORRECTED CALCULATION FUNCTIONS WITH VALIDATION =====
    
    function calculateSNR(freebet, freebetOdds, hedgeOdds) {
        if (!freebet || !freebetOdds || !hedgeOdds) return null;
        if (freebetOdds <= 1 || hedgeOdds <= 1) return null;
        
        const hedge = (freebet * (freebetOdds - 1)) / hedgeOdds;
        const freebetWinProfit = (freebet * (freebetOdds - 1)) - hedge;
        const hedgeWinProfit = hedge * (hedgeOdds - 1);
        const profit = freebetWinProfit;
        
        return {
            hedge: hedge,
            profit: profit,
            freebetWinProfit: freebetWinProfit,
            hedgeWinProfit: hedgeWinProfit
        };
    }
    
    function calculateSR(freebet, freebetOdds, hedgeOdds) {
        if (!freebet || !freebetOdds || !hedgeOdds) return null;
        if (freebetOdds <= 1 || hedgeOdds <= 1) return null;
        
        const hedge = (freebet * freebetOdds) / hedgeOdds;
        const freebetWinProfit = (freebet * freebetOdds) - hedge;
        const hedgeWinProfit = hedge * (hedgeOdds - 1);
        const profit = freebetWinProfit;
        
        return {
            hedge: hedge,
            profit: profit,
            freebetWinProfit: freebetWinProfit,
            hedgeWinProfit: hedgeWinProfit
        };
    }
    
    function calculateNoHedge(freebet, freebetOdds, betType) {
        if (!freebet || !freebetOdds) return null;
        
        if (betType === 'snr') {
            const potentialProfit = freebet * (freebetOdds - 1);
            return {
                freebetWinProfit: potentialProfit,
                freebetWinReturn: potentialProfit,
                hedgeWinProfit: 0,
                conversionRate: (potentialProfit / freebet) * 100
            };
        } else {
            const totalReturn = freebet * freebetOdds;
            const potentialProfit = totalReturn - freebet;
            return {
                freebetWinProfit: potentialProfit,
                freebetWinReturn: totalReturn,
                hedgeWinProfit: 0,
                conversionRate: (potentialProfit / freebet) * 100
            };
        }
    }
    
    function isArbitragePossible(freebetOdds, hedgeOdds, betType) {
        if (betType === 'snr') {
            const minHedgeOdds = freebetOdds / (freebetOdds - 1);
            return hedgeOdds > minHedgeOdds;
        } else {
            return hedgeOdds > freebetOdds;
        }
    }
    
    function calculateConversionRate(profit, freebet) {
        if (!profit || !freebet || freebet <= 0) return null;
        return (profit / freebet) * 100;
    }
    
    function calculateEffectiveOdds(freebet, profit, betType) {
        if (!freebet || !profit) return null;
        
        if (betType === 'snr') {
            return (profit / freebet) + 1;
        } else {
            return (profit + freebet) / freebet;
        }
    }
    
    function calculateROI(profit, hedge) {
        if (!profit || !hedge || hedge <= 0) return null;
        return (profit / hedge) * 100;
    }
    
    function getProfitDescription(profit, conversionRate, betType, isArbPossible) {
        if (profit === null) return 'Enter values above to calculate guaranteed profit';
        
        const betTypeName = betType === 'snr' ? 'SNR' : 'SR';
        
        if (!isArbPossible) {
            return `⚠️ No guaranteed profit possible. Hedge odds need to be higher. Try finding better odds.`;
        }
        
        if (profit <= 0) {
            return `⚠️ No guaranteed profit possible with these odds. Try finding better hedge odds.`;
        }
        
        if (conversionRate >= 70) {
            return `✅ Excellent ${betTypeName} conversion! ${formatPercentage(conversionRate, false)} of free bet value converted to guaranteed profit.`;
        } else if (conversionRate >= 50) {
            return `✅ Good ${betTypeName} conversion. ${formatPercentage(conversionRate, false)} of free bet value converted to guaranteed profit.`;
        } else if (conversionRate >= 30) {
            return `⚠️ Fair ${betTypeName} conversion. ${formatPercentage(conversionRate, false)} of free bet value converted to guaranteed profit.`;
        } else {
            return `⚠️ Low ${betTypeName} conversion. ${formatPercentage(conversionRate, false)} of free bet value converted to guaranteed profit. Consider waiting for better odds.`;
        }
    }
    
    function updateBreakdownTable(freebet, freebetOdds, hedge, hedgeOdds, profit, betType, scenario, results) {
        if (!freebet || !freebetOdds) {
            breakdownBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">
                        Enter valid values to see breakdown
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        if (scenario === 'snr' || scenario === 'sr') {
            if (!results) return;
            
            const freebetWinReturn = scenario === 'snr' 
                ? freebet * (freebetOdds - 1)
                : freebet * freebetOdds;
            
            const hedgeLoss = -hedge;
            const hedgeProfit = hedge * (hedgeOdds - 1);
            
            html = `
                <tr>
                    <td><span class="outcome-win">Free Bet Wins ✓</span></td>
                    <td>${formatCurrency(freebetWinReturn, true)}</td>
                    <td class="${hedgeLoss < 0 ? 'negative' : ''}">${formatCurrency(hedgeLoss, true)}</td>
                    <td class="positive">${formatCurrency(results.freebetWinProfit, true)}</td>
                    <td class="positive">${formatCurrency(results.freebetWinProfit, true)}</td>
                </tr>
                <tr>
                    <td><span class="outcome-loss">Hedge Bet Wins ✓</span></td>
                    <td>$0.00</td>
                    <td class="positive">${formatCurrency(hedgeProfit, true)}</td>
                    <td class="positive">${formatCurrency(results.hedgeWinProfit, true)}</td>
                    <td class="positive">${formatCurrency(results.hedgeWinProfit, true)}</td>
                </tr>
                <tr style="font-weight: bold; background-color: rgba(39, 174, 96, 0.1);">
                    <td>🎯 GUARANTEED PROFIT</td>
                    <td colspan="2">Either outcome</td>
                    <td class="positive">${formatCurrency(results.profit, true)}</td>
                    <td class="positive">${formatCurrency(results.profit, true)}</td>
                </tr>
            `;
        } else {
            const noHedgeResults = calculateNoHedge(freebet, freebetOdds, betType);
            
            if (scenario === 'snr') {
                html = `
                    <tr>
                        <td><span class="outcome-win">Free Bet Wins ✓</span></td>
                        <td>${formatCurrency(noHedgeResults.freebetWinReturn, true)}</td>
                        <td>$0.00</td>
                        <td class="positive">${formatCurrency(noHedgeResults.freebetWinProfit, true)}</td>
                        <td class="positive">${formatCurrency(noHedgeResults.freebetWinProfit, true)}</td>
                    </tr>
                    <tr>
                        <td><span class="outcome-loss">Free Bet Loses ✗</span></td>
                        <td>$0.00</td>
                        <td>$0.00</td>
                        <td class="negative">$0.00</td>
                        <td>$0.00</td>
                    </tr>
                    <tr style="font-weight: bold; background-color: rgba(243, 156, 18, 0.1);">
                        <td>⚠️ RISK EXPOSURE</td>
                        <td colspan="2">50-50 Chance</td>
                        <td>${formatCurrency(0, true)} to ${formatCurrency(noHedgeResults.freebetWinProfit, true)}</td>
                        <td>0% to ${formatPercentage(noHedgeResults.conversionRate, false)}</td>
                    </tr>
                `;
            } else {
                html = `
                    <tr>
                        <td><span class="outcome-win">Free Bet Wins ✓</span></td>
                        <td>${formatCurrency(noHedgeResults.freebetWinReturn, true)}</td>
                        <td>$0.00</td>
                        <td class="positive">${formatCurrency(noHedgeResults.freebetWinProfit, true)}</td>
                        <td class="positive">${formatCurrency(noHedgeResults.freebetWinReturn, true)}</td>
                    </tr>
                    <tr>
                        <td><span class="outcome-loss">Free Bet Loses ✗</span></td>
                        <td>$0.00</td>
                        <td>$0.00</td>
                        <td class="negative">$0.00</td>
                        <td>$0.00</td>
                    </tr>
                    <tr style="font-weight: bold; background-color: rgba(243, 156, 18, 0.1);">
                        <td>⚠️ RISK EXPOSURE</td>
                        <td colspan="2">50-50 Chance</td>
                        <td>${formatCurrency(0, true)} to ${formatCurrency(noHedgeResults.freebetWinProfit, true)}</td>
                        <td>0% to ${formatPercentage(noHedgeResults.conversionRate, false)}</td>
                    </tr>
                `;
            }
        }
        
        breakdownBody.innerHTML = html;
    }
    
    function updateStrategyText(freebet, freebetOdds, hedge, hedgeOdds, profit, conversionRate, betType, isArbPossible) {
        if (!freebet || !freebetOdds || !hedge || !hedgeOdds) return;
        
        if (!isArbPossible) {
            optimalStrategy.textContent = `❌ No guaranteed profit possible. Hedge odds (${hedgeOdds.toFixed(2)}) need to be higher than ${betType === 'snr' ? (freebetOdds/(freebetOdds-1)).toFixed(2) : freebetOdds.toFixed(2)}.`;
        } else {
            optimalStrategy.textContent = `✅ Hedge $${hedge.toFixed(2)} at ${hedgeOdds.toFixed(2)} odds to lock in ${formatCurrency(profit, true)} guaranteed profit (${formatPercentage(conversionRate, false)} conversion).`;
        }
        
        const noHedgeResults = calculateNoHedge(freebet, freebetOdds, betType);
        nohedgeStrategy.textContent = `📊 No hedge: Potential profit of ${formatCurrency(noHedgeResults.freebetWinProfit, true)} if free bet wins, or $0.00 if it loses. Risk vs reward: ${formatPercentage(conversionRate, false)} guaranteed vs ${formatPercentage(noHedgeResults.conversionRate, false)} potential.`;
    }

    // ===== AUTO-CALCULATE ONLY WHEN ALL INPUTS ARE VALID =====
    function attemptAutoCalculate() {
        // Only auto-calculate if ALL inputs are valid
        if (isAllInputsValid()) {
            calculate();
        }
    }

    // ===== EVENT LISTENERS =====
    
    // Input event listeners - update validation UI but DON'T auto-calculate on every keystroke
    freebetAmountInput.addEventListener('input', function() {
        validateStakeAmount();
        // Don't auto-calculate here - wait for all fields to be valid
    });
    
    freebetOddsInput.addEventListener('input', function() {
        validateOddsInput(this, globalOddsFormat);
        // Don't auto-calculate here - wait for all fields to be valid
    });
    
    hedgeOddsInput.addEventListener('input', function() {
        validateOddsInput(this, globalOddsFormat);
        // Don't auto-calculate here - wait for all fields to be valid
    });
    
    // BLUR events - when user leaves a field, try to auto-calculate if all fields are valid
    freebetAmountInput.addEventListener('blur', function() {
        attemptAutoCalculate();
    });
    
    freebetOddsInput.addEventListener('blur', function() {
        attemptAutoCalculate();
    });
    
    hedgeOddsInput.addEventListener('blur', function() {
        attemptAutoCalculate();
    });
    
    betTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            betTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentBetType = this.dataset.type;
            
            if (currentScenario !== 'nohedge') {
                currentScenario = currentBetType;
                scenarioBtns.forEach(b => b.classList.remove('active'));
                const scenarioBtn = document.querySelector(`.scenario-btn[data-scenario="${currentBetType}"]`);
                if (scenarioBtn) scenarioBtn.classList.add('active');
            }
            
            attemptAutoCalculate();
        });
    });
    
    scenarioBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            scenarioBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentScenario = this.dataset.scenario;
            
            // Only update breakdown if we have valid calculations
            if (isAllInputsValid()) {
                const freebet = parseFloat(freebetAmountInput.value);
                const freebetOddsStr = freebetOddsInput.value.trim();
                const hedgeOddsStr = hedgeOddsInput.value.trim();
                
                const freebetOdds = toDecimal(freebetOddsStr);
                const hedgeOdds = toDecimal(hedgeOddsStr);
                
                if (freebetOdds && hedgeOdds && currentScenario !== 'nohedge') {
                    const results = currentBetType === 'snr' 
                        ? calculateSNR(freebet, freebetOdds, hedgeOdds)
                        : calculateSR(freebet, freebetOdds, hedgeOdds);
                    
                    updateBreakdownTable(freebet, freebetOdds, results?.hedge || 0, hedgeOdds, results?.profit || 0, currentBetType, currentScenario, results);
                } else {
                    updateBreakdownTable(freebet, freebetOdds, 0, hedgeOdds, 0, currentBetType, currentScenario, null);
                }
            }
        });
    });
    
    // Calculate button - always triggers calculation regardless of validation state
    calculateBtn.addEventListener('click', function() {
        if (isAllInputsValid()) {
            calculate();
        } else {
            // Show which fields are invalid
            let errorMessage = 'Please fix the following:\n';
            if (!validateStakeAmount()) errorMessage += '- Free Bet Amount must be greater than 0\n';
            if (!validateOddsInput(freebetOddsInput, globalOddsFormat)) errorMessage += '- Free Bet Odds are invalid for ' + globalOddsFormat + ' format\n';
            if (!validateOddsInput(hedgeOddsInput, globalOddsFormat)) errorMessage += '- Hedge Odds are invalid for ' + globalOddsFormat + ' format\n';
            alert(errorMessage);
        }
    });
    
    resetBtn.addEventListener('click', function() {
        freebetAmountInput.value = '100';
        freebetOddsInput.value = '';
        hedgeOddsInput.value = '';
        
        const globalFormatSelect = document.getElementById('global-odds-format');
        if (globalFormatSelect) {
            globalFormatSelect.value = 'decimal';
            globalOddsFormat = 'decimal';
        }
        
        // Remove invalid classes
        freebetAmountInput.classList.remove('invalid');
        freebetOddsInput.classList.remove('invalid');
        hedgeOddsInput.classList.remove('invalid');
        
        betTypeBtns.forEach(btn => btn.classList.remove('active'));
        betTypeBtns[0].classList.add('active');
        currentBetType = 'snr';
        
        scenarioBtns.forEach(btn => btn.classList.remove('active'));
        scenarioBtns[0].classList.add('active');
        currentScenario = 'snr';
        
        updateOddsPlaceholders();
        hideResults();
        comparisonSection.classList.add('hidden');
    });
    
    compareBtn.addEventListener('click', function() {
        if (isAllInputsValid()) {
            calculate();
            comparisonSection.classList.remove('hidden');
        } else {
            alert('Please enter valid values before comparing strategies.');
        }
    });
    
    // ===== MAIN CALCULATION FUNCTION =====
    function calculate() {
        const freebet = parseFloat(freebetAmountInput.value);
        const freebetOddsStr = freebetOddsInput.value.trim();
        const hedgeOddsStr = hedgeOddsInput.value.trim();
        
        // All inputs should be valid at this point
        const freebetOdds = toDecimal(freebetOddsStr);
        const hedgeOdds = toDecimal(hedgeOddsStr);
        
        if (!freebetOdds || !hedgeOdds) {
            hideResults();
            return;
        }
        
        const arbPossible = isArbitragePossible(freebetOdds, hedgeOdds, currentBetType);
        
        let results;
        if (currentBetType === 'snr') {
            results = calculateSNR(freebet, freebetOdds, hedgeOdds);
        } else {
            results = calculateSR(freebet, freebetOdds, hedgeOdds);
        }
        
        if (!results) {
            hideResults();
            return;
        }
        
        const conversionRate = calculateConversionRate(results.profit, freebet);
        const effectiveOdds = calculateEffectiveOdds(freebet, results.profit, currentBetType);
        const roi = calculateROI(results.profit, results.hedge);
        
        // Update results
        profitValue.textContent = arbPossible ? formatCurrency(results.profit, true) : '-';
        profitDescription.textContent = getProfitDescription(
            arbPossible ? results.profit : 0, 
            conversionRate, 
            currentBetType,
            arbPossible
        );
        
        resultFreebet.textContent = formatCurrency(freebet, false);
        resultHedge.textContent = arbPossible ? formatCurrency(results.hedge, false) : '-';
        resultWinProfit.textContent = arbPossible ? formatCurrency(results.freebetWinProfit, true) : '-';
        resultHedgeProfit.textContent = arbPossible ? formatCurrency(results.hedgeWinProfit, true) : '-';
        resultConversion.textContent = arbPossible ? formatPercentage(conversionRate, false) : '-';
        resultEffective.textContent = arbPossible && effectiveOdds ? effectiveOdds.toFixed(2) : '-';
        resultRoi.textContent = arbPossible ? formatPercentage(roi, true) : '-';
        resultRisk.textContent = arbPossible ? formatCurrency(results.hedge, false) : '-';
        
        applyResultColors();
        updateBreakdownTable(freebet, freebetOdds, results.hedge, hedgeOdds, results.profit, currentBetType, currentScenario, results);
        updateStrategyText(freebet, freebetOdds, results.hedge, hedgeOdds, results.profit, conversionRate, currentBetType, arbPossible);
    }
    
    function hideResults() {
        profitValue.textContent = '-';
        profitDescription.textContent = 'Enter values above to calculate guaranteed profit';
        
        resultFreebet.textContent = '-';
        resultHedge.textContent = '-';
        resultWinProfit.textContent = '-';
        resultHedgeProfit.textContent = '-';
        resultConversion.textContent = '-';
        resultEffective.textContent = '-';
        resultRoi.textContent = '-';
        resultRisk.textContent = '-';
        
        profitValue.classList.remove('positive', 'negative');
        resultWinProfit.classList.remove('positive', 'negative');
        resultHedgeProfit.classList.remove('positive', 'negative');
        resultRoi.classList.remove('positive', 'negative');
        
        breakdownBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center;">
                    Enter valid values to see breakdown
                </td>
            </tr>
        `;
        
        optimalStrategy.textContent = 'Hedge to lock in guaranteed profit regardless of outcome. Most reliable method.';
        nohedgeStrategy.textContent = 'Use free bet without hedging. Higher potential profit but risk of losing everything.';
    }

    // ===== STATE VARIABLES =====
    let currentBetType = 'snr';
    let currentScenario = 'snr';

    // ===== INITIALIZATION =====
    createGlobalFormatSelector();
    updateOddsPlaceholders();
    freebetAmountInput.focus();
    
    // Initial validation check - don't auto-calculate, just set up validation UI
    validateStakeAmount();
    validateOddsInput(freebetOddsInput, globalOddsFormat);
    validateOddsInput(hedgeOddsInput, globalOddsFormat);
    hideResults();
});