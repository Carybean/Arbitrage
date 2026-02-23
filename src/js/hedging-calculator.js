document.addEventListener('DOMContentLoaded', function() {
    // Theme Toggle
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    const savedTheme = localStorage.getItem('theme') || 'light';

    function applyTheme(theme) {
        if (theme === 'dark') {
            body.setAttribute('data-theme', 'dark');
            themeSwitch.checked = true;
        } else {
            body.removeAttribute('data-theme');
            themeSwitch.checked = false;
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
            const ignoredTypes = ['checkbox', 'radio', 'button', 'submit', 'color', 'file'];
            if (ignoredTypes.includes(e.target.type)) {
                return; 
            }
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


    // ===== HEDGING CALCULATOR =====
    const modeBtns = document.querySelectorAll('.mode-btn');
    const oddsFormatSelect = document.getElementById('odds-format');
    const syncToggle = document.getElementById('sync-odds-format');
    const syncStatus = document.getElementById('sync-status');
    const originalStakeInput = document.getElementById('original-stake');
    const originalOddsInput = document.getElementById('original-odds');
    const currentOddsInput = document.getElementById('current-odds');
    const cashoutOfferInput = document.getElementById('cashout-offer');
    const optionsGrid = document.getElementById('options-grid');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const saveScenarioBtn = document.getElementById('save-scenario');
    const originalOddsError = document.getElementById('original-odds-error');
    const currentOddsError = document.getElementById('current-odds-error');

    // Result elements
    const hedgeValue = document.getElementById('hedge-value');
    const hedgeDescription = document.getElementById('hedge-description');
    const resultOriginalWin = document.getElementById('result-original-win');
    const resultGuaranteed = document.getElementById('result-guaranteed');
    const resultHedgeAmount = document.getElementById('result-hedge-amount');
    const resultRiskReduction = document.getElementById('result-risk-reduction');
    const resultProfitOriginal = document.getElementById('result-profit-original');
    const resultProfitHedge = document.getElementById('result-profit-hedge');
    const resultRoi = document.getElementById('result-roi');
    const resultEffectiveCashout = document.getElementById('result-effective-cashout');

    // Outcome breakdown elements
    const outcomeOriginalProfit = document.getElementById('outcome-original-profit');
    const outcomeOriginalReturn = document.getElementById('outcome-original-return');
    const outcomeHedgeProfit = document.getElementById('outcome-hedge-profit');
    const outcomeHedgeReturn = document.getElementById('outcome-hedge-return');
    const outcomeGuaranteedProfit = document.getElementById('outcome-guaranteed-profit');
    const outcomeRiskLevel = document.getElementById('outcome-risk-level');

    // Get elements
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.getElementById('calculators-dropdown');
    const dropdownIcon = dropdownBtn.querySelector('.fa-chevron-down');

    // Toggle dropdown on click
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = dropdownContent.style.display === 'block';
        
        // Toggle dropdown
        dropdownContent.style.display = isOpen ? 'none' : 'block';
        
        // Rotate chevron icon
        dropdownIcon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    // Close dropdown on mobile when clicking a link
    dropdownContent.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            dropdownContent.style.display = 'none';
            dropdownIcon.style.transform = 'rotate(0deg)';
        }
    });

    // Comparison table element
    const comparisonBody = document.getElementById('comparison-body');

    let currentMode = 'profit';
    let selectedOption = 'guaranteed';
    let isFormatSynced = true;

    // Function to update placeholders based on odds format
    function updatePlaceholders() {
        const format = oddsFormatSelect.value;
        let originalPlaceholder = '';
        let currentPlaceholder = '';
        
        switch(format) {
            case 'decimal':
                originalPlaceholder = 'e.g., 3.00';
                currentPlaceholder = 'e.g., 2.50';
                break;
            case 'fractional':
                originalPlaceholder = 'e.g., 3/1';
                currentPlaceholder = 'e.g., 3/2';
                break;
            case 'american':
                originalPlaceholder = 'e.g., +150';
                currentPlaceholder = 'e.g., -110';
                break;
        }
        
        originalOddsInput.placeholder = originalPlaceholder;
        currentOddsInput.placeholder = currentPlaceholder;
    }

    // Validate American odds
    function validateAmericanOdds(oddsStr) {
        if (!oddsStr || oddsStr.trim() === '') return { valid: false, message: 'Please enter odds' };
        
        const str = oddsStr.trim();
        
        // Must start with + or -
        if (!str.startsWith('+') && !str.startsWith('-')) {
            return { 
                valid: false, 
                message: 'American odds must start with + or - (e.g., +150 or -200)' 
            };
        }

        if ((!/^[0-9+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str))) {
            return {
                valid: false,
                message: 'American odds must be valid'
            };
        }
        
        const numericPart = str.substring(1);
        const num = parseFloat(numericPart);
        
        if (isNaN(num)) {
            return { 
                valid: false, 
                message: 'Invalid number after + or - sign' 
            };
        }
        
        if (Math.abs(num) < 100) {
            return { 
                valid: false, 
                message: 'American odds must be 100 or greater (e.g., +100, -110, +200)' 
            };
        }
        
        return { valid: true, value: str };
    }

    // Validate odds input in real-time
    function validateOddsInput(inputElement, errorElement) {
        const oddsStr = inputElement.value.trim();
        const format = oddsFormatSelect.value;
        
        inputElement.classList.remove('invalid-input');
        errorElement.classList.remove('show');
        errorElement.textContent = '';
        
        if (oddsStr === '') {
            return { valid: true };
        }
        
        if (format === 'american') {
            const validation = validateAmericanOdds(oddsStr);
            if (!validation.valid) {
                inputElement.classList.add('invalid-input');
                errorElement.textContent = validation.message;
                errorElement.classList.add('show');
                return { valid: false };
            }
        } else if (format === 'decimal') {
            const decimal = parseFloat(oddsStr);
            if (isNaN(decimal) || decimal < 1) {
                inputElement.classList.add('invalid-input');
                errorElement.textContent = 'Decimal odds must be 1.00 or greater';
                errorElement.classList.add('show');
                return { valid: false };
            }
            else if ((!/^[0-9.]*$/.test(oddsStr)) || (/([.]).*?\1/.test(oddsStr))) {
                inputElement.classList.add('invalid-input');
                errorElement.textContent = 'Decimal odds must be valid';
                errorElement.classList.add('show');
                return { valid: false };
            }
        } else if (format === 'fractional') {
            if (!oddsStr.includes('/') || (!/^[0-9/]*$/.test(oddsStr)) || (/([/]).*?\1/.test(oddsStr))) {
                inputElement.classList.add('invalid-input');
                errorElement.textContent = 'Fractional odds must be in format X/Y (e.g., 3/1)';
                errorElement.classList.add('show');
                return { valid: false };
            }
            
            const [numerator, denominator] = oddsStr.split('/').map(Number);
            if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
                inputElement.classList.add('invalid-input');
                errorElement.textContent = 'Invalid fractional odds format';
                errorElement.classList.add('show');
                return { valid: false };
            }
        }
        
        return { valid: true };
    }

    // Check if all inputs are valid for auto-calculation
    function areAllInputsValid() {
        const originalStake = parseFloat(originalStakeInput.value);
        const originalOddsStr = originalOddsInput.value.trim();
        const currentOddsStr = currentOddsInput.value.trim();
        
        if (isNaN(originalStake) || originalStake <= 0 || (!/^[0-9.]*$/.test(originalStakeInput.value)) || (/([.]).*?\1/.test(originalStakeInput.value))) return false;
        if (originalOddsStr === '' || currentOddsStr === '') return false;
        
        const originalValidation = validateOddsInput(originalOddsInput, originalOddsError);
        const currentValidation = validateOddsInput(currentOddsInput, currentOddsError);
        
        return originalValidation.valid && currentValidation.valid;
    }

    // Update sync status
    function updateSyncStatus() {
        isFormatSynced = syncToggle.checked;
        if (isFormatSynced) {
            syncStatus.textContent = '✓ Format synced';
        } else {
            syncStatus.textContent = '✗ Format independent';
        }
    }

    // Update hedge options
    function updateHedgeOptions(mode) {
        let options = [];
        
        switch(mode) {
            case 'profit':
                options = [
                    { 
                        id: 'guaranteed', 
                        name: 'Full Hedge', 
                        description: 'Lock 100% of potential profit', 
                        value: '100% Profit Lock',
                        tooltip: 'Guarantee all potential profit. No risk, but no upside potential.'
                    },
                    { 
                        id: 'partial70', 
                        name: '70% Lock', 
                        description: 'Lock 70% profit, keep 30% upside', 
                        value: '70% Profit Lock',
                        tooltip: 'Lock 70% of potential profit, keep 30% chance for full win.'
                    },
                    { 
                        id: 'partial50', 
                        name: '50% Lock', 
                        description: 'Lock 50% profit, keep 50% upside', 
                        value: '50% Profit Lock',
                        tooltip: 'Balance: Lock half the profit, keep half the upside potential.'
                    },
                    { 
                        id: 'breakeven', 
                        name: 'Breakeven', 
                        description: 'Eliminate all risk', 
                        value: '0% (Breakeven)',
                        tooltip: 'Eliminate all risk - neither profit nor loss.'
                    }
                ];
                break;
                
            case 'loss':
                options = [
                    { 
                        id: 'minimize', 
                        name: 'Minimize Loss', 
                        description: 'Reduce maximum loss', 
                        value: 'Loss Reduction',
                        tooltip: 'Reduce your maximum possible loss by 50%.'
                    },
                    { 
                        id: 'breakeven', 
                        name: 'Breakeven', 
                        description: 'Try to break even', 
                        value: '0% (Breakeven)',
                        tooltip: 'Try to recover all your stake and break even.'
                    },
                    { 
                        id: 'partial50', 
                        name: '50% Recovery', 
                        description: 'Recover 50% of stake', 
                        value: '50% Recovery',
                        tooltip: 'Recover half of your original stake.'
                    },
                    { 
                        id: 'partial70', 
                        name: '70% Recovery', 
                        description: 'Recover 70% of stake', 
                        value: '70% Recovery',
                        tooltip: 'Recover 70% of your original stake.'
                    }
                ];
                break;
                
            case 'breakeven':
                options = [
                    { 
                        id: 'breakeven', 
                        name: 'Full Breakeven', 
                        description: 'Eliminate all risk', 
                        value: '0% (Breakeven)',
                        tooltip: 'Complete risk elimination - no profit, no loss.'
                    },
                    { 
                        id: 'partial50', 
                        name: 'Small Profit', 
                        description: 'Small guaranteed profit', 
                        value: 'Small Profit',
                        tooltip: 'Small guaranteed profit (10% of potential).'
                    },
                    { 
                        id: 'guaranteed', 
                        name: 'Max Profit', 
                        description: 'Maximum guaranteed profit', 
                        value: 'Max Profit',
                        tooltip: 'Maximum possible guaranteed profit from hedging.'
                    }
                ];
                break;
        }
        
        optionsGrid.innerHTML = '';
        
        options.forEach(option => {
            const optionCard = document.createElement('div');
            optionCard.className = 'option-card';
            if (option.id === selectedOption) {
                optionCard.classList.add('active');
            }
            optionCard.dataset.option = option.id;
            
            optionCard.innerHTML = `
                <h4>${option.name}</h4>
                <div class="option-value">${option.value}</div>
                <div class="option-description">${option.description}</div>
            `;
            
            optionCard.addEventListener('click', function() {
                document.querySelectorAll('.option-card').forEach(card => {
                    card.classList.remove('active');
                });
                this.classList.add('active');
                selectedOption = this.dataset.option;
                if (areAllInputsValid()) {
                    calculate();
                }
            });
            
            optionsGrid.appendChild(optionCard);
        });
    }

    // Convert odds to decimal
    function toDecimal(odds, format) {
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
                const validation = validateAmericanOdds(str);
                if (!validation.valid) return null;
                
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    return (100 / Math.abs(value)) + 1;
                }
                return null;
                
            default:
                return null;
        }
    }

    // Format currency - CORRECTED TO HANDLE NEGATIVE VALUES
    function formatCurrency(amount) {
        if (isNaN(amount) || amount === null) return '-';
        
        if (amount >= 0) {
            return '+$' + parseFloat(amount).toFixed(2);
        } else {
            return '-$' + Math.abs(parseFloat(amount)).toFixed(2);
        }
    }

    // Format percentage
    function formatPercentage(value) {
        if (isNaN(value) || value === null) return '-';
        
        if (value >= 0) {
            return value.toFixed(2) + '%';
        } else {
            return '-' + Math.abs(value).toFixed(2) + '%';
        }
    }

    // Calculate original bet potential
    function calculateOriginalPotential(stake, odds) {
        if (!stake || !odds) return null;
        return {
            profit: stake * (odds - 1),
            totalReturn: stake * odds
        };
    }

    // ===== CORRECTED HEDGE CALCULATIONS =====

    // Calculate hedge for guaranteed profit (100% lock)
    function calculateGuaranteedProfitHedge(originalStake, originalOdds, currentOdds) {
        if (!originalStake || !originalOdds || !currentOdds) return null;
        
        // Formula for full hedge (guaranteed profit)
        // We want: originalWinProfit = hedgeWinProfit
        // Solve: (S × O1) - H - S = (H × O2) - H - S
        // This simplifies to: H = (S × O1) / O2
        
        const hedge = (originalStake * originalOdds) / currentOdds;
        
        // Calculate profits for both scenarios
        const originalWinProfit = (originalStake * originalOdds) - hedge - originalStake;
        const hedgeWinProfit = (hedge * currentOdds) - hedge - originalStake;
        
        // Guaranteed profit should be the same for both scenarios
        const guaranteedProfit = Math.min(originalWinProfit, hedgeWinProfit);
        
        // Calculate total returns
        const originalWinTotalReturn = originalStake + originalWinProfit;
        const hedgeWinTotalReturn = hedge + hedgeWinProfit;
        
        return {
            hedge: hedge,
            guaranteedProfit: guaranteedProfit,
            originalWinProfit: originalWinProfit,
            hedgeWinProfit: hedgeWinProfit,
            originalWinTotalReturn: originalWinTotalReturn,
            hedgeWinTotalReturn: hedgeWinTotalReturn
        };
    }

    // Calculate hedge for breakeven
    function calculateBreakevenHedge(originalStake, originalOdds, currentOdds) {
        if (!originalStake || !originalOdds || !currentOdds) return null;
        
        // For breakeven, we want guaranteedProfit = 0
        // Solve: (H × O2) - H - S = 0
        // H × (O2 - 1) = S
        // H = S / (O2 - 1)
        
        const hedge = originalStake / (currentOdds - 1);
        
        // Calculate profits for both scenarios
        const originalWinProfit = (originalStake * originalOdds) - hedge - originalStake;
        const hedgeWinProfit = (hedge * currentOdds) - hedge - originalStake;
        
        // Guaranteed profit should be 0 (or close to it due to rounding)
        const guaranteedProfit = 0;
        
        // Calculate total returns
        const originalWinTotalReturn = originalStake + originalWinProfit;
        const hedgeWinTotalReturn = hedge + hedgeWinProfit;
        
        return {
            hedge: hedge,
            guaranteedProfit: guaranteedProfit,
            originalWinProfit: originalWinProfit,
            hedgeWinProfit: hedgeWinProfit,
            originalWinTotalReturn: originalWinTotalReturn,
            hedgeWinTotalReturn: hedgeWinTotalReturn
        };
    }

    // Calculate hedge for partial profit lock (e.g., 50%, 70%)
    function calculatePartialProfitHedge(originalStake, originalOdds, currentOdds, percentage) {
        if (!originalStake || !originalOdds || !currentOdds) return null;
        
        const originalPotential = originalStake * (originalOdds - 1);
        const targetProfit = originalPotential * (percentage / 100);
        
        // For partial profit lock, we want originalWinProfit = targetProfit
        // Original win profit formula: (S × O1) - H - S = targetProfit
        // Solve for H: H = (S × O1) - targetProfit - S
        // But we need to adjust for the hedge scenario
        
        // Better approach: Use weighted average of full hedge and breakeven
        const fullHedge = calculateGuaranteedProfitHedge(originalStake, originalOdds, currentOdds);
        const breakEvenHedge = calculateBreakevenHedge(originalStake, originalOdds, currentOdds);
        
        if (!fullHedge || !breakEvenHedge) return null;
        
        // Interpolate between full hedge and breakeven based on percentage
        const p = percentage / 100; // Convert to decimal
        const hedge = fullHedge.hedge * p + breakEvenHedge.hedge * (1 - p);
        
        // Recalculate profits with this hedge amount
        const originalWinProfit = (originalStake * originalOdds) - hedge - originalStake;
        const hedgeWinProfit = (hedge * currentOdds) - hedge - originalStake;
        
        // Guaranteed profit is the minimum of the two
        const guaranteedProfit = Math.min(originalWinProfit, hedgeWinProfit);
        
        // Calculate total returns
        const originalWinTotalReturn = originalStake + originalWinProfit;
        const hedgeWinTotalReturn = hedge + hedgeWinProfit;
        
        return {
            hedge: hedge,
            guaranteedProfit: guaranteedProfit,
            originalWinProfit: originalWinProfit,
            hedgeWinProfit: hedgeWinProfit,
            originalWinTotalReturn: originalWinTotalReturn,
            hedgeWinTotalReturn: hedgeWinTotalReturn
        };
    }

    // Calculate hedge to minimize losses (cut losses by 50%)
    function calculateCutLossesHedge(originalStake, originalOdds, currentOdds) {
        if (!originalStake || !originalOdds || !currentOdds) return null;
        
        // For minimizing losses, we want to reduce potential loss by 50%
        // Original potential loss = S (if bet loses)
        // Target loss = S × 0.5 = 50
        
        const targetLoss = originalStake * 0.5;
        
        // We want: hedgeWinProfit = -targetLoss
        // (H × O2) - H - S = -targetLoss
        // H × (O2 - 1) = S - targetLoss
        // H = (S - targetLoss) / (O2 - 1)
        
        const hedge = (originalStake - targetLoss) / (currentOdds - 1);
        
        // Calculate profits for both scenarios
        const originalWinProfit = (originalStake * originalOdds) - hedge - originalStake;
        const hedgeWinProfit = (hedge * currentOdds) - hedge - originalStake;
        
        // Guaranteed "profit" is actually a loss (negative)
        const guaranteedProfit = -targetLoss;
        
        // Calculate total returns
        const originalWinTotalReturn = originalStake + originalWinProfit;
        const hedgeWinTotalReturn = hedge + hedgeWinProfit;
        
        return {
            hedge: hedge,
            guaranteedProfit: guaranteedProfit,
            originalWinProfit: originalWinProfit,
            hedgeWinProfit: hedgeWinProfit,
            originalWinTotalReturn: originalWinTotalReturn,
            hedgeWinTotalReturn: hedgeWinTotalReturn
        };
    }

    // Calculate hedge for percentage recovery (e.g., 50% recovery, 70% recovery)
    function calculatePercentageRecoveryHedge(originalStake, originalOdds, currentOdds, percentage) {
        if (!originalStake || !originalOdds || !currentOdds) return null;
        
        // For percentage recovery, we want to recover X% of stake
        // Target recovery = S × (percentage/100)
        // We want: hedgeWinProfit = - (S - targetRecovery)
        
        const targetRecovery = originalStake * (percentage / 100);
        const targetLoss = originalStake - targetRecovery;
        
        // Similar to cut losses formula
        const hedge = (originalStake - targetLoss) / (currentOdds - 1);
        
        // Calculate profits for both scenarios
        const originalWinProfit = (originalStake * originalOdds) - hedge - originalStake;
        const hedgeWinProfit = (hedge * currentOdds) - hedge - originalStake;
        
        // Guaranteed "profit" is negative (loss)
        const guaranteedProfit = -targetLoss;
        
        // Calculate total returns
        const originalWinTotalReturn = originalStake + originalWinProfit;
        const hedgeWinTotalReturn = hedge + hedgeWinProfit;
        
        return {
            hedge: hedge,
            guaranteedProfit: guaranteedProfit,
            originalWinProfit: originalWinProfit,
            hedgeWinProfit: hedgeWinProfit,
            originalWinTotalReturn: originalWinTotalReturn,
            hedgeWinTotalReturn: hedgeWinTotalReturn
        };
    }

    // Calculate risk reduction percentage
    function calculateRiskReduction(originalStake, hedgeAmount, guaranteedProfit) {
        if (!originalStake || !hedgeAmount) return null;
        
        const originalRisk = originalStake;
        const newRisk = Math.abs(guaranteedProfit);
        const reduction = ((originalRisk - newRisk) / originalRisk) * 100;
        
        return Math.max(0, Math.min(reduction, 100));
    }

    // Calculate ROI on hedge
    function calculateHedgeROI(guaranteedProfit, hedgeAmount) {
        if (!guaranteedProfit || !hedgeAmount || hedgeAmount === 0) return null;
        return (guaranteedProfit / hedgeAmount) * 100;
    }

    // Compare with cash-out offer
    function compareWithCashout(guaranteedProfit, cashoutOffer, originalStake) {
        if (!guaranteedProfit || !cashoutOffer || !originalStake) return null;
        
        const cashoutProfit = cashoutOffer - originalStake;
        const difference = guaranteedProfit - cashoutProfit;
        const percentageDifference = (difference / Math.abs(cashoutProfit)) * 100;
        
        return {
            cashoutProfit: cashoutProfit,
            difference: difference,
            percentageDifference: percentageDifference,
            better: guaranteedProfit > cashoutProfit ? 'hedge' : 'cashout'
        };
    }

    // Get hedge description
    function getHedgeDescription(mode, option, guaranteedProfit, hedgeAmount) {
        if (guaranteedProfit === null || hedgeAmount === null) {
            return 'Enter values above to calculate hedge bet';
        }
        
        const modeNames = {
            'profit': 'Lock Profit',
            'loss': 'Cut Losses',
            'breakeven': 'Break Even'
        };
        
        const optionNames = {
            'guaranteed': 'Full Hedge',
            'breakeven': 'Breakeven',
            'partial50': '50% Profit Lock',
            'partial70': '70% Profit Lock',
            'minimize': 'Minimize Loss',
            'recovery50': '50% Recovery',
            'recovery70': '70% Recovery'
        };
        
        const modeName = modeNames[mode] || 'Hedge';
        const optionName = optionNames[option] || 'Selected';
        
        if (guaranteedProfit > 0) {
            return `${modeName} - ${optionName}: Lock in ${formatCurrency(guaranteedProfit)} guaranteed profit with ${formatCurrency(hedgeAmount)} hedge bet.`;
        } else if (guaranteedProfit === 0) {
            return `${modeName} - ${optionName}: Break even scenario. Eliminate risk with ${formatCurrency(hedgeAmount)} hedge bet.`;
        } else {
            return `${modeName} - ${optionName}: Reduce loss to ${formatCurrency(Math.abs(guaranteedProfit))} with ${formatCurrency(hedgeAmount)} hedge bet.`;
        }
    }

    // Get risk level description
    function getRiskLevel(guaranteedProfit, originalStake) {
        if (guaranteedProfit === null || originalStake === null) return 'Unknown';
        
        if (guaranteedProfit > 0) {
            const percentage = (guaranteedProfit / originalStake) * 100;
            if (percentage >= 50) return 'Very Low';
            if (percentage >= 20) return 'Low';
            return 'Medium';
        } else if (guaranteedProfit === 0) {
            return 'None (Breakeven)';
        } else {
            const lossPercentage = (Math.abs(guaranteedProfit) / originalStake) * 100;
            if (lossPercentage <= 25) return 'Low';
            if (lossPercentage <= 50) return 'Medium';
            if (lossPercentage <= 75) return 'High';
            return 'Very High';
        }
    }

    // Update comparison table
    function updateComparisonTable(originalStake, originalOdds, currentOdds, hedgeResults, cashoutOffer) {
        if (!originalStake || !originalOdds || !currentOdds || !hedgeResults) {
            comparisonBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">
                        Enter values to see comparison
                    </td>
                </tr>
            `;
            return;
        }
        
        const originalPotential = calculateOriginalPotential(originalStake, originalOdds);
        const noHedgeProfit = originalPotential.profit;
        const noHedgeLoss = -originalStake;
        
        const hedgeProfit = hedgeResults.guaranteedProfit;
        const hedgeRisk = getRiskLevel(hedgeProfit, originalStake);
        
        let cashoutProfit = null;
        if (cashoutOffer) {
            cashoutProfit = cashoutOffer - originalStake;
        }
        
        let html = `
            <tr>
                <td><strong>No Hedge</strong></td>
                <td>${formatCurrency(noHedgeProfit)}</td>
                <td>${formatCurrency(noHedgeLoss)}</td>
                <td>High</td>
                <td>High risk, high reward</td>
            </tr>
        `;
        
        // Determine if hedge is better option
        const isBetterOption = hedgeProfit >= 0 || (hedgeProfit > noHedgeLoss);
        const hedgeClass = isBetterOption ? 'better-option' : '';
        
        html += `
            <tr class="${hedgeClass}">
                <td><strong>With Hedge</strong></td>
                <td>${formatCurrency(hedgeProfit)}</td>
                <td>${formatCurrency(hedgeProfit)}</td>
                <td>${hedgeRisk}</td>
                <td>${hedgeProfit >= 0 ? 'Guaranteed profit' : 'Reduced loss'}</td>
            </tr>
        `;
        
        if (cashoutProfit !== null) {
            const cashoutClass = cashoutProfit > hedgeProfit ? 'better-option' : '';
            html += `
                <tr class="${cashoutClass}">
                    <td><strong>Cash-Out</strong></td>
                    <td>${formatCurrency(cashoutProfit)}</td>
                    <td>${formatCurrency(cashoutProfit)}</td>
                    <td>None</td>
                    <td>Instant, simple</td>
                </tr>
            `;
        }
        
        comparisonBody.innerHTML = html;
    }

    // Auto-calculate only when all inputs are valid
    function autoCalculate() {
        if (areAllInputsValid()) {
            calculate();
        }
    }

    // Main calculation function - FIXED
    function calculate() {
        const originalStake = parseFloat(originalStakeInput.value);
        const originalOddsStr = originalOddsInput.value.trim();
        const currentOddsStr = currentOddsInput.value.trim();
        const cashoutOffer = cashoutOfferInput.value ? parseFloat(cashoutOfferInput.value) : null;
        
        if (!areAllInputsValid()) {
            return;
        }
        
        const format = oddsFormatSelect.value;
        
        const originalOdds = toDecimal(originalOddsStr, format);
        const currentOdds = toDecimal(currentOddsStr, format);
        
        if (!originalOdds || originalOdds < 1) {
            alert('Please enter valid original odds.');
            return;
        }
        
        if (!currentOdds || currentOdds < 1) {
            alert('Please enter valid current odds.');
            return;
        }
        
        let hedgeResults;
        
        // Calculate based on mode and selected option
        switch(currentMode) {
            case 'profit':
                switch(selectedOption) {
                    case 'guaranteed':
                        hedgeResults = calculateGuaranteedProfitHedge(originalStake, originalOdds, currentOdds);
                        break;
                    case 'breakeven':
                        hedgeResults = calculateBreakevenHedge(originalStake, originalOdds, currentOdds);
                        break;
                    case 'partial50':
                        hedgeResults = calculatePartialProfitHedge(originalStake, originalOdds, currentOdds, 50);
                        break;
                    case 'partial70':
                        hedgeResults = calculatePartialProfitHedge(originalStake, originalOdds, currentOdds, 70);
                        break;
                }
                break;
                
            case 'loss':
                switch(selectedOption) {
                    case 'minimize':
                        hedgeResults = calculateCutLossesHedge(originalStake, originalOdds, currentOdds);
                        break;
                    case 'breakeven':
                        hedgeResults = calculateBreakevenHedge(originalStake, originalOdds, currentOdds);
                        break;
                    case 'partial50':
                        hedgeResults = calculatePercentageRecoveryHedge(originalStake, originalOdds, currentOdds, 50);
                        break;
                    case 'partial70':
                        hedgeResults = calculatePercentageRecoveryHedge(originalStake, originalOdds, currentOdds, 70);
                        break;
                }
                break;
                
            case 'breakeven':
                switch(selectedOption) {
                    case 'breakeven':
                        hedgeResults = calculateBreakevenHedge(originalStake, originalOdds, currentOdds);
                        break;
                    case 'partial50':
                        hedgeResults = calculatePartialProfitHedge(originalStake, originalOdds, currentOdds, 10);
                        break;
                    case 'guaranteed':
                        hedgeResults = calculateGuaranteedProfitHedge(originalStake, originalOdds, currentOdds);
                        break;
                }
                break;
        }
        
        if (!hedgeResults) {
            alert('Error in calculation. Please check your inputs.');
            return;
        }
        
        // Verify calculations are correct
        const tolerance = 0.01; // Allow $0.01 tolerance
        if (Math.abs(hedgeResults.originalWinProfit - hedgeResults.hedgeWinProfit) > tolerance && 
            Math.abs(hedgeResults.guaranteedProfit - Math.min(hedgeResults.originalWinProfit, hedgeResults.hedgeWinProfit)) > tolerance) {
            console.warn('Calculation discrepancy detected');
        }
        
        const originalPotential = calculateOriginalPotential(originalStake, originalOdds);
        const riskReduction = calculateRiskReduction(originalStake, hedgeResults.hedge, hedgeResults.guaranteedProfit);
        const hedgeROI = calculateHedgeROI(hedgeResults.guaranteedProfit, hedgeResults.hedge);
        
        let cashoutComparison = null;
        if (cashoutOffer) {
            cashoutComparison = compareWithCashout(hedgeResults.guaranteedProfit, cashoutOffer, originalStake);
        }
        
        // Update results display
        hedgeValue.textContent = formatCurrency(hedgeResults.hedge);
        hedgeDescription.textContent = getHedgeDescription(
            currentMode, 
            selectedOption, 
            hedgeResults.guaranteedProfit, 
            hedgeResults.hedge
        );
        
        resultOriginalWin.textContent = formatCurrency(originalPotential.profit);
        resultGuaranteed.textContent = formatCurrency(hedgeResults.guaranteedProfit);
        resultHedgeAmount.textContent = formatCurrency(hedgeResults.hedge);
        resultRiskReduction.textContent = riskReduction ? `${riskReduction.toFixed(1)}%` : '-';
        
        resultProfitOriginal.textContent = formatCurrency(hedgeResults.originalWinProfit);
        resultProfitHedge.textContent = formatCurrency(hedgeResults.hedgeWinProfit);
        resultRoi.textContent = hedgeROI ? formatPercentage(hedgeROI) : '-';
        
        if (cashoutComparison) {
            const effectiveCashout = hedgeResults.guaranteedProfit > cashoutComparison.cashoutProfit 
                ? `Better by ${formatCurrency(cashoutComparison.difference)}`
                : `Worse by ${formatCurrency(Math.abs(cashoutComparison.difference))}`;
            resultEffectiveCashout.textContent = effectiveCashout;
        } else {
            resultEffectiveCashout.textContent = 'No cash-out offer';
        }
        
        // Update outcome breakdown
        outcomeOriginalProfit.textContent = formatCurrency(hedgeResults.originalWinProfit);
        outcomeOriginalReturn.textContent = formatCurrency(hedgeResults.originalWinTotalReturn);
        
        outcomeHedgeProfit.textContent = formatCurrency(hedgeResults.hedgeWinProfit);
        outcomeHedgeReturn.textContent = formatCurrency(hedgeResults.hedgeWinTotalReturn);
        
        outcomeGuaranteedProfit.textContent = formatCurrency(hedgeResults.guaranteedProfit);
        outcomeRiskLevel.textContent = getRiskLevel(hedgeResults.guaranteedProfit, originalStake);
        
        // Update comparison table
        updateComparisonTable(originalStake, originalOdds, currentOdds, hedgeResults, cashoutOffer);
    }

    // Event Listeners
    modeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            modeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentMode = this.dataset.mode;
            updateHedgeOptions(currentMode);
            if (areAllInputsValid()) {
                calculate();
            }
        });
    });

    oddsFormatSelect.addEventListener('change', function() {
        updatePlaceholders();
        validateOddsInput(originalOddsInput, originalOddsError);
        validateOddsInput(currentOddsInput, currentOddsError);
        originalOddsInput.classList.remove('invalid-input');
        currentOddsInput.classList.remove('invalid-input');
        originalOddsError.classList.remove('show');
        currentOddsError.classList.remove('show');
        autoCalculate();
    });

    syncToggle.addEventListener('change', updateSyncStatus);

    // Clear red border on focus
    originalOddsInput.addEventListener('focus', function() {
        if (this.classList.contains('invalid-input')) {
            this.classList.remove('invalid-input');
            originalOddsError.classList.remove('show');
        }
    });

    currentOddsInput.addEventListener('focus', function() {
        if (this.classList.contains('invalid-input')) {
            this.classList.remove('invalid-input');
            currentOddsError.classList.remove('show');
        }
    });

    // Auto-calculate only when inputs are valid
    originalOddsInput.addEventListener('input', function() {
        validateOddsInput(originalOddsInput, originalOddsError);
        autoCalculate();
    });

    currentOddsInput.addEventListener('input', function() {
        validateOddsInput(currentOddsInput, currentOddsError);
        autoCalculate();
    });

    originalStakeInput.addEventListener('input', autoCalculate);
    cashoutOfferInput.addEventListener('input', autoCalculate);

    calculateBtn.addEventListener('click', calculate);

    resetBtn.addEventListener('click', function() {
        originalStakeInput.value = '100';
        originalOddsInput.value = '3.00';
        currentOddsInput.value = '2.50';
        cashoutOfferInput.value = '';
        
        modeBtns.forEach(btn => btn.classList.remove('active'));
        modeBtns[0].classList.add('active');
        currentMode = 'profit';
        
        updateHedgeOptions(currentMode);
        selectedOption = 'guaranteed';
        
        updatePlaceholders();
        validateOddsInput(originalOddsInput, originalOddsError);
        validateOddsInput(currentOddsInput, currentOddsError);
        
        calculate();
    });

    // Initialize info icons tooltips
    function initInfoIcons() {
        document.querySelectorAll('.info-icon').forEach(icon => {
            icon.addEventListener('mouseenter', function() {
                this.style.zIndex = '1001';
            });
            icon.addEventListener('mouseleave', function() {
                this.style.zIndex = '';
            });
        });
    }

    // Initialize
    updateSyncStatus();
    updatePlaceholders();
    updateHedgeOptions(currentMode);
    validateOddsInput(originalOddsInput, originalOddsError);
    validateOddsInput(currentOddsInput, currentOddsError);
    initInfoIcons();
    calculate();
});