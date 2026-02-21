
document.addEventListener('DOMContentLoaded', function() {
    // ===== THEME TOGGLE FUNCTIONALITY =====
    const themeSwitch = document.getElementById('theme-switch');
    const body = document.body;
    const lightLabel = document.getElementById('light-label');
    const darkLabel = document.getElementById('dark-label');

    // Check for saved theme preference
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


    // ===== IMPLIED PROBABILITY CALCULATOR LOGIC =====
    
    // DOM Elements
    const oddsTypeBtns = document.querySelectorAll('.odds-type-btn');
    const oddsInput = document.getElementById('odds-input');
    const oddsFormatSelect = document.getElementById('odds-format');
    const stakeInput = document.getElementById('stake-input');
    const addOutcomeBtn = document.getElementById('add-outcome');
    const outcomesContainer = document.getElementById('outcomes-container');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const clearOutcomesBtn = document.getElementById('clear-outcomes');
    
    // Error elements
    const oddsError = document.getElementById('odds-error');
    const stakeError = document.getElementById('stake-error');
    
    // Result elements
    const singleResult = document.getElementById('single-result');
    const multiResult = document.getElementById('multi-result');
    const probabilityValue = document.getElementById('probability-value');
    const probabilityText = document.getElementById('probability-text');
    const resultDecimal = document.getElementById('result-decimal');
    const resultFractional = document.getElementById('result-fractional');
    const resultAmerican = document.getElementById('result-american');
    const resultReturn = document.getElementById('result-return');
    const totalProbability = document.getElementById('total-probability');
    const overround = document.getElementById('overround');
    const fairOdds = document.getElementById('fair-odds');
    const bookmakerMargin = document.getElementById('bookmaker-margin');
    const outcomesResults = document.getElementById('outcomes-results');

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

    // Odds format state
    let currentOddsFormat = 'decimal';
    let outcomeCounter = 0;
    let outcomes = [];

    // ===== VALIDATION FUNCTIONS (From EV Calculator) =====
    
    // Validate American odds
    function validateAmericanOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        
        // Check if it starts with + or -
        if (!trimmed.startsWith('+') && !trimmed.startsWith('-')) {
            return {
                valid: false,
                message: 'American odds must start with + or -'
            };
        }
        else if ((!/^[0-9+-]*$/.test(trimmed)) || (trimmed.includes("+") && trimmed.indexOf("+") !== 0) || (trimmed.includes("-") && trimmed.indexOf("-") !== 0) || (/([+-]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'American odds must be valid'
            };
        }
        
        // Get the number part
        const numberPart = trimmed.substring(1);
        const numberValue = parseInt(numberPart);
        
        if (isNaN(numberValue)) {
            return {
                valid: false,
                message: 'Invalid number after + or -'
            };
        }
        
        // Check absolute value >= 100
        if (Math.abs(numberValue) < 100) {
            return {
                valid: false,
                message: 'American odds must be ≥ 100 (e.g., +150 or -200)'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate fractional odds
    function validateFractionalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        
        if (!trimmed.includes('/')) {
            return {
                valid: false,
                message: 'Fractional odds need a slash (e.g., 3/2)'
            };
        }
        else if ((!/^[0-9/]*$/.test(trimmed)) || (/([/]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'Fractional odds must be valid (e.g., 3/2)'
            };
        }
        
        const parts = trimmed.split('/');
        if (parts.length !== 2) {
            return {
                valid: false,
                message: 'Invalid format (e.g., 3/2)'
            };
        }
        
        const numerator = parseInt(parts[0]);
        const denominator = parseInt(parts[1]);
        
        if (isNaN(numerator) || isNaN(denominator)) {
            return {
                valid: false,
                message: 'Both numbers must be valid'
            };
        }
        
        if (denominator === 0) {
            return {
                valid: false,
                message: 'Denominator cannot be zero'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate decimal odds
    function validateDecimalOdds(oddsStr) {
        const trimmed = oddsStr.trim();
        const decimalValue = parseFloat(trimmed);
        
        if (isNaN(decimalValue)) {
            return {
                valid: false,
                message: 'Invalid decimal number'
            };
        }
        else if ((!/^[0-9.]*$/.test(trimmed)) || (/([.]).*?\1/.test(trimmed))) {
            return {
                valid: false,
                message: 'Invalid decimal number'
            };
        }
        
        if (decimalValue < 1) {
            return {
                valid: false,
                message: 'Decimal odds must be ≥ 1.00'
            };
        }
        
        return {
            valid: true,
            value: trimmed
        };
    }
    
    // Validate odds based on format
    function validateOdds() {
        const oddsStr = oddsInput.value.trim();
        
        if (oddsStr === '') {
            oddsInput.classList.add('input-error');
            oddsError.textContent = 'Please enter odds';
            oddsError.classList.add('show');
            return false;
        }
        
        let validationResult;
        
        switch(currentOddsFormat) {
            case 'american':
                validationResult = validateAmericanOdds(oddsStr);
                break;
            case 'fractional':
                validationResult = validateFractionalOdds(oddsStr);
                break;
            case 'decimal':
                validationResult = validateDecimalOdds(oddsStr);
                break;
            default:
                validationResult = { valid: false, message: 'Invalid format' };
        }
        
        if (validationResult.valid) {
            oddsInput.classList.remove('input-error');
            oddsError.classList.remove('show');
            return true;
        } else {
            oddsInput.classList.add('input-error');
            oddsError.textContent = validationResult.message;
            oddsError.classList.add('show');
            return false;
        }
    }
    
    // Validate stake (optional but if entered must be valid)
    function validateStake() {
        const value = stakeInput.value.trim();
        
        // If empty, it's valid (optional)
        if (value === '') {
            stakeInput.classList.remove('input-error');
            stakeError.classList.remove('show');
            return true;
        }
        else if ((!/^[0-9.]*$/.test(value)) || (/([.]).*?\1/.test(value))) {
            stakeInput.classList.add('input-error');
            stakeError.textContent = 'Stake must be valid';
            stakeError.classList.add('show');
            return false;
        }
        
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue <= 0) {
            stakeInput.classList.add('input-error');
            stakeError.textContent = 'Stake must be greater than 0';
            stakeError.classList.add('show');
            return false;
        }
        
        stakeInput.classList.remove('input-error');
        stakeError.classList.remove('show');
        return true;
    }
    
    // Validate all inputs
    function validateAllInputs() {
        const oddsValid = validateOdds();
        const stakeValid = validateStake();
        
        return oddsValid && stakeValid;
    }
    
    // Clear all errors
    function clearErrors() {
        oddsInput.classList.remove('input-error');
        stakeInput.classList.remove('input-error');
        
        oddsError.classList.remove('show');
        stakeError.classList.remove('show');
        
        // Clear errors from outcome inputs
        const outcomeInputs = document.querySelectorAll('.outcome-odds');
        outcomeInputs.forEach(input => {
            input.classList.remove('input-error');
        });
    }

    // ===== ODDS CONVERSION FUNCTIONS =====
    
    // Convert any odds format to decimal
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
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value)) return null;
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value === 0) return null;
                    return (100 / Math.abs(value)) + 1;
                } else {
                    // Try to parse as number
                    const value = parseFloat(str);
                    if (isNaN(value)) return null;
                    return value >= 100 ? (value / 100) + 1 : (100 / Math.abs(value)) + 1;
                }
                
            default:
                return null;
        }
    }
    
    // Calculate implied probability from decimal odds
    function calculateProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    // Decimal to fractional - COMPLETELY FIXED VERSION
    function decimalToFractional(decimal) {
        if (!decimal || decimal < 1) return '-';
        
        // Get the fractional part (decimal odds minus 1)
        const value = decimal - 1;
        
        // Check for common fractions exactly (with tolerance for floating point errors)
        const tolerance = 0.001;
        const commonFractions = [
            {value: 0.1, fraction: '1/10'},
            {value: 0.111, fraction: '1/9'},
            {value: 0.125, fraction: '1/8'},
            {value: 0.143, fraction: '1/7'},
            {value: 0.167, fraction: '1/6'},
            {value: 0.2, fraction: '1/5'},
            {value: 0.25, fraction: '1/4'},
            {value: 0.333, fraction: '1/3'},
            {value: 0.375, fraction: '3/8'},
            {value: 0.4, fraction: '2/5'},
            {value: 0.429, fraction: '3/7'},
            {value: 0.5, fraction: '1/2'},
            {value: 0.6, fraction: '3/5'},
            {value: 0.625, fraction: '5/8'},
            {value: 0.667, fraction: '2/3'},
            {value: 0.714, fraction: '5/7'},
            {value: 0.75, fraction: '3/4'},
            {value: 0.8, fraction: '4/5'},
            {value: 0.833, fraction: '5/6'},
            {value: 0.875, fraction: '7/8'},
            {value: 0.9, fraction: '9/10'},
            {value: 1.0, fraction: '1/1'},
            {value: 1.1, fraction: '11/10'},
            {value: 1.111, fraction: '10/9'},
            {value: 1.125, fraction: '9/8'},
            {value: 1.143, fraction: '8/7'},
            {value: 1.167, fraction: '7/6'},
            {value: 1.2, fraction: '6/5'},
            {value: 1.25, fraction: '5/4'},
            {value: 1.333, fraction: '4/3'},
            {value: 1.375, fraction: '11/8'},
            {value: 1.4, fraction: '7/5'},
            {value: 1.429, fraction: '10/7'},
            {value: 1.5, fraction: '3/2'},
            {value: 1.6, fraction: '8/5'},
            {value: 1.625, fraction: '13/8'},
            {value: 1.667, fraction: '5/3'},
            {value: 1.714, fraction: '12/7'},
            {value: 1.75, fraction: '7/4'},
            {value: 1.8, fraction: '9/5'},
            {value: 1.833, fraction: '11/6'},
            {value: 1.875, fraction: '15/8'},
            {value: 1.9, fraction: '19/10'},
            {value: 2.0, fraction: '2/1'},
            {value: 2.1, fraction: '21/10'},
            {value: 2.2, fraction: '11/5'},
            {value: 2.25, fraction: '9/4'},
            {value: 2.333, fraction: '7/3'},
            {value: 2.375, fraction: '19/8'},
            {value: 2.4, fraction: '12/5'},
            {value: 2.5, fraction: '5/2'},
            {value: 2.6, fraction: '13/5'},
            {value: 2.625, fraction: '21/8'},
            {value: 2.667, fraction: '8/3'},
            {value: 2.75, fraction: '11/4'},
            {value: 2.8, fraction: '14/5'},
            {value: 2.833, fraction: '17/6'},
            {value: 2.875, fraction: '23/8'},
            {value: 2.9, fraction: '29/10'},
            {value: 3.0, fraction: '3/1'},
            {value: 3.2, fraction: '16/5'},
            {value: 3.25, fraction: '13/4'},
            {value: 3.333, fraction: '10/3'},
            {value: 3.5, fraction: '7/2'},
            {value: 3.75, fraction: '15/4'},
            {value: 4.0, fraction: '4/1'},
            {value: 4.333, fraction: '13/3'},
            {value: 4.5, fraction: '9/2'},
            {value: 4.75, fraction: '19/4'},
            {value: 5.0, fraction: '5/1'},
            {value: 5.5, fraction: '11/2'},
            {value: 6.0, fraction: '6/1'},
            {value: 6.5, fraction: '13/2'},
            {value: 7.0, fraction: '7/1'},
            {value: 7.5, fraction: '15/2'},
            {value: 8.0, fraction: '8/1'},
            {value: 8.5, fraction: '17/2'},
            {value: 9.0, fraction: '9/1'},
            {value: 9.5, fraction: '19/2'},
            {value: 10.0, fraction: '10/1'}
        ];
        
        // Check for exact common fraction matches first
        for (let i = 0; i < commonFractions.length; i++) {
            if (Math.abs(value - commonFractions[i].value) < tolerance) {
                return commonFractions[i].fraction;
            }
        }
    
        
        // First try denominators up to 100
        let bestNumerator = 1;
        let bestDenominator = 1;
        let bestError = Math.abs(value - 1);
        
        for (let denominator = 1; denominator <= 100; denominator++) {
            const numerator = Math.round(value * denominator);
            const error = Math.abs(value - (numerator / denominator));
            
            if (error < bestError) {
                bestError = error;
                bestNumerator = numerator;
                bestDenominator = denominator;
            }
            
            // If we have a good enough approximation, use it
            if (error < 0.005) {
                break;
            }
        }
        
        // If we have a good approximation, simplify and return it
        if (bestError < 0.01) {
            // Simplify the fraction
            const gcd = (a, b) => {
                while (b !== 0) {
                    const temp = b;
                    b = a % b;
                    a = temp;
                }
                return a;
            };
            
            const divisor = gcd(bestNumerator, bestDenominator);
            const simpleNumerator = bestNumerator / divisor;
            const simpleDenominator = bestDenominator / divisor;
            
            // Return the fraction
            return simpleNumerator + '/' + simpleDenominator;
        }
        
        // If we can't find a good simple fraction, return the decimal representation
        return value.toFixed(2) + '/1';
    }
    
    // Decimal to American
    function decimalToAmerican(decimal) {
        if (!decimal) return '-';
        if (decimal >= 2.00) {
            return "+" + Math.round((decimal - 1) * 100);
        } else {
            return "-" + Math.round(100 / (decimal - 1));
        }
    }
    
    // Format probability text
    function getProbabilityText(probability) {
        if (probability >= 80) return "Very Likely";
        if (probability >= 60) return "Likely";
        if (probability >= 40) return "Possible";
        if (probability >= 20) return "Unlikely";
        return "Very Unlikely";
    }

    // ===== EVENT LISTENERS =====
    
    // Odds format buttons
    oddsTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            oddsTypeBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update format
            currentOddsFormat = this.dataset.format;
            oddsFormatSelect.value = currentOddsFormat;
            
            // Update placeholder
            switch(currentOddsFormat) {
                case 'decimal':
                    oddsInput.placeholder = "e.g., 2.50 (must be ≥ 1)";
                    break;
                case 'fractional':
                    oddsInput.placeholder = "e.g., 3/2 (must be a/b)";
                    break;
                case 'american':
                    oddsInput.placeholder = "e.g., +150 or -200 (must start with +/- and ≥ 100)";
                    break;
            }
            
            // Clear validation
            oddsInput.classList.remove('input-error');
            oddsError.classList.remove('show');
            
            // Update all outcome inputs
            const outcomeInputs = document.querySelectorAll('.outcome-odds');
            outcomeInputs.forEach(input => {
                input.dataset.format = currentOddsFormat;
                input.placeholder = currentOddsFormat === 'decimal' ? '2.50' : 
                                    currentOddsFormat === 'fractional' ? '3/2' : '+150';
                input.classList.remove('input-error');
            });
            
            // Clear and focus
            oddsInput.value = '';
            oddsInput.focus();
            hideResults();
        });
    });
    
    // Input validation and auto-conversion
    oddsInput.addEventListener('input', function() {
        validateOdds();
        if (validateAllInputs()) {
            autoCalculateIfValid();
        }
    });
    
    stakeInput.addEventListener('input', function() {
        validateStake();
        if (validateAllInputs()) {
            autoCalculateIfValid();
        }
    });
    
    // Add outcome
    addOutcomeBtn.addEventListener('click', function() {
        outcomeCounter++;
        const outcomeId = `outcome-${outcomeCounter}`;
        
        const outcomeRow = document.createElement('div');
        outcomeRow.className = 'outcome-row';
        outcomeRow.id = outcomeId;
        
        outcomeRow.innerHTML = `
            <label>Outcome ${outcomeCounter}:</label>
            <input type="text" inputmode="text" maxlength="13" class="outcome-odds" placeholder="${currentOddsFormat === 'decimal' ? '2.50' : currentOddsFormat === 'fractional' ? '3/2' : '+150'}" data-format="${currentOddsFormat}">
            <button type="button" class="remove-outcome" data-id="${outcomeId}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        outcomesContainer.appendChild(outcomeRow);
        
        // Add to outcomes array
        outcomes.push({
            id: outcomeId,
            odds: '',
            decimal: null,
            probability: 0
        });
        
        // Add event listeners to new outcome input
        const outcomeOddsInput = outcomeRow.querySelector('.outcome-odds');
        outcomeOddsInput.addEventListener('input', function() {
            // Validate the outcome input
            const value = this.value.trim();
            let isValid = false;
            let validationResult;
            
            switch(currentOddsFormat) {
                case 'american':
                    validationResult = validateAmericanOdds(value);
                    isValid = validationResult.valid;
                    break;
                case 'fractional':
                    validationResult = validateFractionalOdds(value);
                    isValid = validationResult.valid;
                    break;
                case 'decimal':
                    validationResult = validateDecimalOdds(value);
                    isValid = validationResult.valid;
                    break;
            }
            
            if (value === '') {
                this.classList.remove('input-error');
            } else if (!isValid) {
                this.classList.add('input-error');
            } else {
                this.classList.remove('input-error');
            }
            
            const decimal = toDecimal(value, currentOddsFormat);
            const index = outcomes.findIndex(o => o.id === outcomeId);
            
            if (index !== -1) {
                outcomes[index].odds = value;
                outcomes[index].decimal = decimal;
                outcomes[index].probability = decimal ? calculateProbability(decimal) : 0;
            }
            
            // Auto-calculate if all outcomes have valid odds
            autoCalculateMultipleOutcomes();
        });
        
        // Add remove event listener
        outcomeRow.querySelector('.remove-outcome').addEventListener('click', function() {
            const id = this.dataset.id;
            removeOutcome(id);
            autoCalculateMultipleOutcomes();
        });
        
        // Hide single result when adding outcomes
        singleResult.classList.add('hidden');
    });
    
    // Remove outcome
    function removeOutcome(id) {
        // Remove from DOM
        const element = document.getElementById(id);
        if (element) {
            element.remove();
        }
        
        // Remove from array
        const index = outcomes.findIndex(o => o.id === id);
        if (index !== -1) {
            outcomes.splice(index, 1);
        }
        
        // Renumber remaining outcomes
        const remainingOutcomes = outcomesContainer.querySelectorAll('.outcome-row');
        remainingOutcomes.forEach((row, index) => {
            const label = row.querySelector('label');
            label.textContent = `Outcome ${index + 1}:`;
        });
        
        outcomeCounter = remainingOutcomes.length;
    }
    
    // Auto-calculate if valid
    function autoCalculateIfValid() {
        const decimalOdds = toDecimal(oddsInput.value.trim(), currentOddsFormat);
        
        if (decimalOdds && outcomes.length === 0) {
            const probability = calculateProbability(decimalOdds);
            
            // Update display
            probabilityValue.textContent = probability.toFixed(2) + '%';
            probabilityText.textContent = getProbabilityText(probability);
            
            // Update odds conversions
            resultDecimal.textContent = decimalOdds.toFixed(2);
            resultFractional.textContent = decimalToFractional(decimalOdds);
            resultAmerican.textContent = decimalToAmerican(decimalOdds);
            
            // Calculate potential return if stake is provided
            const stake = parseFloat(stakeInput.value);
            if (!isNaN(stake) && stake > 0) {
                const returnAmount = stake * decimalOdds;
                resultReturn.textContent = '$' + returnAmount.toFixed(2);
            } else {
                resultReturn.textContent = '-';
            }
            
            // Show single result
            singleResult.classList.remove('hidden');
            multiResult.classList.add('hidden');
        } else if (!decimalOdds) {
            // Hide results if input becomes invalid
            singleResult.classList.add('hidden');
        }
    }
    
    // Auto-calculate multiple outcomes
    function autoCalculateMultipleOutcomes() {
        // Filter valid outcomes
        const validOutcomes = outcomes.filter(o => o.decimal !== null);
        
        if (validOutcomes.length === 0) {
            multiResult.classList.add('hidden');
            return;
        }
        
        // Calculate total probability
        let totalProb = 0;
        validOutcomes.forEach(outcome => {
            totalProb += outcome.probability;
        });
        
        // Calculate market metrics
        const overroundValue = totalProb - 100;
        const fairProbability = totalProb > 0 ? 100 / totalProb : 0;
        const fairOddsValue = totalProb > 0 ? 1 / (fairProbability / 100) : 0;
        const bookmakerMarginValue = totalProb > 0 ? ((totalProb - 100) / totalProb) * 100 : 0;
        
        // Update market metrics display
        totalProbability.textContent = totalProb.toFixed(2) + '%';
        overround.textContent = overroundValue.toFixed(2) + '%';
        fairOdds.textContent = fairOddsValue.toFixed(2);
        bookmakerMargin.textContent = bookmakerMarginValue.toFixed(2) + '%';
        
        // Update individual outcomes display
        outcomesResults.innerHTML = '';
        validOutcomes.forEach((outcome, index) => {
            const fairProb = totalProb > 0 ? (outcome.probability / totalProb) * 100 : 0;
            const fairDecimal = 1 / (fairProb / 100);
            const value = outcome.probability < fairProb ? 'Value Bet!' : 'No Value';
            const valueClass = outcome.probability < fairProb ? 'value-bet' : 'no-value';
            
            const outcomeCard = document.createElement('div');
            outcomeCard.className = 'result-card';
            outcomeCard.innerHTML = `
                <h4>Outcome ${index + 1}</h4>
                <div style="font-size: 0.8rem; margin-bottom: 5px;">Odds: ${outcome.odds}</div>
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <small>Implied: ${outcome.probability.toFixed(2)}%</small>
                    </div>
                    <div>
                        <small>Fair: ${fairProb.toFixed(2)}%</small>
                    </div>
                </div>
                <div class="${valueClass}" style="margin-top: 5px; font-weight: bold;">
                    ${value}
                </div>
            `;
            
            outcomesResults.appendChild(outcomeCard);
        });
        
        // Add CSS for value indicators
        if (!document.querySelector('#value-styles')) {
            const style = document.createElement('style');
            style.id = 'value-styles';
            style.textContent = `
                .value-bet { color: var(--success-color); }
                .no-value { color: var(--accent-color); }
            `;
            document.head.appendChild(style);
        }
        
        // Show multi result
        singleResult.classList.add('hidden');
        multiResult.classList.remove('hidden');
    }
    
    // Clear all outcomes
    clearOutcomesBtn.addEventListener('click', function() {
        outcomesContainer.innerHTML = '';
        outcomes = [];
        outcomeCounter = 0;
        hideResults();
    });
    
    // Calculate button
    calculateBtn.addEventListener('click', function() {
        // Force validation and calculation
        const mainOdds = oddsInput.value.trim();
        const hasMainOdds = mainOdds !== '';
        
        if (hasMainOdds && validateAllInputs()) {
            autoCalculateIfValid();
        }
        
        if (outcomes.length > 0) {
            autoCalculateMultipleOutcomes();
        }
        
        if (!hasMainOdds && outcomes.length === 0) {
            oddsInput.classList.add('input-error');
            oddsError.textContent = 'Please enter odds or add outcomes to calculate';
            oddsError.classList.add('show');
        }
    });
    
    // Hide results
    function hideResults() {
        singleResult.classList.add('hidden');
        multiResult.classList.add('hidden');
        clearErrors();
    }
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        oddsInput.value = '';
        stakeInput.value = '';
        outcomesContainer.innerHTML = '';
        outcomes = [];
        outcomeCounter = 0;
        
        // Reset format to default
        oddsTypeBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('.odds-type-btn[data-format="decimal"]').classList.add('active');
        currentOddsFormat = 'decimal';
        oddsFormatSelect.value = 'decimal';
        oddsInput.placeholder = "e.g., 2.50 (must be ≥ 1)";
        
        hideResults();
    });
    
    // Initialize
    oddsInput.focus();
});