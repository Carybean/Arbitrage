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
    document.addEventListener('click', function(e) {
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

    window.addEventListener("resize", handleDetailsForScreen);


    // ===== ODDS CONVERTER LOGIC =====
    
    const fromFormatSelect = document.getElementById('from-format');
    const toFormatSelect = document.getElementById('to-format');
    const oddsInput = document.getElementById('odds-input');
    const inputLabel = document.getElementById('input-label');
    const inputExample = document.getElementById('input-example');
    const convertBtn = document.getElementById('convert-btn');
    const resetBtn = document.getElementById('reset-btn');
    const copyBtn = document.getElementById('copy-results');
    
    const resultDecimal = document.getElementById('result-decimal');
    const resultFractional = document.getElementById('result-fractional');
    const resultAmerican = document.getElementById('result-american');
    const resultIndonesian = document.getElementById('result-indonesian');
    const resultHongkong = document.getElementById('result-hongkong');
    const resultMalay = document.getElementById('result-malay');
    const resultProbability = document.getElementById('result-probability');

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
    
    const formatExamples = {
        decimal: { label: "Enter Decimal Odds", example: "e.g., 2.50", placeholder: "2.50" },
        fractional: { label: "Enter Fractional Odds", example: "e.g., 3/2 or 5/4", placeholder: "3/2" },
        american: { label: "Enter American Odds", example: "e.g., +150 or -200", placeholder: "+150" },
        indonesian: { label: "Enter Indonesian Odds", example: "e.g., +1.50 or -4.00", placeholder: "+1.50" },
        hongkong: { label: "Enter Hong Kong Odds", example: "e.g., 0.50", placeholder: "0.50" },
        malay: { label: "Enter Malay Odds", example: "e.g., +0.67 or -0.25", placeholder: "+0.67" }
    };

    function updateInputDisplay() {
        const format = fromFormatSelect.value;
        const examples = formatExamples[format];
        inputLabel.textContent = examples.label;
        oddsInput.placeholder = examples.placeholder;
        inputExample.textContent = examples.example;
        oddsInput.classList.remove('valid', 'invalid');
    }

    // ===== ODDS CONVERSION FUNCTIONS =====
    
    function toDecimal(odds, format) {
        if (!odds || odds.trim() === '') return null;
        const str = odds.trim();
        
        switch(format) {
            case 'decimal':
                if ((!/^[0-9.]*$/.test(str)) || (/([.]).*?\1/.test(str))) return null;
                const decimal = parseFloat(str);
                return isNaN(decimal) || decimal < 1.01 ? null : decimal;
                
            case 'fractional':
                if (!str.includes('/') || (!/^[0-9/]*$/.test(str)) || (/([/]).*?\1/.test(str))) return null;
                const [numerator, denominator] = str.split('/').map(Number);
                if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return null;
                const fracValue = (numerator / denominator) + 1;
                return fracValue >= 1.01 ? fracValue : null;
                
            case 'american':
                if (str.includes('/') || (!/^[0-9+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str)) || (/^[+-]/.test(str) && /[./]/.test(str))) return null;
                if (str.startsWith('+')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (value / 100) + 1;
                } else if (str.startsWith('-')) {
                    const value = parseInt(str.substring(1));
                    if (isNaN(value) || value < 100) return null;
                    return (100 / Math.abs(value)) + 1;
                }
                return null;
                
            case 'indonesian':
                if (str.includes('/') || (!/^[0-9.+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str))) return null;
                const indoValue = parseFloat(str);
                if (isNaN(indoValue)) return null;
                if (str.startsWith('+') || (!str.startsWith('-') && indoValue > 0)) {
                    if (indoValue >= 1.01) return indoValue + 1;
                } else if (str.startsWith('-') || indoValue < 0) {
                    const absValue = Math.abs(indoValue);
                    if (absValue >= 1.01) return (1 / absValue) + 1;
                }
                return null;
                
            case 'hongkong':
                if (str.includes('/') || (!/^[0-9.]*$/.test(str)) || (/([.]).*?\1/.test(str))) return null;
                const hkValue = parseFloat(str);
                if (isNaN(hkValue) || hkValue < 0) return null;
                return hkValue + 1;
                
            case 'malay':
                // REGEX Check for Malay
                if (str.includes('/') || (!/^[0-9.+-]*$/.test(str)) || (str.includes("+") && str.indexOf("+") !== 0) || (str.includes("-") && str.indexOf("-") !== 0) || (/([+-]).*?\1/.test(str))) return null;
                const malayValue = parseFloat(str);
                if (isNaN(malayValue)) return null;
                
                // FIXED LOGIC: 
                // Positive (0 to 1) = Favorite
                if (malayValue > 0 && malayValue <= 1) {
                    return 1 + malayValue;
                } 
                // Negative (-1 to 0) = Underdog
                else if (malayValue < 0 && malayValue >= -1) {
                    return 1 + (1 / Math.abs(malayValue));
                }
                return null;
                
            default:
                return null;
        }
    }
    
    function calculateProbability(decimalOdds) {
        if (!decimalOdds || decimalOdds < 1) return 0;
        return (1 / decimalOdds) * 100;
    }
    
    function decimalToFractional(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        const profit = decimal - 1;
        const bettingFractions = {
            '0.10': '1/10', '0.20': '1/5', '0.25': '1/4', '0.33': '1/3', '0.40': '2/5', 
            '0.50': '1/2', '0.67': '2/3', '0.80': '4/5', '1.00': '1/1', '1.20': '6/5',
            '1.25': '5/4', '1.50': '3/2', '2.00': '2/1', '2.50': '5/2', '3.00': '3/1',
            '4.00': '4/1', '5.00': '5/1', '10.00': '10/1'
        };
        const profitStr = (Math.round(profit * 100) / 100).toFixed(2);
        if (bettingFractions[profitStr]) return bettingFractions[profitStr];

        let bestNumerator = 1, bestDenominator = 1;
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
        const gcd = (a, b) => b ? gcd(b, a % b) : a;
        const divisor = gcd(bestNumerator, bestDenominator);
        return `${bestNumerator / divisor}/${bestDenominator / divisor}`;
    }
    
    function decimalToAmerican(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) return "+" + Math.round((decimal - 1) * 100);
        return "-" + Math.round(100 / (decimal - 1));
    }
    
    function decimalToIndonesian(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        if (decimal >= 2.00) return (decimal - 1).toFixed(2);
        return (-1 / (decimal - 1)).toFixed(2);
    }
    
    function decimalToHongKong(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        return (decimal - 1).toFixed(2);
    }
    
    function decimalToMalay(decimal) {
        if (!decimal || decimal < 1.01) return '-';
        // FIXED LOGIC:
        // Decimal < 2.00 (Favorite) -> Positive Malay
        if (decimal <= 2.00) {
            return (decimal - 1).toFixed(2);
        } 
        // Decimal > 2.00 (Underdog) -> Negative Malay
        else {
            const malayValue = -1 / (decimal - 1);
            return malayValue.toFixed(2);
        }
    }
    
    function decimalToFormat(decimal, format) {
        switch(format) {
            case 'decimal': return decimal.toFixed(2);
            case 'fractional': return decimalToFractional(decimal);
            case 'american': return decimalToAmerican(decimal);
            case 'indonesian': 
                const indo = decimalToIndonesian(decimal);
                return indo.startsWith('-') ? indo : '+' + indo;
            case 'hongkong': return decimalToHongKong(decimal);
            case 'malay': 
                const malay = decimalToMalay(decimal);
                return malay.startsWith('-') ? malay : '+' + malay;
            default: return '-';
        }
    }

    // ===== UI LOGIC =====
    
    function validateInput() {
        const value = oddsInput.value.trim();
        if (!value) {
            oddsInput.classList.remove('invalid', 'valid');
            return false;
        }
        const format = fromFormatSelect.value;
        const decimal = toDecimal(value, format);
        const isValid = decimal !== null && decimal >= 1.01;
        oddsInput.classList.toggle('valid', isValid);
        oddsInput.classList.toggle('invalid', !isValid);
        return isValid;
    }

    function calculateConversion() {
        const value = oddsInput.value.trim();
        if (!value || !validateInput()) {
            clearResults();
            return false;
        }
        const fromFormat = fromFormatSelect.value;
        const decimalValue = toDecimal(value, fromFormat);
        if (decimalValue && decimalValue >= 1.01) {
            updateAllResults(decimalValue);
            return true;
        }
        clearResults();
        return false;
    }
    
    function updateAllResults(decimalValue) {
        resultDecimal.textContent = decimalValue.toFixed(2);
        resultFractional.textContent = decimalToFractional(decimalValue);
        resultAmerican.textContent = decimalToAmerican(decimalValue);
        
        const indonesian = decimalToIndonesian(decimalValue);
        resultIndonesian.textContent = indonesian.startsWith('-') ? indonesian : '+' + indonesian;
        
        resultHongkong.textContent = decimalToHongKong(decimalValue);
        
        const malay = decimalToMalay(decimalValue);
        resultMalay.textContent = malay.startsWith('-') ? malay : '+' + malay;
        
        resultProbability.textContent = calculateProbability(decimalValue).toFixed(2) + '%';
    }
    
    function clearResults() {
        [resultDecimal, resultFractional, resultAmerican, resultIndonesian, resultHongkong, resultMalay, resultProbability].forEach(el => el.textContent = '-');
    }
    
    function resetAll() {
        oddsInput.value = '';
        fromFormatSelect.value = 'decimal';
        updateInputDisplay();
        clearResults();
        oddsInput.focus();
    }
    
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
        
        navigator.clipboard.writeText(results).then(() => alert('Results copied!'))
        .catch(() => {
            const textArea = document.createElement('textarea');
            textArea.value = results;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Results copied!');
        });
    }

    fromFormatSelect.addEventListener('change', updateInputDisplay);
    oddsInput.addEventListener('input', () => {
        if (oddsInput.value.trim()) calculateConversion();
        else clearResults();
    });
    convertBtn.addEventListener('click', calculateConversion);
    resetBtn.addEventListener('click', resetAll);
    copyBtn.addEventListener('click', copyResults);
    oddsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); calculateConversion(); }
    });

    updateInputDisplay();
    oddsInput.focus();
});