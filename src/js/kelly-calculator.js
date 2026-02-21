
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


    // ===== KELLY CRITERION CALCULATOR LOGIC =====
    
    // DOM Elements
    const bankrollInput = document.getElementById('bankroll-input');
    const oddsFormatSelect = document.getElementById('odds-format');
    const oddsInput = document.getElementById('odds-input');
    const oddsError = document.getElementById('odds-error');
    const probabilityInput = document.getElementById('probability-input');
    const fractionBtns = document.querySelectorAll('.fraction-btn');
    const customFractionContainer = document.getElementById('custom-fraction-container');
    const customFractionInput = document.getElementById('custom-fraction');
    const calculateBtn = document.getElementById('calculate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const simulateBtn = document.getElementById('simulate-btn');
    
    // Result elements
    const kellyValue = document.getElementById('kelly-value');
    const kellyDescription = document.getElementById('kelly-description');
    const resultPercentage = document.getElementById('result-percentage');
    const resultBet = document.getElementById('result-bet');
    const resultEv = document.getElementById('result-ev');
    const resultGrowth = document.getElementById('result-growth');
    const resultEdge = document.getElementById('result-edge');
    const resultRuin = document.getElementById('result-ruin');
    const resultVolatility = document.getElementById('result-volatility');
    const resultLongterm = document.getElementById('result-longterm');
    const sizingTableBody = document.getElementById('sizing-table-body');
    const simulationSection = document.getElementById('simulation-section');
    const runSimulationBtn = document.getElementById('run-simulation');
    const simBetsInput = document.getElementById('sim-bets');
    const simIterationsInput = document.getElementById('sim-iterations');
    const simulationChart = document.getElementById('simulation-chart');
    const simulationStats = document.getElementById('simulation-stats');

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

    // State
    let currentFraction = 1; // Full Kelly by default
    let currentKellyPercentage = 0;
    let isValidOdds = false;

    let lastSimulations = null;
    let lastInitialBankroll = null;
    let lastNumBets = null;

    // ===== ODDS PLACEHOLDER MANAGEMENT =====
    function updateOddsPlaceholder() {
        const format = oddsFormatSelect.value;
        let placeholder = '';
        
        switch(format) {
            case 'decimal':
                placeholder = 'e.g., 2.50';
                break;
            case 'fractional':
                placeholder = 'e.g., 3/2';
                break;
            case 'american':
                placeholder = 'e.g., +150 or -200';
                break;
        }
        
        oddsInput.placeholder = placeholder;
    }
    
    // Initial placeholder setup
    updateOddsPlaceholder();

    // ===== ODDS VALIDATION =====
    function validateAmericanOdds(odds) {
        const str = odds.trim();
        if (!str.match(/^[+-]/)) {
            return { valid: false, message: 'American odds must start with + or -' };
        }

        if ((!/^[0-9+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str)) || (/^[+-]/.test(str) && /[./]/.test(str))) {
            return { valid: false, message: 'American odds must be valid' };
        }
        
        if (str.startsWith('+')) {
            const value = parseInt(str.substring(1));
            if (isNaN(value) || value < 100) {
                return { valid: false, message: 'Positive American odds must be ≥ +100' };
            }
        } else if (str.startsWith('-')) {
            const value = parseInt(str.substring(1));
            if (isNaN(value) || value < 100) {
                return { valid: false, message: 'Negative American odds must be ≤ -100' };
            }
        }
        
        return { valid: true, message: '' };
    }

    function validateFractionalOdds(odds) {
        const str = odds.trim();
        if (!str.includes('/')) {
            return { valid: false, message: 'Fractional odds must contain / (e.g., 3/2)' };
        }

        if ((!/^[0-9/]*$/.test(str)) || (/([/]).*?\1/.test(str))) {
            return { valid: false, message: 'Fractional odds must contain / (e.g., 3/2)' };
        }
        
        const [numerator, denominator] = str.split('/');
        const num = parseFloat(numerator);
        const den = parseFloat(denominator);
        
        if (isNaN(num) || isNaN(den) || den === 0) {
            return { valid: false, message: 'Invalid fractional format (e.g., 3/2)' };
        }
        
        return { valid: true, message: '' };
    }

    function validateDecimalOdds(odds) {
        const num = parseFloat(odds);
        if (isNaN(num) || num < 1) {
            return { valid: false, message: 'Decimal odds must be ≥ 1.0' };
        }

        if ((!/^[0-9.]*$/.test(odds)) || (/([.]).*?\1/.test(odds))) {
            return { valid: false, message: 'Decimal odds must be valid' };
        }
        
        return { valid: true, message: '' };
    }

    function validateOdds(odds, format) {
        if (!odds || odds.trim() === '') {
            return { valid: false, message: 'Please enter odds' };
        }
        
        switch(format) {
            case 'american':
                return validateAmericanOdds(odds);
            case 'fractional':
                return validateFractionalOdds(odds);
            case 'decimal':
                return validateDecimalOdds(odds);
            default:
                return { valid: false, message: 'Invalid odds format' };
        }
    }

    function updateOddsValidation() {
        const format = oddsFormatSelect.value;
        const odds = oddsInput.value.trim();
        const validation = validateOdds(odds, format);
        
        if (odds === '') {
            oddsInput.classList.remove('input-error', 'input-valid');
            oddsError.style.display = 'none';
            oddsError.textContent = '';
            isValidOdds = false;
            return;
        }
        
        if (validation.valid) {
            oddsInput.classList.remove('input-error');
            oddsInput.classList.add('input-valid');
            oddsError.style.display = 'none';
            oddsError.textContent = '';
            isValidOdds = true;
        } else {
            oddsInput.classList.remove('input-valid');
            oddsInput.classList.add('input-error');
            oddsError.style.display = 'block';
            oddsError.textContent = validation.message;
            isValidOdds = false;
        }
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
    
    // Calculate implied probability from decimal odds
    function calculateImpliedProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    // Format currency
    function formatCurrency(amount, showSign = true) {
        if (isNaN(amount) || amount === null) return '-';
        const sign = showSign && amount > 0 ? '+' : '';
        return sign + '$' + Math.abs(parseFloat(amount)).toFixed(2);
    }
    
    // Format percentage
    function formatPercentage(value, showSign = true) {
        if (isNaN(value) || value === null) return '-';
        const sign = showSign && value > 0 ? '+' : '';
        return sign + parseFloat(value).toFixed(2) + '%';
    }
    
    // Calculate Kelly percentage
    function calculateKellyPercentage(decimalOdds, winProbability) {
        if (!decimalOdds || !winProbability) return null;
        
        const winProb = winProbability / 100;
        const loseProb = 1 - winProb;
        const b = decimalOdds - 1; // net odds
        
        // Kelly formula: f* = (bp - q) / b
        // where f* = fraction of bankroll to bet
        // b = net odds (decimal odds - 1)
        // p = probability of winning
        // q = probability of losing (1 - p)
        const kelly = ((b * winProb) - loseProb) / b;
        
        // Return as percentage (0-100%)
        return Math.max(0, kelly * 100);
    }
    
    // Calculate EV
    function calculateEV(stake, decimalOdds, winProbability) {
        if (!stake || !decimalOdds || !winProbability) return null;
        
        const winProb = winProbability / 100;
        const loseProb = 1 - winProb;
        const profit = stake * (decimalOdds - 1);
        
        // EV = (Probability of Winning × Profit) - (Probability of Losing × Stake)
        return (winProb * profit) - (loseProb * stake);
    }
    
    // Calculate expected growth rate
    function calculateGrowthRate(kellyFraction, decimalOdds, winProbability) {
        if (!kellyFraction || !decimalOdds || !winProbability) return null;
        
        const winProb = winProbability / 100;
        const loseProb = 1 - winProb;
        const b = decimalOdds - 1;
        const f = kellyFraction; // fraction of Kelly to use
        
        // Expected log growth: p * log(1 + bf) + q * log(1 - f)
        // Convert to percentage growth
        const growth = Math.exp(winProb * Math.log(1 + b * f) + loseProb * Math.log(1 - f)) - 1;
        return growth * 100;
    }
    
    // Calculate edge
    function calculateEdge(winProbability, impliedProbability) {
        if (!winProbability || !impliedProbability) return null;
        return winProbability - impliedProbability;
    }
    
    // Calculate risk of ruin (simplified)
    function calculateRiskOfRuin(kellyFraction) {
        if (!kellyFraction) return null;
        
        // Simplified risk of ruin calculation
        // Full Kelly has theoretically 0% risk of ruin
        // This is a rough approximation for fractional Kelly
        if (kellyFraction <= 0.25) return '< 0.1%';
        if (kellyFraction <= 0.5) return '0.1-1%';
        if (kellyFraction <= 0.75) return '1-5%';
        return '5-10%';
    }
    
    // Calculate volatility
    function calculateVolatility(kellyFraction, decimalOdds, winProbability) {
        if (!kellyFraction || !decimalOdds || !winProbability) return null;
        
        const winProb = winProbability / 100;
        const loseProb = 1 - winProb;
        const b = decimalOdds - 1;
        const f = kellyFraction;
        
        // Variance of single bet
        const variance = winProb * Math.pow(b * f, 2) + loseProb * Math.pow(-f, 2);
        const stdDev = Math.sqrt(variance);
        
        // Annualized volatility (assuming 1000 bets per year)
        return stdDev * Math.sqrt(1000) * 100;
    }
    
    // Calculate long-term ROI
    function calculateLongTermROI(kellyFraction, edge, decimalOdds) {
        if (!kellyFraction || !edge || !decimalOdds) return null;
        
        // Simplified long-term ROI calculation
        const b = decimalOdds - 1;
        const expectedROI = (edge / 100) * b * kellyFraction * 100;
        return expectedROI;
    }
    
    // Get Kelly description
    function getKellyDescription(kellyPercent, fraction) {
        if (kellyPercent === null) return 'Enter values above to calculate optimal bet size';
        
        if (kellyPercent === 0) {
            return 'No bet recommended - This bet has no positive expected value.';
        }
        
        const fractionNames = {
            1: 'Full Kelly',
            0.5: 'Half Kelly',
            0.25: 'Quarter Kelly',
            0.125: 'Eighth Kelly'
        };
        
        const fractionName = fractionNames[fraction] || `Custom (${fraction}× Kelly)`;
        
        if (kellyPercent > 20) {
            return `⚠️ Warning: ${fractionName} suggests a very large bet. Consider using a smaller fraction or verifying your probability estimate.`;
        } else if (kellyPercent > 10) {
            return `${fractionName} suggests an aggressive bet size. Make sure your probability estimate is accurate.`;
        } else if (kellyPercent > 5) {
            return `${fractionName} suggests a moderately sized bet.`;
        } else {
            return `${fractionName} suggests a conservative bet size.`;
        }
    }
    
    // Update bet sizing table
    function updateSizingTable(kellyPercent) {
        if (!kellyPercent || kellyPercent <= 0) {
            sizingTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; color: var(--accent-color);">
                        No positive EV - Do not bet
                    </td>
                </tr>
            `;
            return;
        }
        
        const bankrollSizes = [100, 500, 1000, 5000, 10000, 50000];
        let tableHTML = '';
        
        bankrollSizes.forEach(bankroll => {
            const fullBet = bankroll * (kellyPercent / 100);
            const halfBet = bankroll * (kellyPercent / 100) * 0.5;
            const quarterBet = bankroll * (kellyPercent / 100) * 0.25;
            
            tableHTML += `
                <tr>
                    <td class="bankroll-amount">$${bankroll.toLocaleString()}</td>
                    <td>$${fullBet.toFixed(2)}</td>
                    <td>$${halfBet.toFixed(2)}</td>
                    <td>$${quarterBet.toFixed(2)}</td>
                </tr>
            `;
        });
        
        sizingTableBody.innerHTML = tableHTML;
    }

    // ===== EVENT LISTENERS =====
    
    // Update placeholder when odds format changes
    oddsFormatSelect.addEventListener('change', function() {
        updateOddsPlaceholder();
        updateOddsValidation();
        autoCalculate();
    });
    
    // Odds validation on input
    oddsInput.addEventListener('input', updateOddsValidation);
    
    // Kelly fraction buttons
    fractionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Update active button
            fractionBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Update fraction
            const fraction = parseFloat(this.dataset.fraction);
            currentFraction = fraction;
            
            // Show/hide custom fraction input
            if (fraction === 0) {
                customFractionContainer.style.display = 'flex';
                currentFraction = parseFloat(customFractionInput.value) || 0.5;
            } else {
                customFractionContainer.style.display = 'none';
            }
            
            // Recalculate if we have data
            autoCalculate();
        });
    });
    
    // Custom fraction input
    customFractionInput.addEventListener('input', function() {
        let value = parseFloat(this.value);
        if (isNaN(value)) value = 0.5;
        if (value < 0) value = 0;
        if (value > 1) value = 1;
        
        this.value = value;
        currentFraction = value;
        autoCalculate();
    });
    
    // Auto-calculate when inputs change
    bankrollInput.addEventListener('input', autoCalculate);
    probabilityInput.addEventListener('input', autoCalculate);
    
    // Calculate button
    calculateBtn.addEventListener('click', calculate);
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        bankrollInput.value = '1000';
        oddsFormatSelect.value = 'decimal';
        updateOddsPlaceholder();
        oddsInput.value = '';
        probabilityInput.value = '50';
        
        // Reset fraction buttons
        fractionBtns.forEach(btn => btn.classList.remove('active'));
        fractionBtns[0].classList.add('active'); // Full Kelly
        customFractionContainer.style.display = 'none';
        currentFraction = 1;
        
        // Reset validation
        oddsInput.classList.remove('input-error', 'input-valid');
        oddsError.style.display = 'none';
        oddsError.textContent = '';
        isValidOdds = false;
        
        hideResults();
        simulationSection.classList.add('hidden');
    });
    
    // Simulate button
    simulateBtn.addEventListener('click', function() {
        if (calculate()) {
            simulationSection.classList.remove('hidden');
            // Run simulation after a short delay to ensure chart is visible
            setTimeout(runSimulation, 100);
        }
    });
    
    // Run simulation button
    runSimulationBtn.addEventListener('click', runSimulation);
    
    // Auto-calculate function
    function autoCalculate() {
        // Only calculate if we have all required inputs
        const bankroll = parseFloat(bankrollInput.value);
        const odds = oddsInput.value.trim();
        const probability = parseFloat(probabilityInput.value);
        
        if (!isNaN(bankroll) && bankroll > 0 && odds !== '' && !isNaN(probability) && isValidOdds  && (/^[0-9.]*$/.test(bankrollInput.value)) && (!/([.]).*?\1/.test(bankrollInput.value))) {
            calculate();
        }
    }
    
    // Main calculation function
    function calculate() {
        // Get inputs
        const bankroll = parseFloat(bankrollInput.value);
        const oddsFormat = oddsFormatSelect.value;
        const odds = oddsInput.value.trim();
        const probability = parseFloat(probabilityInput.value);
        
        // Validate inputs
        if (isNaN(bankroll) || bankroll <= 0) {
            alert('Please enter a valid bankroll amount (greater than 0).');
            return false;
        }
        
        if (odds === '') {
            alert('Please enter odds.');
            return false;
        }
        
        if (!isValidOdds) {
            alert('Please enter valid odds.');
            return false;
        }
        
        if (isNaN(probability) || probability <= 0 || probability >= 100) {
            alert('Please enter a valid probability between 0.1% and 99.9%.');
            return false;
        }
        
        // Convert odds to decimal
        const decimalOdds = toDecimal(odds, oddsFormat);
        if (!decimalOdds || decimalOdds < 1) {
            alert('Please enter valid odds.');
            return false;
        }
        
        // Calculate Kelly percentage
        const kellyPercent = calculateKellyPercentage(decimalOdds, probability);
        currentKellyPercentage = kellyPercent;
        
        // Apply selected fraction
        const appliedKellyPercent = kellyPercent * currentFraction;
        const recommendedBet = bankroll * (appliedKellyPercent / 100);
        
        // Calculate other metrics
        const impliedProb = calculateImpliedProbability(decimalOdds);
        const ev = calculateEV(recommendedBet, decimalOdds, probability);
        const edge = calculateEdge(probability, impliedProb);
        const growthRate = calculateGrowthRate(appliedKellyPercent / 100, decimalOdds, probability);
        const riskOfRuin = calculateRiskOfRuin(currentFraction);
        const volatility = calculateVolatility(appliedKellyPercent / 100, decimalOdds, probability);
        const longTermROI = calculateLongTermROI(currentFraction, edge, decimalOdds);
        
        // Update results
        kellyValue.textContent = formatCurrency(recommendedBet, false);
        kellyDescription.textContent = getKellyDescription(kellyPercent, currentFraction);
        
        // Style kelly value based on risk
        kellyValue.parentElement.parentElement.className = 'kelly-display';
        if (appliedKellyPercent > 10) {
            kellyValue.parentElement.parentElement.classList.add('warning-bg');
        } else if (appliedKellyPercent <= 0) {
            kellyValue.parentElement.parentElement.classList.add('danger-bg');
        }
        
        resultPercentage.textContent = formatPercentage(appliedKellyPercent, false);
        resultBet.textContent = formatCurrency(recommendedBet, false);
        resultEv.textContent = formatCurrency(ev, true);
        resultGrowth.textContent = formatPercentage(growthRate, true);
        resultEdge.textContent = formatPercentage(edge, true);
        resultRuin.textContent = riskOfRuin;
        resultVolatility.textContent = formatPercentage(volatility, false);
        resultLongterm.textContent = formatPercentage(longTermROI, true);
        
        // Style result values
        styleResultValue(resultEv, ev);
        styleResultValue(resultGrowth, growthRate);
        styleResultValue(resultEdge, edge);
        styleResultValue(resultLongterm, longTermROI);
        
        // Update bet sizing table
        updateSizingTable(kellyPercent);
        return true;
    }
    
    // Style result value based on positivity/negativity
    function styleResultValue(element, value) {
        element.className = 'result-value';
        if (value > 0) {
            element.classList.add('positive');
        } else if (value < 0) {
            element.classList.add('negative');
        } else if (value === 0) {
            element.classList.add('warning');
        }
    }
    
    // Hide results
    function hideResults() {
        kellyValue.textContent = '-';
        kellyDescription.textContent = 'Enter values above to calculate optimal bet size';
        kellyValue.parentElement.parentElement.className = 'kelly-display';
        kellyValue.parentElement.parentElement.classList.remove('warning-bg', 'danger-bg');
        
        resultPercentage.textContent = '-';
        resultBet.textContent = '-';
        resultEv.textContent = '-';
        resultGrowth.textContent = '-';
        resultEdge.textContent = '-';
        resultRuin.textContent = '-';
        resultVolatility.textContent = '-';
        resultLongterm.textContent = '-';
        
        sizingTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center;">
                    Enter values to see bet sizing guide
                </td>
            </tr>
        `;
    }
        
    function runSimulation() {
        if (!isValidOdds) {
            alert('Please enter valid odds first.');
            return;
        }
        
        const numBets = parseInt(simBetsInput.value) || 100;
        const numSimulations = parseInt(simIterationsInput.value) || 10;
        
        // Input validation
        if (numBets < 10 || numBets > 1000) {
            alert('Number of bets must be between 10 and 1000.');
            return;
        }
        if (numSimulations < 1 || numSimulations > 50) {
            alert('Number of simulations must be between 1 and 50.');
            return;
        }
        if (currentKellyPercentage <= 0) {
            alert('Please calculate Kelly first with positive EV.');
            return;
        }
        
        // Get inputs
        const bankroll = parseFloat(bankrollInput.value);
        const oddsFormat = oddsFormatSelect.value;
        const odds = oddsInput.value.trim();
        const probability = parseFloat(probabilityInput.value);
        
        if (isNaN(bankroll) || odds === '' || isNaN(probability)) {
            alert('Please complete the calculator first.');
            return;
        }
        
        const decimalOdds = toDecimal(odds, oddsFormat);
        if (!decimalOdds) return;
        
        const appliedKellyPercent = currentKellyPercentage * currentFraction;
        const betFraction = appliedKellyPercent / 100;
        
        // Clear previous chart and show loading
        simulationChart.innerHTML = '';
        simulationChart.style.position = 'relative';
        simulationChart.style.minHeight = '400px';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.style.position = 'absolute';
        loadingDiv.style.top = '50%';
        loadingDiv.style.left = '50%';
        loadingDiv.style.transform = 'translate(-50%, -50%)';
        loadingDiv.style.color = 'var(--text-color)';
        loadingDiv.style.zIndex = '100';
        loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running simulations...';
        simulationChart.appendChild(loadingDiv);
        
        // Use setTimeout to allow UI update
        setTimeout(() => {
            // Run simulations
            const simulations = [];
            let maxBankroll = bankroll;
            let minBankroll = bankroll;
            
            for (let sim = 0; sim < numSimulations; sim++) {
                let currentBankroll = bankroll;
                const path = [currentBankroll];
                
                for (let bet = 0; bet < numBets; bet++) {
                    const betAmount = currentBankroll * betFraction;
                    const win = Math.random() * 100 < probability;
                    
                    if (win) {
                        currentBankroll += betAmount * (decimalOdds - 1);
                    } else {
                        currentBankroll -= betAmount;
                    }
                    
                    currentBankroll = Math.max(currentBankroll, bankroll * 0.01);
                    path.push(currentBankroll);
                    
                    maxBankroll = Math.max(maxBankroll, currentBankroll);
                    minBankroll = Math.min(minBankroll, currentBankroll);
                }
                simulations.push(path);
            }
            
            // Store simulations globally for access in click handlers
            lastSimulations = simulations;
            lastInitialBankroll = bankroll;
            lastNumBets = numBets;
            
            // Build chart with new features
            buildFullWidthChart(simulations, bankroll, numBets, maxBankroll, minBankroll);
            calculateSimulationStats(simulations, bankroll);
        }, 50);
    }

    function buildFullWidthChart(simulations, initialBankroll, numBets, maxValue, minValue) {
        simulationChart.innerHTML = '';
        
        // Add some padding to the range
        const range = maxValue - minValue;
        const padding = range * 0.1;
        const yMax = maxValue + padding;
        const yMin = Math.max(0, minValue - padding);
        
        // Chart dimensions
        const margin = { top: 30, right: 20, bottom: 60, left: 70 };
        const width = simulationChart.clientWidth - margin.left - margin.right;
        const height = simulationChart.clientHeight - margin.top - margin.bottom;
        
        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);
        svg.appendChild(chartGroup);
        
        // Draw background grid
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('class', 'grid');
        
        // Horizontal grid lines (5 lines)
        for (let i = 0; i <= 5; i++) {
            const y = height * (1 - i/5);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('y1', y);
            line.setAttribute('x2', width);
            line.setAttribute('y2', y);
            line.setAttribute('stroke', 'var(--border-color)');
            line.setAttribute('stroke-dasharray', '4,4');
            line.setAttribute('opacity', '0.3');
            gridGroup.appendChild(line);
        }
        
        // Vertical grid lines (10 lines)
        for (let i = 0; i <= 10; i++) {
            const x = width * i/10;
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', '0');
            line.setAttribute('x2', x);
            line.setAttribute('y2', height);
            line.setAttribute('stroke', 'var(--border-color)');
            line.setAttribute('stroke-dasharray', '4,4');
            line.setAttribute('opacity', '0.3');
            gridGroup.appendChild(line);
        }
        chartGroup.appendChild(gridGroup);
        
        // Colors
        const colors = [
            '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
            '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
            '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
            '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080'
        ];
        
        // Draw lines
        simulations.forEach((path, index) => {
            const color = colors[index % colors.length];
            let d = '';
            path.forEach((value, i) => {
                const x = (i / (path.length - 1)) * width;
                const y = height - ((value - yMin) / (yMax - yMin)) * height;
                if (i === 0) d += `M ${x} ${y}`;
                else d += ` L ${x} ${y}`;
            });
            
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', d);
            pathElement.setAttribute('stroke', color);
            pathElement.setAttribute('stroke-width', '1.5');
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('class', `sim-line sim-${index}`);
            pathElement.setAttribute('data-sim', index);
            
            // Add click handler for showing value tooltip
            pathElement.addEventListener('click', (e) => {
                e.stopPropagation();
                showTooltip(e, index, path, initialBankroll, width, height, yMin, yMax);
            });
            
            chartGroup.appendChild(pathElement);
        });
        
        // Draw axes
        const axesGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // X-axis line
        const xAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        xAxisLine.setAttribute('x1', '0');
        xAxisLine.setAttribute('y1', height);
        xAxisLine.setAttribute('x2', width);
        xAxisLine.setAttribute('y2', height);
        xAxisLine.setAttribute('stroke', 'var(--text-color)');
        xAxisLine.setAttribute('stroke-width', '2');
        axesGroup.appendChild(xAxisLine);
        
        // Y-axis line
        const yAxisLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        yAxisLine.setAttribute('x1', '0');
        yAxisLine.setAttribute('y1', '0');
        yAxisLine.setAttribute('x2', '0');
        yAxisLine.setAttribute('y2', height);
        yAxisLine.setAttribute('stroke', 'var(--text-color)');
        yAxisLine.setAttribute('stroke-width', '2');
        axesGroup.appendChild(yAxisLine);
        
        chartGroup.appendChild(axesGroup);
        
        // Add axis labels (THIS IS WHAT WAS MISSING!)
        const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Y-axis labels (5 labels)
        for (let i = 0; i <= 5; i++) {
            const value = yMin + (yMax - yMin) * (1 - i/5);
            const y = height * i/5;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', '-5');
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('fill', 'var(--text-color)');
            text.setAttribute('font-size', '10');
            text.textContent = formatCurrency(value, false);
            labelsGroup.appendChild(text);
        }
        
        // X-axis labels (6 labels - Start, Bet 20, Bet 40, etc.)
        for (let i = 0; i <= 5; i++) {
            const betNumber = Math.round(i * numBets / 5);
            const x = width * i/5;
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', height + 20);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'var(--text-color)');
            text.setAttribute('font-size', '10');
            text.textContent = betNumber === 0 ? 'Start' : `Bet ${betNumber}`;
            labelsGroup.appendChild(text);
        }
        
        chartGroup.appendChild(labelsGroup);
        
        // Add title
        const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        titleText.setAttribute('x', width/2);
        titleText.setAttribute('y', '-10');
        titleText.setAttribute('text-anchor', 'middle');
        titleText.setAttribute('fill', 'var(--text-color)');
        titleText.setAttribute('font-size', '12');
        titleText.setAttribute('font-weight', 'bold');
        titleText.textContent = 'Bankroll Growth Over Time';
        chartGroup.appendChild(titleText);
        
        simulationChart.appendChild(svg);
        
        // ===== HIGHLIGHT STATE =====
        let highlightedIndex = -1; // -1 means no highlight
        
        // ===== TOOLTIP ELEMENT =====
        const tooltip = document.createElement('div');
        tooltip.className = 'sim-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.display = 'none';
        tooltip.style.backgroundColor = 'var(--card-bg)';
        tooltip.style.border = '1px solid var(--border-color)';
        tooltip.style.borderRadius = '4px';
        tooltip.style.padding = '8px';
        tooltip.style.boxShadow = 'var(--box-shadow)';
        tooltip.style.zIndex = '100';
        tooltip.style.fontSize = '0.8rem';
        tooltip.style.pointerEvents = 'none';
        simulationChart.appendChild(tooltip);
        
        // ===== LEGEND =====
        const toggleBtn = document.createElement('button');
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> Show Simulations';
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.bottom = '5px';
        toggleBtn.style.right = '5px';
        toggleBtn.style.zIndex = '25';
        toggleBtn.style.padding = '5px 10px';
        toggleBtn.style.backgroundColor = 'var(--secondary-color)';
        toggleBtn.style.color = 'white';
        toggleBtn.style.border = 'none';
        toggleBtn.style.borderRadius = '4px';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.fontSize = '0.8rem';
        toggleBtn.style.boxShadow = 'var(--box-shadow)';
        
        const legendContainer = document.createElement('div');
        legendContainer.style.position = 'absolute';
        legendContainer.style.top = margin.top + 'px';
        legendContainer.style.right = '10px';
        legendContainer.style.zIndex = '30';
        legendContainer.style.display = 'none';
        legendContainer.style.backgroundColor = 'var(--card-bg)';
        legendContainer.style.border = '1px solid var(--border-color)';
        legendContainer.style.borderRadius = '5px';
        legendContainer.style.padding = '10px';
        legendContainer.style.maxWidth = '250px';
        legendContainer.style.maxHeight = '300px';
        legendContainer.style.overflowY = 'auto';
        legendContainer.style.boxShadow = 'var(--box-shadow)';
        
        const legendTitle = document.createElement('div');
        legendTitle.style.fontWeight = 'bold';
        legendTitle.style.marginBottom = '8px';
        legendTitle.style.paddingBottom = '4px';
        legendTitle.style.borderBottom = '1px solid var(--border-color)';
        legendTitle.textContent = 'Simulation Paths (click to highlight)';
        legendContainer.appendChild(legendTitle);
        
        simulations.forEach((path, index) => {
            const finalValue = path[path.length - 1];
            const profit = finalValue - initialBankroll;
            const profitAbs = Math.abs(profit);
            const profitFormatted = formatCurrency(profitAbs, false);
            const profitSign = profit > 0 ? '+' : '-';
            
            // Format: "Sim 1: $394.99 (-$605.01)" or "Sim 2: $1,643.79 (+$643.79)"
            const displayText = `Sim ${index + 1}: ${formatCurrency(finalValue, false)} (${profitSign}${profitFormatted})`;
            
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.marginBottom = '5px';
            item.style.cursor = 'pointer';
            item.style.padding = '3px 5px';
            item.style.borderRadius = '3px';
            item.setAttribute('data-sim', index);
            
            const colorBox = document.createElement('span');
            colorBox.style.display = 'inline-block';
            colorBox.style.width = '15px';
            colorBox.style.height = '15px';
            colorBox.style.backgroundColor = colors[index % colors.length];
            colorBox.style.marginRight = '8px';
            colorBox.style.borderRadius = '3px';
            
            const text = document.createElement('span');
            text.textContent = displayText;
            
            item.appendChild(colorBox);
            item.appendChild(text);
            
            // Hover to temporarily highlight
            item.addEventListener('mouseenter', () => {
                if (highlightedIndex === -1) { // Only if no permanent highlight
                    applyHighlight(index);
                }
            });
            item.addEventListener('mouseleave', () => {
                if (highlightedIndex === -1) {
                    removeHighlight();
                }
            });
            
            // Click to toggle permanent highlight
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                if (highlightedIndex === index) {
                    // Unhighlight
                    highlightedIndex = -1;
                    removeHighlight();
                } else {
                    // Highlight this one
                    highlightedIndex = index;
                    applyHighlight(index);
                }
            });
            
            legendContainer.appendChild(item);
        });
        
        // Helper functions for highlighting
        function applyHighlight(index) {
            const lines = simulationChart.querySelectorAll('.sim-line');
            lines.forEach((line, i) => {
                if (i === index) {
                    line.setAttribute('stroke-width', '3');
                    line.setAttribute('opacity', '1');
                } else {
                    line.setAttribute('opacity', '0.2');
                }
            });
        }
        
        function removeHighlight() {
            const lines = simulationChart.querySelectorAll('.sim-line');
            lines.forEach(line => {
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('opacity', '1');
            });
        }
        
        // Toggle legend visibility
        toggleBtn.addEventListener('click', () => {
            if (legendContainer.style.display === 'none') {
                legendContainer.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fas fa-times"></i> Hide Simulations';
            } else {
                legendContainer.style.display = 'none';
                toggleBtn.innerHTML = '<i class="fas fa-list"></i> Show Simulations';
            }
        });
        
        simulationChart.appendChild(toggleBtn);
        simulationChart.appendChild(legendContainer);
        
        // ===== TOOLTIP FUNCTION =====
        function showTooltip(event, simIndex, path, initial, width, height, yMin, yMax) {
            // Get mouse coordinates relative to the chart group
            const svgRect = svg.getBoundingClientRect();
            const mouseX = event.clientX - svgRect.left - margin.left;
            const mouseY = event.clientY - svgRect.top - margin.top;
            
            // Constrain to chart area
            if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
            
            // Find closest bet index based on x coordinate
            const betIndex = Math.round((mouseX / width) * numBets);
            const value = path[betIndex];
            const change = value - initial;
            const changeAbs = Math.abs(change);
            const changeSign = change > 0 ? '+' : '-';
            
            // Format tooltip content
            tooltip.innerHTML = `
                <strong>Simulation ${simIndex + 1}</strong><br>
                Bet #${betIndex}<br>
                Bankroll: ${formatCurrency(value, false)}<br>
                Change: ${changeSign}${formatCurrency(changeAbs, false)}
            `;
            
            // Position tooltip near mouse but within bounds
            const tooltipX = event.clientX - svgRect.left + 15;
            const tooltipY = event.clientY - svgRect.top - 40;
            tooltip.style.left = tooltipX + 'px';
            tooltip.style.top = tooltipY + 'px';
            tooltip.style.display = 'block';
            
            // Stop propagation to prevent document click from immediately hiding
            event.stopPropagation();
        }
        
        // Hide tooltip when clicking elsewhere
        document.addEventListener('click', function hideTooltip(e) {
            if (!e.target.closest('.sim-line') && !e.target.closest('.sim-tooltip')) {
                tooltip.style.display = 'none';
            }
        });
    }
    
    // Calculate simulation statistics
    function calculateSimulationStats(simulations, initialBankroll) {
        const finalValues = simulations.map(path => path[path.length - 1]);
        const profits = finalValues.map(value => value - initialBankroll);
        
        // Calculate statistics
        const avgFinal = finalValues.reduce((a, b) => a + b, 0) / finalValues.length;
        const avgProfit = profits.reduce((a, b) => a + b, 0) / profits.length;
        const maxProfit = Math.max(...profits);
        const minProfit = Math.min(...profits);
        const winningSimulations = profits.filter(p => p > 0).length;
        const winRate = (winningSimulations / simulations.length) * 100;
        
        // Calculate standard deviation
        const profitStdDev = Math.sqrt(
            profits.reduce((sq, n) => sq + Math.pow(n - avgProfit, 2), 0) / profits.length
        );
        
        // Calculate median
        const sortedProfits = [...profits].sort((a, b) => a - b);
        const medianProfit = sortedProfits.length % 2 === 0 
            ? (sortedProfits[sortedProfits.length/2 - 1] + sortedProfits[sortedProfits.length/2]) / 2
            : sortedProfits[Math.floor(sortedProfits.length/2)];
        
        // Format values for display
        const formatWithCommas = (num) => num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        // Display statistics
        simulationStats.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-top: 15px;">
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Average Final Bankroll</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: ${avgFinal > initialBankroll ? 'var(--success-color)' : 'var(--accent-color)'}">
                        ${formatCurrency(avgFinal, false)}
                    </div>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Average Profit</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: ${avgProfit > 0 ? 'var(--success-color)' : 'var(--accent-color)'}">
                        ${formatCurrency(avgProfit, true)}
                    </div>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Win Rate</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: ${winRate > 50 ? 'var(--success-color)' : 'var(--accent-color)'}">
                        ${winRate.toFixed(1)}%
                    </div>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Volatility</div>
                    <div style="font-weight: bold; font-size: 1.1rem; color: var(--warning-color)">
                        ${formatCurrency(profitStdDev, false)}
                    </div>
                </div>
            </div>
            <div style="margin-top: 15px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Median Profit</div>
                    <div style="font-weight: bold; font-size: 1rem; color: ${medianProfit > 0 ? 'var(--success-color)' : 'var(--accent-color)'}">
                        ${formatCurrency(medianProfit, true)}
                    </div>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Best Case</div>
                    <div style="font-weight: bold; font-size: 1rem; color: var(--success-color)">
                        ${formatCurrency(maxProfit, true)}
                    </div>
                </div>
                <div style="background-color: var(--card-bg); padding: 10px; border-radius: 5px; text-align: center;">
                    <div style="font-size: 0.8rem; color: var(--gray-color); margin-bottom: 5px;">Worst Case</div>
                    <div style="font-weight: bold; font-size: 1rem; color: var(--accent-color)">
                        ${formatCurrency(minProfit, true)}
                    </div>
                </div>
            </div>
            <div style="margin-top: 15px; font-size: 0.9rem; color: var(--text-color); background-color: var(--card-bg); padding: 10px; border-radius: 5px;">
                <strong>Interpretation:</strong> This simulation shows ${simulations.length} possible growth paths over ${simBetsInput.value} bets. Each line represents one possible outcome based on your Kelly betting strategy.
            </div>
        `;
    }

    // ===== INITIALIZATION =====
    
    // Set up initial state
    bankrollInput.focus();
    updateOddsValidation();
    
    // Auto-calculate if we have initial values
    setTimeout(() => {
        if (bankrollInput.value && oddsInput.value) {
            autoCalculate();
        }
    }, 100);
});