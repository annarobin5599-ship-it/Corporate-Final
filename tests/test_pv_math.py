"""
Independent Mathematical Verification Test Suite for PV Corporate Finance Engine
Tests all analytical formulas, discounting frequencies, sensitivity invariants, and edge cases.
"""

import math
import unittest

def calc_pv(fv, r_percent, n, m=1):
    r = r_percent / 100.0
    if m == 'continuous' or m == 'c':
        df = math.exp(-r * n)
        pv = fv * df
        return round(pv, 2), round(df, 6)
    
    m_int = int(m)
    total_periods = n * m_int
    if total_periods == 0 or r == 0:
        return round(fv, 2), 1.0
    
    periodic_rate = r / m_int
    compound_factor = (1.0 + periodic_rate) ** total_periods
    df = 1.0 / compound_factor
    pv = fv * df
    return round(pv, 2), round(df, 6)

class TestPVMathEngine(unittest.TestCase):
    
    def test_standard_user_prompt_case(self):
        """
        User prompt: 'I will receive ₹50,000 after 3 years and the discount rate is 8%. What is its present value?'
        PV = 50,000 / (1.08)^3 = 39,691.61
        """
        fv = 50000
        r = 8.0
        n = 3
        pv, df = calc_pv(fv, r, n, m=1)
        expected_compound = 1.08 ** 3 # 1.259712
        expected_pv = round(50000 / expected_compound, 2) # 39691.61
        self.assertEqual(pv, 39691.61)
        self.assertEqual(pv, expected_pv)
        self.assertAlmostEqual(df, 1.0 / expected_compound, places=5)
        
    def test_annual_periods(self):
        """Test multiple annual scenarios"""
        # $100,000 in 5 years at 10%
        pv, df = calc_pv(100000, 10.0, 5, 1)
        self.assertEqual(pv, 62092.13)
        
        # $1,000,000 in 10 years at 12%
        pv, df = calc_pv(1000000, 12.0, 10, 1)
        self.assertEqual(pv, 321973.24)

    def test_periodic_compounding(self):
        """Test semi-annual, quarterly, monthly compounding"""
        fv = 50000
        r = 8.0
        n = 3
        
        # Semi-annual (m=2)
        pv_semi, df_semi = calc_pv(fv, r, n, m=2)
        # 50000 / (1 + 0.04)^6 = 39515.73
        self.assertEqual(pv_semi, 39515.73)
        
        # Quarterly (m=4)
        pv_qtr, df_qtr = calc_pv(fv, r, n, m=4)
        # 50000 / (1 + 0.02)^12 = 39424.66
        self.assertEqual(pv_qtr, 39424.66)
        
        # Monthly (m=12)
        pv_mo, df_mo = calc_pv(fv, r, n, m=12)
        # 50000 / (1 + 0.08/12)^36 = 39362.73
        self.assertEqual(pv_mo, 39362.73)
        
        # Invariant: More frequent compounding at same nominal rate yields lower PV
        self.assertGreater(pv_semi, pv_qtr)
        self.assertGreater(pv_qtr, pv_mo)

    def test_continuous_discounting(self):
        """Test continuous compounding: PV = FV * e^(-r*n)"""
        fv = 50000
        r = 8.0
        n = 3
        pv_cont, df_cont = calc_pv(fv, r, n, m='continuous')
        expected_pv = round(50000 * math.exp(-0.08 * 3), 2)
        self.assertEqual(pv_cont, expected_pv)
        self.assertEqual(pv_cont, 39331.39)

    def test_edge_cases(self):
        """Test 0% rate, 0 periods, 0 future value"""
        # Rate = 0%: PV equals FV
        pv, df = calc_pv(50000, 0, 5, 1)
        self.assertEqual(pv, 50000.0)
        self.assertEqual(df, 1.0)
        
        # Periods = 0: PV equals FV
        pv, df = calc_pv(75000, 10, 0, 1)
        self.assertEqual(pv, 75000.0)
        self.assertEqual(df, 1.0)
        
        # FV = 0: PV is 0
        pv, df = calc_pv(0, 10, 5, 1)
        self.assertEqual(pv, 0.0)

    def test_sensitivity_invariants(self):
        """
        Core finance rules:
        1. Higher discount rate -> strictly LOWER present value
        2. Longer time horizon -> strictly LOWER present value
        """
        fv = 100000
        n = 5
        
        # Rate monotonicity
        rates = [2.0, 5.0, 8.0, 10.0, 15.0, 20.0]
        pvs_by_rate = [calc_pv(fv, r, n, 1)[0] for r in rates]
        for i in range(len(pvs_by_rate) - 1):
            self.assertGreater(pvs_by_rate[i], pvs_by_rate[i+1],
                               f"PV at rate {rates[i]}% ({pvs_by_rate[i]}) should exceed PV at rate {rates[i+1]}% ({pvs_by_rate[i+1]})")
            
        # Time horizon monotonicity
        r = 8.0
        years = [1, 2, 3, 5, 10, 20]
        pvs_by_time = [calc_pv(fv, r, y, 1)[0] for y in years]
        for i in range(len(pvs_by_time) - 1):
            self.assertGreater(pvs_by_time[i], pvs_by_time[i+1],
                               f"PV at {years[i]} years ({pvs_by_time[i]}) should exceed PV at {years[i+1]} years ({pvs_by_time[i+1]})")

if __name__ == '__main__':
    unittest.main()
