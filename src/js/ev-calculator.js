document.addEventListener('DOMContentLoaded', function() {
            // ===== THEME TOGGLE =====
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

            function handleDetailsForScreen() {
                const detailsList = document.querySelectorAll("details.instruction-section");
                if (window.innerWidth >= 1200) {
                    detailsList.forEach(detail => detail.setAttribute("open", ""));
                }
                else {
                    detailsList.forEach(detail => detail.removeAttribute("open"));
                }
            }

            handleDetailsForScreen();
            window.addEventListener("resize", handleDetailsForScreen);

            // ===== CALCULATOR VARIABLES =====
            const stakeInput = document.getElementById('stake-input');
            const oddsFormatSelect = document.getElementById('odds-format');
            const oddsInput = document.getElementById('odds-input');
            const probabilitySlider = document.getElementById('probability-slider');
            const probabilityInput = document.getElementById('probability-input');
            const probabilityValue = document.getElementById('probability-value');
            const calculateBtn = document.getElementById('calculate-btn');
            const resetBtn = document.getElementById('reset-btn');
            const analyzeBtn = document.getElementById('analyze-btn');
            
            // Error elements
            const stakeError = document.getElementById('stake-error');
            const oddsError = document.getElementById('odds-error');
            const probabilityError = document.getElementById('probability-error');
            
            // Result elements
            const evValue = document.getElementById('ev-value');
            const evDescription = document.getElementById('ev-description');
            const resultStake = document.getElementById('result-stake');
            const resultProfit = document.getElementById('result-profit');
            const resultImplied = document.getElementById('result-implied');
            const resultYourProb = document.getElementById('result-your-prob');
            const resultReturn = document.getElementById('result-return');
            const resultRoi = document.getElementById('result-roi');
            const resultBreakeven = document.getElementById('result-breakeven');
            const resultEdge = document.getElementById('result-edge');
            
            // Advanced analysis
            const advancedAnalysis = document.getElementById('advanced-analysis');
            const longTermProfit = document.getElementById('long-term-profit');
            const avgProfit = document.getElementById('avg-profit');
            const stdDev = document.getElementById('std-dev');
            const riskLevel = document.getElementById('risk-level');
            const probProfit = document.getElementById('prob-profit');
            const kellyPercent = document.getElementById('kelly-percent');
            const riskRuin = document.getElementById('risk-ruin');
            const recommendation = document.getElementById('recommendation');

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

            // ===== VALIDATION FUNCTIONS =====
            
            // Validate stake
            function validateStake() {
                const value = parseFloat(stakeInput.value);
                if (isNaN(value) || value <= 0) {
                    stakeInput.classList.add('input-error');
                    stakeError.textContent = 'Stake must be greater than 0';
                    stakeError.classList.add('show');
                    return false;
                }
                else if ((!/^[0-9.]*$/.test(stakeInput.value)) || (/([.]).*?\1/.test(stakeInput.value))) {
                    stakeInput.classList.add('input-error');
                    stakeError.textContent = 'Stake must be valid';
                    stakeError.classList.add('show');
                    return false;
                }
                stakeInput.classList.remove('input-error');
                stakeError.classList.remove('show');
                return true;
            }
            
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
                
                if ((!/^[0-9.]*$/.test(trimmed)) || (/([.]).*?\1/.test(trimmed))) {
                    return {
                        valid: false,
                        message: 'Invalid decimal number'
                    };
                }

                if (isNaN(decimalValue)) {
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
                const format = oddsFormatSelect.value;
                
                if (oddsStr === '') {
                    oddsInput.classList.add('input-error');
                    oddsError.textContent = 'Please enter odds';
                    oddsError.classList.add('show');
                    return false;
                }
                
                let validationResult;
                
                switch(format) {
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
                    // REMOVED SHAKE ANIMATION
                    return false;
                }
            }
            
            // Validate probability
            function validateProbability() {
                const value = parseFloat(probabilityInput.value);
                if (isNaN(value) || value < 0.1 || value > 99.9) {
                    probabilityInput.classList.add('input-error');
                    probabilityError.textContent = 'Probability must be between 0.1% and 99.9%';
                    probabilityError.classList.add('show');
                    return false;
                }
                probabilityInput.classList.remove('input-error');
                probabilityError.classList.remove('show');
                return true;
            }
            
            // Validate all inputs
            function validateAllInputs() {
                const stakeValid = validateStake();
                const oddsValid = validateOdds();
                const probabilityValid = validateProbability();
                
                return stakeValid && oddsValid && probabilityValid;
            }
            
            // Clear all errors
            function clearErrors() {
                stakeInput.classList.remove('input-error');
                oddsInput.classList.remove('input-error');
                probabilityInput.classList.remove('input-error');
                
                stakeError.classList.remove('show');
                oddsError.classList.remove('show');
                probabilityError.classList.remove('show');
            }
            
            // ===== CALCULATION FUNCTIONS =====
            
            // Convert odds to decimal
            function toDecimal(odds, format) {
                if (!odds || odds.trim() === '') return null;
                
                const str = odds.trim();
                
                switch(format) {
                    case 'decimal':
                        return parseFloat(str);
                    case 'fractional':
                        const [num, den] = str.split('/').map(Number);
                        return (num / den) + 1;
                    case 'american':
                        if (str.startsWith('+')) {
                            const value = parseInt(str.substring(1));
                            return (value / 100) + 1;
                        } else if (str.startsWith('-')) {
                            const value = parseInt(str.substring(1));
                            return (100 / value) + 1;
                        }
                        return null;
                    default:
                        return null;
                }
            }
            
            // Calculate implied probability
            function calculateImpliedProbability(decimalOdds) {
                return (1 / decimalOdds) * 100;
            }
            
            // Calculate EV
            function calculateEV(stake, decimalOdds, winProbability) {
                const winProb = winProbability / 100;
                const loseProb = 1 - winProb;
                const profit = stake * (decimalOdds - 1);
                return (winProb * profit) - (loseProb * stake);
            }
            
            // Format currency
            function formatCurrency(amount, showSign = true) {
                if (isNaN(amount) || amount === null) return '-';
                const sign = showSign && amount > 0 ? '+' : '';
                return sign + '$' + Math.abs(amount).toFixed(2);
            }
            
            // Format percentage
            function formatPercentage(value, showSign = true) {
                if (isNaN(value) || value === null) return '-';
                const sign = showSign && value > 0 ? '+' : '';
                return sign + value.toFixed(2) + '%';
            }
            
            // ===== EVENT LISTENERS =====
            
            // Probability slider sync
            probabilitySlider.addEventListener('input', function() {
                const value = this.value;
                probabilityInput.value = value;
                probabilityValue.textContent = value + '%';
                validateProbability();
                autoCalculate();
            });
            
            probabilityInput.addEventListener('input', function() {
                let value = parseFloat(this.value);
                //if (isNaN(value)) value = 50;
                if (value < 0.1) value = 0.1;
                if (value > 99.9) value = 99.9;
                
                this.value = value;
                probabilitySlider.value = value;
                probabilityValue.textContent = value.toFixed(1) + '%';
                validateProbability();
                autoCalculate();
            });
            
            // Input validation
            stakeInput.addEventListener('input', function() {
                validateStake();
                autoCalculate();
            });
            
            oddsInput.addEventListener('input', function() {
                validateOdds();
                autoCalculate();
            });
            
            oddsFormatSelect.addEventListener('change', function() {
                // Clear odds error when format changes
                oddsInput.classList.remove('input-error');
                oddsError.classList.remove('show');
                
                // Update placeholder based on format
                const format = this.value;
                switch(format) {
                    case 'decimal':
                        oddsInput.placeholder = 'e.g., 2.50';
                        break;
                    case 'fractional':
                        oddsInput.placeholder = 'e.g., 3/2';
                        break;
                    case 'american':
                        oddsInput.placeholder = 'e.g., +150 or -200';
                        break;
                }
                autoCalculate();
            });
            
            // Calculate button
            calculateBtn.addEventListener('click', function() {
                if (validateAllInputs()) {
                    calculate();
                }
            });
            
            // Reset button
            resetBtn.addEventListener('click', function() {
                stakeInput.value = '100';
                oddsFormatSelect.value = 'decimal';
                oddsInput.value = '';
                oddsInput.placeholder = 'e.g., 2.50';
                probabilitySlider.value = '50';
                probabilityInput.value = '50';
                probabilityValue.textContent = '50%';
                
                clearErrors();
                hideResults();
                advancedAnalysis.classList.add('hidden');
            });
            
            // Analyze button
            analyzeBtn.addEventListener('click', function() {
                if (validateAllInputs()) {
                    calculate();
                    advancedAnalysis.classList.remove('hidden');
                }
            });
            
            // Auto-calculate
            function autoCalculate() {
                if (validateAllInputs()) {
                    calculate();
                }
            }
            
            // Main calculation
            function calculate() {
                // Get values
                const stake = parseFloat(stakeInput.value);
                const format = oddsFormatSelect.value;
                const odds = oddsInput.value.trim();
                const probability = parseFloat(probabilityInput.value);
                
                // Convert odds
                const decimalOdds = toDecimal(odds, format);
                if (!decimalOdds || decimalOdds < 1) {
                    oddsInput.classList.add('input-error');
                    oddsError.textContent = 'Invalid odds value';
                    oddsError.classList.add('show');
                    return;
                }
                
                // Calculate
                const impliedProb = calculateImpliedProbability(decimalOdds);
                const ev = calculateEV(stake, decimalOdds, probability);
                const profit = stake * (decimalOdds - 1);
                const expectedReturn = stake + ev;
                const roi = (ev / stake) * 100;
                const breakEvenProb = calculateImpliedProbability(decimalOdds);
                const edge = probability - impliedProb;
                
                // Update results
                resultStake.textContent = formatCurrency(stake, false);
                resultProfit.textContent = formatCurrency(profit, true);
                resultImplied.textContent = formatPercentage(impliedProb, false);
                resultYourProb.textContent = formatPercentage(probability, false);
                resultReturn.textContent = formatCurrency(expectedReturn, false);
                resultRoi.textContent = formatPercentage(roi, true);
                resultBreakeven.textContent = formatPercentage(breakEvenProb, false);
                resultEdge.textContent = formatPercentage(edge, true);
                
                // Update EV display
                evValue.textContent = formatCurrency(ev, true);
                evValue.className = 'ev-value';
                
                if (ev > 0) {
                    evValue.classList.add('positive');
                    evDescription.textContent = `This bet has positive expected value. You'll make an average of ${formatPercentage(roi, true)} per bet in the long run.`;
                    evValue.parentElement.parentElement.classList.add('positive-bg');
                    evValue.parentElement.parentElement.classList.remove('negative-bg');
                } else if (ev < 0) {
                    evValue.classList.add('negative');
                    evDescription.textContent = `This bet has negative expected value. You'll lose an average of ${formatPercentage(Math.abs(roi), false)} per bet in the long run.`;
                    evValue.parentElement.parentElement.classList.add('negative-bg');
                    evValue.parentElement.parentElement.classList.remove('positive-bg');
                } else {
                    evValue.classList.add('neutral');
                    evDescription.textContent = 'This bet has zero expected value (break-even in the long run).';
                    evValue.parentElement.parentElement.classList.remove('positive-bg', 'negative-bg');
                }
                
                // Update advanced analysis
                if (!advancedAnalysis.classList.contains('hidden')) {
                    updateAdvancedAnalysis(stake, decimalOdds, probability, ev, edge);
                }
            }
            
            // Update advanced analysis
            function updateAdvancedAnalysis(stake, decimalOdds, probability, ev, edge) {
                // Long-term projection
                const numBets = 100;
                const longTermEv = ev * numBets;
                const stdDeviation = Math.sqrt(numBets * (probability/100) * (1 - probability/100)) * stake * (decimalOdds - 1);
                
                longTermProfit.textContent = formatCurrency(longTermEv, true);
                avgProfit.textContent = formatCurrency(ev, true);
                stdDev.textContent = formatCurrency(stdDeviation, false);
                
                // Risk assessment
                const winProb = probability;
                const variance = winProb * (100 - winProb) / 100;
                let riskLevelText = 'Low';
                if (variance > 20) riskLevelText = 'High';
                else if (variance > 10) riskLevelText = 'Medium';
                
                const kelly = ((decimalOdds - 1) * (winProb/100) - (1 - winProb/100)) / (decimalOdds - 1);
                const kellyPercentValue = Math.max(0, Math.min(kelly * 100, 20));
                
                let riskRuinText = 'Low';
                if (winProb < 50) riskRuinText = 'High';
                else if (winProb < 70) riskRuinText = 'Medium';
                
                riskLevel.textContent = riskLevelText;
                probProfit.textContent = formatPercentage(winProb, false);
                kellyPercent.textContent = formatPercentage(kellyPercentValue, false);
                riskRuin.textContent = riskRuinText;
                
                // Recommendation
                let recText = 'NEUTRAL';
                if (ev > 0) {
                    if (edge > 5) recText = 'STRONG VALUE BET';
                    else if (edge > 2) recText = 'VALUE BET';
                    else recText = 'WEAK VALUE';
                } else if (ev < 0) {
                    if (edge < -5) recText = 'STRONG AVOID';
                    else if (edge < -2) recText = 'AVOID';
                    else recText = 'WEAK AVOID';
                }
                
                recommendation.textContent = recText;
                recommendation.style.backgroundColor = '';
                recommendation.style.color = '';
                recommendation.style.border = '';
                
                if (recText.includes('VALUE')) {
                    recommendation.style.backgroundColor = 'rgba(39, 174, 96, 0.2)';
                    recommendation.style.color = 'var(--success-color)';
                    recommendation.style.border = '2px solid var(--success-color)';
                } else if (recText.includes('AVOID')) {
                    recommendation.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
                    recommendation.style.color = 'var(--accent-color)';
                    recommendation.style.border = '2px solid var(--accent-color)';
                } else {
                    recommendation.style.backgroundColor = 'rgba(149, 165, 166, 0.2)';
                    recommendation.style.color = 'var(--gray-color)';
                    recommendation.style.border = '2px solid var(--gray-color)';
                }
            }
            
            // Hide results
            function hideResults() {
                evValue.textContent = '$0.00';
                evValue.className = 'ev-value neutral';
                evDescription.textContent = 'Enter values above to calculate Expected Value';
                evValue.parentElement.parentElement.classList.remove('positive-bg', 'negative-bg');
                
                resultStake.textContent = '-';
                resultProfit.textContent = '-';
                resultImplied.textContent = '-';
                resultYourProb.textContent = '-';
                resultReturn.textContent = '-';
                resultRoi.textContent = '-';
                resultBreakeven.textContent = '-';
                resultEdge.textContent = '-';
            }
            
            // Initialize
            stakeInput.focus();
            setTimeout(() => {
                if (stakeInput.value && oddsInput.value) {
                    autoCalculate();
                }
            }, 100);
        });