SELECT
  CURRENT_DATE AS "Campaign Date",
  '24737' AS "Lead Campaign",
  'Data Lead' AS "Lead Source",
  ROW_NUMBER() OVER (
    ORDER BY
      last_close_date,
      address
  ) AS "Lead Number",
  'FHA6-' || LPAD (RIGHT (assessment_apn, 9), 9, '0') AS "Ref ID",
  INITCAP (
    SPLIT_PART (COALESCE(last_close_buyer1, ''), ' ', 1)
  ) AS "First Name",
  INITCAP (
    SPLIT_PART (COALESCE(last_close_buyer1, ''), ' ', -1)
  ) AS "Last Name",
  last_close_buyer2 AS "Co Borrower Full Name",
  INITCAP (address) AS "Address",
  INITCAP (city) AS "City",
  CASE
    LEFT (fips, 2)
    WHEN '01' THEN 'AL'
    WHEN '02' THEN 'AK'
    WHEN '04' THEN 'AZ'
    WHEN '05' THEN 'AR'
    WHEN '06' THEN 'CA'
    WHEN '08' THEN 'CO'
    WHEN '09' THEN 'CT'
    WHEN '10' THEN 'DE'
    WHEN '11' THEN 'DC'
    WHEN '12' THEN 'FL'
    WHEN '13' THEN 'GA'
    WHEN '15' THEN 'HI'
    WHEN '16' THEN 'ID'
    WHEN '17' THEN 'IL'
    WHEN '18' THEN 'IN'
    WHEN '19' THEN 'IA'
    WHEN '20' THEN 'KS'
    WHEN '21' THEN 'KY'
    WHEN '22' THEN 'LA'
    WHEN '23' THEN 'ME'
    WHEN '24' THEN 'MD'
    WHEN '25' THEN 'MA'
    WHEN '26' THEN 'MI'
    WHEN '27' THEN 'MN'
    WHEN '28' THEN 'MS'
    WHEN '29' THEN 'MO'
    WHEN '30' THEN 'MT'
    WHEN '31' THEN 'NE'
    WHEN '32' THEN 'NV'
    WHEN '33' THEN 'NH'
    WHEN '34' THEN 'NJ'
    WHEN '35' THEN 'NM'
    WHEN '36' THEN 'NY'
    WHEN '37' THEN 'NC'
    WHEN '38' THEN 'ND'
    WHEN '39' THEN 'OH'
    WHEN '40' THEN 'OK'
    WHEN '41' THEN 'OR'
    WHEN '42' THEN 'PA'
    WHEN '44' THEN 'RI'
    WHEN '45' THEN 'SC'
    WHEN '46' THEN 'SD'
    WHEN '47' THEN 'TN'
    WHEN '48' THEN 'TX'
    WHEN '49' THEN 'UT'
    WHEN '50' THEN 'VT'
    WHEN '51' THEN 'VA'
    WHEN '53' THEN 'WA'
    WHEN '54' THEN 'WV'
    WHEN '55' THEN 'WI'
    WHEN '56' THEN 'WY'
    ELSE 'Unknown'
  END AS "State",
  owner_zip AS "Zip",
  1 AS "Total Units",
  'Yes' AS "Owner Occupied",
  0 AS "Annual Tax Amount",
  CAST(
    (
      last_close_price / NULLIF(hc_value_estimate, 0) * 100
    ) AS DECIMAL(10, 2)
  ) AS "LTV",
  'FHA' AS "Loan Type",
  0 AS "Assessed Value",
  hc_value_estimate AS "Estimated Value",
  last_close_price AS "First Mortgage Amount",
  last_close_price AS "First Mortgage Balance",
  30 AS "Term",
  0 AS "Second Mortgage Amount",
  'No' AS "Has Second Mortgage",
  NULL AS "Estimated New Payment",
  NULL AS "Second Mortgage Type",
  NULL AS "Second Mortgage Term",
  0 AS "Current Interest Rate",
  INITCAP (lien1_lender_name) AS "Current Lender",
  NULL AS "ARM Index Type",
  last_close_date AS "Origination Date",
  CASE
    WHEN deed_transfer_yn = 0 THEN 'Refinance'
    WHEN deed_transfer_yn = 1 THEN 'Purchase'
    ELSE 'Unknown'
  END AS "Mortgage Type"
FROM
  bulk_property_data_private_share_usa
WHERE
  last_close_date ILIKE '2025-03%'
  AND last_close_price > 125000
  AND (
    last_close_price / NULLIF(hc_value_estimate, 0) * 100
  ) < 90
  AND NOT last_close_buyer1 IS NULL
  AND TRIM(last_close_buyer1) <> ''
  AND SPLIT_PART (last_close_buyer1, ' ', 1) <> ''
ORDER BY
  last_close_date,
  address;

