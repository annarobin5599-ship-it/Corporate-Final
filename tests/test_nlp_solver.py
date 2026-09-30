"""
Python test to verify NLP extraction logic matching js/ai-solver.js regex rules.
"""

import re
import unittest

def parse_question_py(text):
    clean = text.strip()
    currency = '₹'
    if re.search(r'₹|\b(?:rs\.?|inr|rupees?)\b', clean, re.I):
        currency = '₹'
    elif re.search(r'\$|\b(?:usd|dollars?)\b', clean, re.I):
        currency = '$'
    elif re.search(r'€|\b(?:eur|euros?)\b', clean, re.I):
        currency = '€'
    elif re.search(r'£|\b(?:gbp|pounds?)\b', clean, re.I):
        currency = '£'

    # Compounding
    compounding = 1
    if re.search(r'\b(?:semi[-\s]?annually|half[-\s]?yearly)\b', clean, re.I):
        compounding = 2
    elif re.search(r'\bquarterly\b', clean, re.I):
        compounding = 4
    elif re.search(r'\bmonthly\b', clean, re.I):
        compounding = 12
    elif re.search(r'\bcontinuous(?:ly)?\b', clean, re.I):
        compounding = 'continuous'

    # FV
    fv = None
    patterns_fv = [
        r'(?:₹|\$|€|£|\brs\.?\b|\binr\b|\busd\b)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?',
        r'\b(?:receive|worth|pays?|promis(?:es|ed)|sum of|amount of|value of)\s*(?:₹|\$|€|£|\brs\.?\b)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?',
        r'([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)\b',
        r'([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s*(k|thousand|lakhs?|lacs?|crores?|millions?)?\s*(?:after|in|due in)\s*[0-9]+\s*(?:years?|periods?|yrs?)'
    ]
    for p in patterns_fv:
        m = re.search(p, clean, re.I)
        if m:
            num_str = m.group(1).replace(',', '')
            val = float(num_str)
            full_str = m.group(0).lower()
            if 'lakh' in full_str or 'lac' in full_str:
                val *= 100000
            elif 'crore' in full_str:
                val *= 10000000
            elif 'million' in full_str:
                val *= 1000000
            elif 'k' in full_str or 'thousand' in full_str:
                val *= 1000
            fv = val
            break

    # Rate
    r = None
    patterns_r = [
        r'(?:discount rate|required rate|rate of return|cost of capital|hurdle rate|interest rate|yield)(?:\s*(?:is|of|at|=|:))?\s*([0-9]+(?:\.[0-9]+)?)\s*%',
        r'([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:discount rate|required rate|cost of capital|hurdle rate|discounting|interest)',
        r'(?:at|with)\s*([0-9]+(?:\.[0-9]+)?)\s*%\s*(?:discount rate|rate|cost of capital)?',
        r'([0-9]+(?:\.[0-9]+)?)\s*%'
    ]
    for p in patterns_r:
        m = re.search(p, clean, re.I)
        if m:
            r = float(m.group(1))
            break

    # Time
    n = None
    patterns_t = [
        r'(?:after|in|for|over|due in|horizon of)\s*([0-9]+(?:\.[0-9]+)?)\s*(?:years?|yrs?|periods?|annum)',
        r'([0-9]+(?:\.[0-9]+)?)\s*-(?:years?|yr)\s*(?:time|period|horizon|duration)?',
        r'([0-9]+(?:\.[0-9]+)?)\s*(?:years?|yrs?|periods?)'
    ]
    for p in patterns_t:
        m = re.search(p, clean, re.I)
        if m:
            n = float(m.group(1))
            break

    return {
        'currency': currency,
        'fv': fv,
        'r': r,
        'n': n,
        'compounding': compounding
    }

class TestNLPSolver(unittest.TestCase):
    
    def test_user_exact_question(self):
        q = "I will receive ₹50,000 after 3 years and the discount rate is 8%. What is its present value?"
        res = parse_question_py(q)
        self.assertEqual(res['currency'], '₹')
        self.assertEqual(res['fv'], 50000.0)
        self.assertEqual(res['n'], 3.0)
        self.assertEqual(res['r'], 8.0)
        self.assertEqual(res['compounding'], 1)

    def test_capital_budgeting_query(self):
        q = "A project promises $120,000 in 5 years with a 10% cost of capital. What is it worth today?"
        res = parse_question_py(q)
        self.assertEqual(res['currency'], '$')
        self.assertEqual(res['fv'], 120000.0)
        self.assertEqual(res['n'], 5.0)
        self.assertEqual(res['r'], 10.0)

    def test_semi_annual_query(self):
        q = "What is the present value of €80,000 due in 4 years if the required rate of return is 6.5% compounded semi-annually?"
        res = parse_question_py(q)
        self.assertEqual(res['currency'], '€')
        self.assertEqual(res['fv'], 80000.0)
        self.assertEqual(res['n'], 4.0)
        self.assertEqual(res['r'], 6.5)
        self.assertEqual(res['compounding'], 2)

    def test_lakh_notation(self):
        q = "I will receive 5 lakh in 7 years at 9% discount rate"
        res = parse_question_py(q)
        self.assertEqual(res['fv'], 500000.0)
        self.assertEqual(res['n'], 7.0)
        self.assertEqual(res['r'], 9.0)

if __name__ == '__main__':
    unittest.main()
