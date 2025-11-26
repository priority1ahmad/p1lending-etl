SELECT
  CURRENT_DATE AS "Campaign Date",
  'VA' AS "Lead Campaign",
  'Data Lead' AS "Lead Source",
  ROW_NUMBER() OVER (
    ORDER BY
      RANDOM ()
  ) AS "Lead Number",
  'VA-' || LPAD (CAST(ABS(RANDOM ()) AS INT), 9, '0') AS "Ref ID",
  INITCAP (
    SPLIT_PART (COALESCE(lien1_borrower1_first_name, ''), ' ', 1)
  ) AS "First Name",
  INITCAP (
    SPLIT_PART (COALESCE(lien1_borrower1_last_name, ''), ' ', 1)
  ) AS "Last Name",
  NULL AS "Co Borrower Full Name",
  INITCAP (address) AS "Address",
  INITCAP (city) AS "City",
  state AS "State",
  zipcode AS "Zip",
  COALESCE(units_total, 1) AS "Total Units",
  CASE
    WHEN owner_occupied_yn = 1 THEN 'Yes'
    ELSE 'No'
  END AS "Owner Occupied",
  ROUND(tax_amount_annual) AS "Annual Tax Amount",
  ROUND(
    CAST(
      (
        principal_outstanding_total / NULLIF(hc_value_estimate, 0) * 100
      ) AS DECIMAL(10, 2)
    ),
    0
  ) AS "LTV",
  INITCAP (COALESCE(lien1_loan_type, 'Unknown')) AS "Loan Type",
  value_assessed AS "Assessed Value",
  hc_value_estimate AS "Estimated Value",
  lien1_amount AS "First Mortgage Amount",
  principal_outstanding_total AS "First Mortgage Balance",
  lien1_loan_term AS "Term",
  lien2_amount AS "Second Mortgage Amount",
  CASE
    WHEN lien2_amount > 0 THEN 'Yes'
    ELSE 'No'
  END AS "Has Second Mortgage",
  ROUND(
    principal_outstanding_total * (0.0525 / 12 * POWER(1 + 0.0525 / 12, 360)) / (POWER(1 + 0.0525 / 12, 360) - 1)
  ) AS "Estimated New Payment",
  INITCAP (lien2_loan_type) AS "Second Mortgage Type",
  lien2_loan_term AS "Second Mortgage Term",
  lien1_interest_rate_used AS "Current Interest Rate",
  INITCAP (lien1_lender_name) AS "Current Lender",
  INITCAP (lien1_adjustable_rate_index) AS "ARM Index Type",
  last_close_date AS "Origination Date",
  INITCAP (lien1_loan_type) AS "Mortgage Type",
  lien1_adjustable_rate_change_date AS "Rate Adjustment Date"
FROM
  bulk_property_data_private_share_usa
WHERE
  (
    units_total BETWEEN 0
    AND 4
    OR units_total IS NULL
  )
  AND lien1_loan_type ILIKE '%VA%'
  AND lien1_interest_rate_used BETWEEN 6.5
  AND 8
  AND principal_outstanding_total > 150000
  AND NOT address IS NULL
  AND TRIM(address) <> ''
  AND TRY_TO_DATE (last_close_date) BETWEEN '2015-01-01'
  AND '2023-06-30'
  AND state IN (
    'AL',
    'AZ',
    'AR',
    'CA',
    'CO',
    'CT',
    'DE',
    'DC',
    'FL',
    'GA',
    'IL',
    'IN',
    'LA',
    'MD',
    'MI',
    'MN',
    'NJ',
    'NC',
    'OH',
    'OK',
    'PA',
    'SC',
    'SD',
    'TN',
    'TX',
    'VA',
    'WA',
    'WY'
  )
  AND NOT lien1_borrower1_first_name IS NULL
  AND NOT lien1_borrower1_last_name IS NULL
ORDER BY
  RANDOM ()
