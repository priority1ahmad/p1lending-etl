SELECT
  CURRENT_DATE AS "Campaign Date",
  24741 AS "LeadCampaignId",
  'Data Lead' AS "Lead Source",
  ROW_NUMBER() OVER (
    ORDER BY
      address
  ) AS "Lead Number",
  'ARM-' || LPAD (
    CAST(FLOOR(RANDOM () * 1000000000) AS VARCHAR),
    9,
    '0'
  ) AS "Ref ID",
  INITCAP (SPLIT_PART (last_close_buyer1, ' ', 1)) AS "First Name",
  INITCAP (SPLIT_PART (last_close_buyer1, ' ', -1)) AS "Last Name",
  INITCAP (last_close_buyer2) AS "Co Borrower Full Name",
  INITCAP (address) AS "Address",
  zipcode AS "Zip",
  CASE
    WHEN units_total IS NULL THEN 1
    ELSE units_total
  END AS "Total Units",
  CASE
    WHEN owner_occupied_yn = 1 THEN 'YES'
    ELSE 'NO'
  END AS "Owner Occupied",
  ROUND(tax_amount_annual, 0) AS "Annual Tax Amount",
  ROUND(
    principal_outstanding_total / NULLIF(hc_value_estimate, 0) * 100,
    0
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
    AND lien2_amount > 0 THEN 'YES'
    ELSE 'NO'
  END AS "Has Second Mortgage",
  CASE
    WHEN NOT lien2_amount IS NULL
    AND lien2_amount > 0 THEN ROUND(
      (principal_outstanding_total + lien2_amount) * (0.0599 / 12 * POWER(1 + 0.0599 / 12, 360)) / (POWER(1 + 0.0599 / 12, 360) - 1),
      0
    )
    ELSE ROUND(
      principal_outstanding_total * (0.0599 / 12 * POWER(1 + 0.0599 / 12, 360)) / (POWER(1 + 0.0599 / 12, 360) - 1),
      0
    )
  END AS "Estimated New Payment",
  lien2_loan_type AS "Second Mortgage Type",
  lien2_loan_term AS "Second Mortgage Term",
  lien1_interest_rate_used AS "Current Interest Rate",
  INITCAP (lien1_lender_name) AS "Current Lender",
  lien1_adjustable_rate_index AS "ARM Index Type",
  last_close_date AS "Origination Date",
  COALESCE(lien1_loan_type, 'Unknown') AS "Mortgage Type",
  lien1_loan_type AS "First Mortgage Type",
  lien1_adjustable_rate_change_date AS "Rate Adjustment Date"
FROM
  bulk_property_data_private_share_usa
WHERE
  (
    lien1_loan_type ILIKE '%CONVENTIONAL%'
    OR lien1_loan_type ILIKE '%ARM%'
    OR lien1_loan_type ILIKE '%VA%'
  )
  AND lien1_adjustable_rate_change_date BETWEEN '2025-08-01'
  AND '2025-10-31'
  AND hc_value_estimate > 125000
  AND lien1_amount BETWEEN 125000
  AND 1500000
  AND (
    units_total BETWEEN 1
    AND 4
    OR units_total IS NULL
  )
  AND NOT SPLIT_PART (last_close_buyer1, ' ', 1) IS NULL
ORDER BY
  "Lead Number";

