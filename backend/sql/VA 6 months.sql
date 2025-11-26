SELECT
  CURRENT_DATE AS "Campaign Date",
  '24738' AS "LeadCampaignId",
  'Data Lead' AS "Lead Source",
  ROW_NUMBER() OVER (
    ORDER BY
      address,
      last_close_date
  ) AS "Lead Number",
  'VA6-' || LPAD (
    CAST(FLOOR(RANDOM () * 1000000000) AS VARCHAR),
    9,
    '0'
  ) AS "Ref ID",
  INITCAP (
    SPLIT_PART (
      COALESCE(last_close_buyer1, lien1_borrower2_name),
      ' ',
      1
    )
  ) AS "First Name",
  INITCAP (
    SPLIT_PART (
      COALESCE(last_close_buyer1, lien1_borrower2_name),
      ' ',
      -1
    )
  ) AS "Last Name",
  CASE
    WHEN NOT last_close_buyer1 IS NULL THEN INITCAP (lien1_borrower2_name)
  END AS "Co Borrower Full Name",
  INITCAP (address) AS "Address",
  INITCAP (city) AS "City",
  owner_state AS "State",
  zipcode AS "Zip",
  COALESCE(units_total, 1) AS "Total Units",
  CASE
    WHEN owner_occupied_yn = 1 THEN 'Yes'
    ELSE 'No'
  END AS "Owner Occupied",
  ROUND(tax_amount_annual) AS "Annual Tax Amount",
  ROUND(
    COALESCE(lien1_amount, 0) / NULLIF(hc_value_estimate, 0) * 100
  ) AS "LTV",
  lien1_loan_type AS "Loan Type",
  value_assessed AS "Assessed Value",
  hc_value_estimate AS "Estimated Value",
  lien1_amount AS "First Mortgage Amount",
  principal_outstanding_total AS "First Mortgage Balance",
  lien1_loan_term AS "Term",
  lien2_amount AS "Second Mortgage Amount",
  CASE
    WHEN NOT lien2_amount IS NULL
    AND lien2_amount > 0 THEN 'Yes'
    ELSE 'No'
  END AS "Has Second Mortgage",
  NULL AS "Estimated New Payment",
  lien2_loan_type AS "Second Mortgage Type",
  lien2_loan_term AS "Second Mortgage Term",
  lien1_interest_rate_used AS "Current Interest Rate",
  INITCAP (lien1_lender_name) AS "Current Lender",
  lien1_adjustable_rate_index AS "ARM Index Type",
  last_close_date AS "Origination Date",
  CASE
    WHEN deed_transfer_yn = 0 THEN 'Refinance'
    WHEN deed_transfer_yn = 1 THEN 'Purchase'
    ELSE 'Unknown'
  END AS "Mortgage Type",
  INITCAP (lien1_loan_type) AS "First Mortgage Type",
  lien1_adjustable_rate_change_date AS "Rate Adjustment Date"
FROM
  bulk_property_data_private_share_usa
WHERE
  lien1_loan_type ILIKE '%VA%'
  AND last_close_date ILIKE '2025-03%'
  AND NOT owner_name IS NULL
  AND TRIM(owner_name) <> ''
  AND COALESCE(units_total, 1) BETWEEN 1
  AND 4
  AND lien1_amount > 125000
  AND owner_state <> 'OR'
ORDER BY
  address,
  last_close_date;

