WITH numbered_data AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      ORDER BY
        address
    ) AS "Lead Number",
    DATEDIFF (
      MONTH,
      TRY_TO_DATE (last_close_date),
      CURRENT_DATE
    ) AS months_since_origination,
    SPLIT_PART (last_close_buyer1, ' ', 1) AS buyer1_first_name,
    SPLIT_PART (last_close_buyer1, ' ', -1) AS buyer1_last_name
  FROM
    bulk_property_data_private_share_usa
  WHERE
    lien1_amount BETWEEN 300000
    AND 800000
    AND hc_value_estimate > 0
    AND NOT address IS NULL
    AND TRIM(address) <> ''
    AND TRY_TO_DATE (last_close_date) BETWEEN '2023-09-01'
    AND '2023-11-30'
    AND NOT last_close_buyer1 IS NULL
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
    AND (
      lien1_lender_name ILIKE '%huntington%'
      OR lien1_lender_name ILIKE '%united wholesale%'
      OR lien1_lender_name ILIKE '%pennymac%'
      OR lien1_lender_name ILIKE '%freedom mortgage%'
      OR lien1_lender_name ILIKE '%union home%'
      OR lien1_lender_name ILIKE '%swift home%'
      OR lien1_lender_name ILIKE '%loandepot%'
      OR lien1_lender_name ILIKE '%rocket%'
      OR lien1_lender_name ILIKE '%prime lending%'
      OR lien1_lender_name ILIKE '%newrez%'
    )
)
SELECT
  "Lead Number",
  CURRENT_DATE AS "Campaign Date",
  24670 AS "Lead Campaign",
  'Data Lead' AS "Lead Source",
  'CONV-' || LPAD (CAST(ABS(RANDOM ()) AS INT), 9, '0') AS "Ref ID",
  INITCAP (buyer1_first_name) AS "First Name",
  INITCAP (buyer1_last_name) AS "Last Name",
  INITCAP (last_close_buyer2) AS "Co Borrower Full Name",
  INITCAP (address) AS "Address",
  INITCAP (city) AS "City",
  state AS "State",
  owner_zip AS "Zip",
  1 AS "Total Units",
  'Yes' AS "Owner Occupied",
  ROUND(tax_amount_annual) AS "Annual Tax Amount",
  ROUND(
    CAST(
      (
        lien1_amount / NULLIF(hc_value_estimate, 0) * 100
      ) AS DECIMAL(10, 2)
    ),
    0
  ) AS "LTV",
  'Conventional' AS "Loan Type",
  value_assessed AS "Assessed Value",
  hc_value_estimate AS "Estimated Value",
  lien1_amount AS "First Mortgage Amount",
  ROUND(
    lien1_amount * POWER(
      1 + (lien1_interest_rate_used / 1200),
      - months_since_origination
    )
  ) AS "First Mortgage Balance",
  360 AS "Term",
  ROUND(
    lien1_amount * (0.0525 / 12 * POWER(1 + 0.0525 / 12, 360)) / (POWER(1 + 0.0525 / 12, 360) - 1)
  ) AS "Estimated New Payment",
  CASE
    WHEN lien2_amount > 0 THEN 'HELOC'
    ELSE NULL
  END AS "Second Mortgage Type",
  360 AS "Second Mortgage Term",
  lien1_interest_rate_used AS "Current Interest Rate",
  INITCAP (lien1_lender_name) AS "Current Lender",
  NULL AS "ARM Index Type",
  last_close_date AS "Origination Date",
  'Conventional' AS "First Mortgage Type",
  NULL AS "Rate Adjustment Date",
  NULL AS "Phone 1",
  NULL AS "Phone 2",
  NULL AS "Phone 3",
  NULL AS "Email 1",
  NULL AS "Email 2",
  NULL AS "Email 3",
  NULL AS "Phone 1 In DNC List",
  NULL AS "Phone 2 In DNC List",
  NULL AS "Phone 3 In DNC List",
  NULL AS "In Litigator List"
FROM
  numbered_data
ORDER BY
  "Lead Number";

