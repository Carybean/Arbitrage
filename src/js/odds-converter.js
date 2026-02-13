
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

    // ===== ODDS CONVERTER LOGIC =====
    
    // DOM Elements
    const fromFormatSelect = document.getElementById('from-format');
    const toFormatSelect = document.getElementById('to-format');
    const oddsInput = document.getElementById('odds-input');
    const inputLabel = document.getElementById('input-label');
    const inputExample = document.getElementById('input-example');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-results');
    
    // Result display elements
    const resultDecimal = document.getElementById('result-decimal');
    const resultFractional = document.getElementById('result-fractional');
    const resultAmerican = document.getElementById('result-american');
    const resultIndonesian = document.getElementById('result-indonesian');
    const resultHongkong = document.getElementById('result-hongkong');
    const resultMalay = document.getElementById('result-malay');
    const resultProbability = document.getElementById('result-probability');

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
    
    // Format examples for the input placeholder
    const formatExamples = {
        decimal: { label: "Enter Decimal Odds", example: "e.g., 2.50", placeholder: "2.50" },
        fractional: { label: "Enter Fractional Odds", example: "e.g., 3/2 or 5/4", placeholder: "3/2" },
        american: { label: "Enter American Odds", example: "e.g., +150 or -200", placeholder: "+150" },
        indonesian: { label: "Enter Indonesian Odds", example: "e.g., +1.50 or -4.00", placeholder: "+1.50" },
        hongkong: { label: "Enter Hong Kong Odds", example: "e.g., 0.50", placeholder: "0.50" },
        malay: { label: "Enter Malay Odds", example: "e.g., +0.67 or -0.25", placeholder: "+0.67" }
    };

    // Update input label and placeholder based on selected format
    function updateInputDisplay() {
        const format = fromFormatSelect.value;
        const examples = formatExamples[format];
        
        inputLabel.textContent = examples.label;
        oddsInput.placeholder = examples.placeholder;
        inputExample.textContent = examples.example;
        
        // Clear previous validation
        oddsInput.classList.remove('valid', 'invalid');
    }

    // ===== ODDS CONVERSION FUNCTIONS =====
    
    // Convert any odds format to decimal
    function toDecimal(odds, format) {
        if (!odds || odds.trim() === '') return null;
        
        const str = odds.trim();
        
        switch(format) {
            case 'decimal':
                const decimal = parseFloat(str);
                return isNaN(decimal) || decimal < 1.01 ? null : decimal;
                
            case 'fractional':
                if (!str.includes('/')) return null;
                const [numerator, denominator] = str.split('/').map(Number);
                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
                const fracValue = (numerator / denominator) + 1;
                return fracValue >= 1.01 ? fracValue : null;
                
            case 'american':
                // Must start with + or - and have numbers >= 100
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    // For positive american odds, must be >= 100
                    if (isNaN(value) || value < 100) return null;
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    // For negative american odds, must be >= 100
                    if (isNaN(value) || value < 100) return null;
                    return (100 / Math.abs(value)) + 1;
                }
                return null;
                
            case 'indonesian':
                // Indonesian odds: +1.50 (for decimal 2.50) or -4.00 (for decimal 1.25)
                const indoValue = parseFloat(str);
                if (isNaN(indoValue)) return null;
                
                if (str.startsWith('+') || (!str.startsWith('-') && indoValue > 0)) {
                    // Positive Indonesian odds: decimal = indonesian + 1
                    if (indoValue >= 1.01) {
                        return indoValue + 1;
                    }
                } else if (str.startsWith('-') || indoValue < 0) {
                    // Negative Indonesian odds: decimal = (1 / |indonesian|) + 1
                    const absValue = Math.abs(indoValue);
                    if (absValue >= 1.01) {
                        return (1 / absValue) + 1;
                    }
                }
                return null;
                
            case 'hongkong':
                const hkValue = parseFloat(str);
                if (isNaN(hkValue) || hkValue < 0) return null;
                return hkValue + 1;
                
            case 'malay':
                const malayValue = parseFloat(str);
                if (isNaN(malayValue)) return null;
                
                if ((str.startsWith('+') && malayValue > 0) || (malayValue > 0 && malayValue < 1)) {
                    // Positive Malay odds: 0 < malay < 1
                    // decimal = (1 / malay) + 1
                    const decValue = (1 / malayValue) + 1;
                    return decValue >= 1.01 ? decValue : null;
                } else if ((str.startsWith('-') && malayValue < 0) || (malayValue < 0 && malayValue > -1)) {
                    // Negative Malay odds: -1 < malay < 0
                    // decimal = |malay| + 1
                    const decValue = Math.abs(malayValue) + 1;
                    return decValue >= 1.01 ? decValue : null;
                }
                return null;
                
            default:
                return null;
        }
    }
    
    // Calculate implied probability from decimal odds
    function calculateProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    // Decimal to fractional
    function decimalToFractional(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        
        // Convert decimal to profit:1 ratio
        const profit = decimal - 1;
        
        // Common betting fractions for quick lookup
        const bettingFractions = {
            '0.01': '1/100', '0.02': '1/50', '0.03': '1/33', '0.04': '1/25',
            '0.05': '1/20', '0.06': '1/16', '0.07': '1/14', '0.08': '1/12',
            '0.09': '1/11', '0.10': '1/10', '0.11': '1/9', '0.12': '1/8',
            '0.14': '1/7', '0.17': '1/6', '0.20': '1/5', '0.25': '1/4',
            '0.33': '1/3', '0.40': '2/5', '0.50': '1/2', '0.60': '3/5',
            '0.67': '2/3', '0.75': '3/4', '0.80': '4/5', '0.83': '5/6',
            '0.91': '10/11', '1.00': '1/1', '1.10': '11/10', '1.20': '6/5',
            '1.25': '5/4', '1.33': '4/3', '1.40': '7/5', '1.50': '3/2',
            '1.60': '8/5', '1.67': '5/3', '1.80': '4/5', '1.83': '5/6',
            '1.90': '10/11', '2.00': '2/1', '2.10': '11/10', '2.20': '6/5',
            '2.25': '9/4', '2.50': '5/2', '2.60': '8/5', '2.75': '11/4',
            '2.80': '9/5', '3.00': '3/1', '3.20': '11/5', '3.25': '9/4',
            '3.33': '10/3', '3.40': '12/5', '3.50': '5/2', '3.60': '13/5',
            '3.75': '11/4', '4.00': '4/1', '4.20': '16/5', '4.33': '10/3',
            '4.50': '9/2', '4.60': '18/5', '5.00': '5/1', '5.50': '9/2',
            '6.00': '6/1', '6.50': '11/2', '7.00': '7/1', '7.50': '13/2',
            '8.00': '8/1', '8.50': '15/2', '9.00': '9/1', '9.50': '17/2',
            '10.00': '10/1'
        };
        
        // Round profit to 2 decimal places for lookup
        const profitRounded = Math.round(profit * 100) / 100;
        const profitStr = profitRounded.toFixed(2);
        
        // First, try exact match with betting fractions
        if (bettingFractions[profitStr]) {
            return bettingFractions[profitStr];
        }
        
        // Try with 3 decimal places
        for (const [key, value] of Object.entries(bettingFractions)) {
            if (Math.abs(parseFloat(key) - profit) < 0.001) {
                return value;
            }
        }
        
        // For other values, calculate the fraction accurately
        let bestNumerator = 1;
        let bestDenominator = 1;
        let bestError = Math.abs(profit - (bestNumerator / bestDenominator));
        
        const maxDenominator = profit < 0.5 ? 200 : 100;
        
        for (let denominator = 1; denominator <= maxDenominator; denominator++) {
            const numerator = Math.round(profit * denominator);
            if (numerator < 1) continue;
            
            const currentError = Math.abs(profit - (numerator / denominator));
            if (currentError < bestError) {
                bestError = currentError;
                bestNumerator = numerator;
                bestDenominator = denominator;
            }
            
            if (bestError < 0.001) break;
        }
        
        // Simplify the fraction
        const gcd = (a, b) => {
            while (b) {
                const temp = b;
                b = a % b;
                a = temp;
            }
            return a;
        };
        
        const divisor = gcd(bestNumerator, bestDenominator);
        const simpleNumerator = bestNumerator / divisor;
        const simpleDenominator = bestDenominator / divisor;
        
        return `${simpleNumerator}/${simpleDenominator}`;
    }
    
    // Decimal to American
    function decimalToAmerican(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) {
            return "+" + Math.round((decimal - 1) * 100);
        } else {
            return "-" + Math.round(100 / (decimal - 1));
        }
    }
    
    // Decimal to Indonesian
    function decimalToIndonesian(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) {
            // For decimal >= 2.00: positive Indonesian odds (e.g., +1.50 for decimal 2.50)
            return ((decimal - 1) * 1).toFixed(2);
        } else {
            // For decimal < 2.00: negative Indonesian odds (e.g., -4.00 for decimal 1.25)
            const indoValue = -1 / (decimal - 1);
            return indoValue.toFixed(2);
        }
    }
    
    // Decimal to Hong Kong
    function decimalToHongKong(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        return (decimal - 1).toFixed(2);
    }
    
    // Decimal to Malay
    function decimalToMalay(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) {
            // For decimal >= 2.00: positive Malay odds (0 to 1)
            const malayValue = 1 / (decimal - 1);
            return malayValue.toFixed(2);
        } else {
            // For decimal < 2.00: negative Malay odds (-1 to 0)
            const malayValue = -(decimal - 1);
            return malayValue.toFixed(2);
        }
    }
    
    // Convert from decimal to specific format
    function decimalToFormat(decimal, format) {
        switch(format) {
            case 'decimal':
                return decimal.toFixed(2);
            case 'fractional':
                return decimalToFractional(decimal);
            case 'american':
                return decimalToAmerican(decimal);
            case 'indonesian':
                const indo = decimalToIndonesian(decimal);
                return indo.startsWith('-') ? indo : '+' + indo;
            case 'hongkong':
                return decimalToHongKong(decimal);
            case 'malay':
                const malay = decimalToMalay(decimal);
                return malay.startsWith('-') ? malay : '+' + malay;
            default:
                return '-';
        }
    }

    // ===== VALIDATION FUNCTIONS =====
    
    // Validate input
    function validateInput() {
        const value = oddsInput.value.trim();
        if (!value) {
            oddsInput.classList.remove('invalid', 'valid');
            return false;
        }
        
        const format = fromFormatSelect.value;
        const decimal = toDecimal(value, format);
        const isValid = decimal !== null && decimal >= 1.01;
        
        if (isValid) {
            oddsInput.classList.remove('invalid');
            oddsInput.classList.add('valid');
        } else {
            oddsInput.classList.remove('valid');
            oddsInput.classList.add('invalid');
        }
        
        return isValid;
    }
    
    // Clear validation
    function clearValidation() {
        oddsInput.classList.remove('invalid', 'valid');
    }

    // ===== CALCULATION FUNCTIONS =====
    
    // Calculate conversion
    function calculateConversion() {
        const value = oddsInput.value.trim();
        if (!value) {
            clearResults();
            return false;
        }
        
        if (!validateInput()) {
            clearResults();
            return false;
        }
        
        const fromFormat = fromFormatSelect.value;
        const decimalValue = toDecimal(value, fromFormat);
        
        if (decimalValue && decimalValue >= 1.01) {
            updateAllResults(decimalValue);
            return true;
        } else {
            clearResults();
            return false;
        }
    }
    
    // Update all results
    function updateAllResults(decimalValue) {
        // Calculate probability
        const probability = calculateProbability(decimalValue);
        
        // Update all result cards
        resultDecimal.textContent = decimalValue.toFixed(2);
        resultFractional.textContent = decimalToFractional(decimalValue);
        
        const american = decimalToAmerican(decimalValue);
        resultAmerican.textContent = american;
        
        const indonesian = decimalToIndonesian(decimalValue);
        resultIndonesian.textContent = indonesian.startsWith('-') ? indonesian : '+' + indonesian;
        
        resultHongkong.textContent = decimalToHongKong(decimalValue);
        
        const malay = decimalToMalay(decimalValue);
        resultMalay.textContent = malay.startsWith('-') ? malay : '+' + malay;
        
        resultProbability.textContent = probability.toFixed(2) + '%';
    }
    
    // Clear results
    function clearResults() {
        resultDecimal.textContent = '-';
        resultFractional.textContent = '-';
        resultAmerican.textContent = '-';
        resultIndonesian.textContent = '-';
        resultHongkong.textContent = '-';
        resultMalay.textContent = '-';
        resultProbability.textContent = '-';
    }
    
    // Reset all
    function resetAll() {
        oddsInput.value = '';
        fromFormatSelect.value = 'decimal';
        toFormatSelect.value = 'decimal';
        updateInputDisplay();
        clearValidation();
        clearResults();
        oddsInput.focus();
    }
    
    // Copy results
    function copyResults() {
        const results = [
            `Decimal: ${resultDecimal.textContent}`,
            `Fractional: ${resultFractional.textContent}`,
            `American: ${resultAmerican.textContent}`,
            `Indonesian: ${resultIndonesian.textContent}`,
            `Hong Kong: ${resultHongkong.textContent}`,
            `Malay: ${resultMalay.textContent}`,
            `Implied Probability: ${resultProbability.textContent}`
        ].join('\n');
        
        navigator.clipboard.writeText(results).then(function() {
            alert('Results copied to clipboard!');
        }).catch(function() {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = results;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Results copied to clipboard!');
        });
    }

    // ===== EVENT LISTENERS =====
    
    // Format selection change
    fromFormatSelect.addEventListener('change', updateInputDisplay);
    toFormatSelect.addEventListener('change', function() {
        // Can add logic here if needed when "to" format changes
    });
    
    // Input validation on typing
    oddsInput.addEventListener('input', function() {
        validateInput();
        // Auto-convert if input is valid
        if (!this.classList.contains('invalid') && this.value.trim()) {
            calculateConversion();
        } else if (!this.value.trim()) {
            clearResults();
        }
    });
    
    // Convert button
    convertBtn.addEventListener('click', calculateConversion);
    
    // Reset button
    resetBtn.addEventListener('click', resetAll);
    
    // Copy button
    copyBtn.addEventListener('click', copyResults);
    
    // Auto-convert on Enter key
    oddsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            calculateConversion();
        }
    });

    // ===== INITIALIZATION =====
    
    // Initialize display
    updateInputDisplay();
    oddsInput.focus();
    
    // Add a test value for demonstration (optional)
    // oddsInput.value = "2.50";
    // calculateConversion();
});