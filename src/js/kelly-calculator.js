
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

    // Auto-open details on desktop
    function handleDetailsForScreen() {
        const detailsList = document.querySelectorAll("details.instruction-section");
        if (window.innerWidth >= 1200) {
            detailsList.forEach(detail => detail.setAttribute("open", ""));
        } else {
            detailsList.forEach(detail => detail.removeAttribute("open"));
        }
    }
    
    handleDetailsForScreen();
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
        
        if (!isNaN(bankroll) && bankroll > 0 && odds !== '' && !isNaN(probability) && isValidOdds) {
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
    
    // Run simulation
    function runSimulation() {
        if (!isValidOdds) {
            alert('Please enter valid odds first.');
            return;
        }
        
        const numBets = parseInt(simBetsInput.value) || 100;
        const numSimulations = parseInt(simIterationsInput.value) || 10;
        
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
        
        // Get inputs for simulation
        const bankroll = parseFloat(bankrollInput.value);
        const oddsFormat = oddsFormatSelect.value;
        const odds = oddsInput.value.trim();
        const probability = parseFloat(probabilityInput.value);
        
        if (isNaN(bankroll) || odds === '' || isNaN(probability)) {
            alert('Please complete the calculator first.');
            return;
        }
        
        // Convert odds to decimal
        const decimalOdds = toDecimal(odds, oddsFormat);
        if (!decimalOdds) return;
        
        // Calculate applied Kelly
        const appliedKellyPercent = currentKellyPercentage * currentFraction;
        const betFraction = appliedKellyPercent / 100;
        
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
                
                // Never go below 1% of original bankroll
                currentBankroll = Math.max(currentBankroll, bankroll * 0.01);
                path.push(currentBankroll);
                
                // Update min/max for scaling
                maxBankroll = Math.max(maxBankroll, currentBankroll);
                minBankroll = Math.min(minBankroll, currentBankroll);
            }
            
            simulations.push(path);
        }
        
        // Draw chart
        drawSimulationChart(simulations, bankroll, numBets, maxBankroll, minBankroll);
        
        // Calculate statistics
        calculateSimulationStats(simulations, bankroll);
    }
    
    // Draw simulation chart
    function drawSimulationChart(simulations, initialBankroll, numBets, maxBankroll, minBankroll) {
        simulationChart.innerHTML = '';
        
        // Find min and max for scaling
        let maxValue = maxBankroll;
        let minValue = minBankroll;
        
        // Ensure we have a reasonable range
        const range = maxValue - minValue;
        if (range < initialBankroll * 0.1) {
            maxValue = initialBankroll * 1.5;
            minValue = Math.max(0, initialBankroll * 0.5);
        }
        
        // Add some padding to the range
        const rangePadding = (maxValue - minValue) * 0.05;
        maxValue += rangePadding;
        minValue = Math.max(0, minValue - rangePadding);
        
        const chartWidth = simulationChart.clientWidth;
        const chartHeight = simulationChart.clientHeight;
        const graphWidth = chartWidth - 50; // 50px for Y-axis
        const graphHeight = chartHeight - 30; // 30px for X-axis
        const valueRange = maxValue - minValue;
        
        // Create chart title
        const title = document.createElement('div');
        title.className = 'chart-title';
        title.textContent = 'Bankroll Growth Over Time';
        simulationChart.appendChild(title);
        
        // Create grid
        const grid = document.createElement('div');
        grid.className = 'chart-grid';
        
        // Add horizontal grid lines (5 lines)
        for (let i = 0; i <= 5; i++) {
            const y = (i / 5) * graphHeight;
            const gridLine = document.createElement('div');
            gridLine.className = 'chart-grid-line';
            gridLine.style.top = y + 'px';
            grid.appendChild(gridLine);
        }
        
        // Add vertical grid lines (10 lines)
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * graphWidth;
            const gridLine = document.createElement('div');
            gridLine.className = 'chart-grid-line vertical';
            gridLine.style.left = x + 'px';
            grid.appendChild(gridLine);
        }
        
        simulationChart.appendChild(grid);
        
        // Create Y-axis
        const yAxis = document.createElement('div');
        yAxis.className = 'chart-y-axis';
        
        // Add Y-axis labels (5 labels)
        for (let i = 0; i <= 5; i++) {
            const label = document.createElement('div');
            label.className = 'chart-y-label';
            const value = minValue + (5 - i) * (valueRange / 5);
            label.textContent = formatCurrency(value, false);
            yAxis.appendChild(label);
        }
        
        simulationChart.appendChild(yAxis);
        
        // Create X-axis
        const xAxis = document.createElement('div');
        xAxis.className = 'chart-x-axis';
        
        // Add X-axis labels (5 labels)
        for (let i = 0; i <= 5; i++) {
            const label = document.createElement('div');
            label.className = 'chart-x-label';
            const xPos = (i / 5) * 100;
            label.style.left = `${xPos}%`;
            const betNumber = Math.round(i * (numBets / 5));
            label.textContent = betNumber === 0 ? 'Start' : `Bet ${betNumber}`;
            simulationChart.appendChild(label);
        }
        
        simulationChart.appendChild(xAxis);
        
        // Draw each simulation path
        simulations.forEach((path, simIndex) => {
            // Create SVG for smooth line
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '50px';
            svg.style.zIndex = '2';
            
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            
            // Calculate path points
            let pathD = '';
            path.forEach((value, index) => {
                const x = (index / (path.length - 1)) * graphWidth;
                const y = graphHeight - ((value - minValue) / valueRange) * graphHeight;
                
                if (index === 0) {
                    pathD = `M ${x} ${y}`;
                } else {
                    pathD += ` L ${x} ${y}`;
                }
            });
            
            // Set path attributes
            pathElement.setAttribute('d', pathD);
            pathElement.setAttribute('stroke', simIndex === 0 ? 'var(--secondary-color)' : 
                                    `rgba(52, 152, 219, ${0.3 + (simIndex * 0.7 / simulations.length)})`);
            pathElement.setAttribute('stroke-width', '1.5');
            pathElement.setAttribute('fill', 'none');
            pathElement.setAttribute('stroke-linecap', 'round');
            pathElement.setAttribute('stroke-linejoin', 'round');
            
            svg.appendChild(pathElement);
            simulationChart.appendChild(svg);
        });
        
        // Add start point
        const startPoint = document.createElement('div');
        startPoint.className = 'chart-point';
        startPoint.style.left = '50px';
        startPoint.style.bottom = graphHeight - ((initialBankroll - minValue) / valueRange) * graphHeight + 'px';
        startPoint.style.backgroundColor = 'var(--success-color)';
        startPoint.title = `Start: ${formatCurrency(initialBankroll, false)}`;
        simulationChart.appendChild(startPoint);
        
        // Add end points for each simulation
        simulations.forEach((path, simIndex) => {
            const finalValue = path[path.length - 1];
            const endY = graphHeight - ((finalValue - minValue) / valueRange) * graphHeight;
            
            const endPoint = document.createElement('div');
            endPoint.className = 'chart-point';
            endPoint.style.left = 'calc(100% - 50px)';
            endPoint.style.bottom = endY + 'px';
            endPoint.style.backgroundColor = finalValue > initialBankroll ? 'var(--success-color)' : 'var(--accent-color)';
            endPoint.style.opacity = simIndex === 0 ? '1' : '0.7';
            endPoint.title = `Sim ${simIndex + 1}: ${formatCurrency(finalValue, false)}`;
            simulationChart.appendChild(endPoint);
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