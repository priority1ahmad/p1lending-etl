WITH RandomizedData AS (
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY
        RANDOM ()
    ) AS "Lead Number",
    CURRENT_DATE AS "Campaign Date",
    '24669' AS "Lead Campaign",
    'Data Lead' AS "Lead Source",
    '24669-' || LPAD (CAST(ABS(RANDOM ()) AS INT), 9, '0') AS "Ref ID",
    INITCAP (SPLIT_PART (lien1_borrower1_first_name, ' ', 1)) AS "First Name",
    INITCAP (lien1_borrower1_last_name) AS "Last Name",
    NULL AS "Co Borrower Full Name",
    INITCAP (address) AS "Address",
    INITCAP (city) AS "City",
    CASE
      LEFT (fips, 2)
      WHEN '01' THEN 'AL'
      WHEN '04' THEN 'AZ'
      WHEN '05' THEN 'AR'
      WHEN '06' THEN 'CA'
      WHEN '08' THEN 'CO'
      WHEN '09' THEN 'CT'
      WHEN '10' THEN 'DE'
      WHEN '11' THEN 'DC'
      WHEN '12' THEN 'FL'
      WHEN '13' THEN 'GA'
      WHEN '17' THEN 'IL'
      WHEN '18' THEN 'IN'
      WHEN '22' THEN 'LA'
      WHEN '24' THEN 'MD'
      WHEN '26' THEN 'MI'
      WHEN '27' THEN 'MN'
      WHEN '34' THEN 'NJ'
      WHEN '37' THEN 'NC'
      WHEN '39' THEN 'OH'
      WHEN '40' THEN 'OK'
      WHEN '42' THEN 'PA'
      WHEN '45' THEN 'SC'
      WHEN '46' THEN 'SD'
      WHEN '47' THEN 'TN'
      WHEN '48' THEN 'TX'
      WHEN '51' THEN 'VA'
      WHEN '53' THEN 'WA'
      WHEN '56' THEN 'WY'
    END AS "State",
    fips AS "Zip",
    1 AS "Total Units",
    CASE
      WHEN association_yn = 1 THEN 'Yes'
      WHEN association_yn = 0 THEN 'No'
      ELSE 'Unknown'
    END AS "Owner Occupied",
    ROUND(COALESCE(tax_amount_annual, 0)) AS "Annual Tax Amount",
    ROUND(
      CAST(
        (
          lien1_amount / NULLIF(hc_value_estimate, 0) * 100
        ) AS DECIMAL(10, 2)
      ),
      0
    ) AS "LTV",
    'Fixed' AS "Loan Type",
    hc_value_estimate AS "Assessed Value",
    hc_value_estimate AS "Estimated Value",
    lien1_amount AS "First Mortgage Amount",
    ROUND(
      lien1_amount * (
        1 - (
          DATEDIFF (
            MONTH,
            TRY_TO_DATE (last_close_date),
            CURRENT_DATE
          ) / 360.0
        ) * 0.15
      )
    ) AS "First Mortgage Balance",
    360 AS "Term",
    NULL AS "Second Mortgage Amount",
    'No' AS "Has Second Mortgage",
    ROUND(
      lien1_amount * (0.0525 / 12 * POWER(1 + 0.0525 / 12, 360)) / (POWER(1 + 0.0525 / 12, 360) - 1)
    ) AS "Estimated New Payment",
    NULL AS "Second Mortgage Type",
    NULL AS "Second Mortgage Term",
    lien1_interest_rate_used AS "Current Interest Rate",
    INITCAP (lien1_lender_name) AS "Current Lender",
    lien1_adjustable_rate_index AS "ARM Index Type",
    last_close_date AS "Origination Date",
    'Fixed' AS "First Mortgage Type",
    lien1_adjustable_rate_change_date AS "Rate Adjustment Date"
  FROM
    bulk_property_data_private_share_usa
  WHERE
    lien1_amount BETWEEN 125000
    AND 600000
    AND (
      lien1_amount / NULLIF(hc_value_estimate, 0) * 100
    ) < 70
    AND TRY_TO_DATE (last_close_date) BETWEEN '2023-09-01'
    AND '2023-12-31'
    AND lien1_adjustable_rate_index IS NULL
    AND lien1_adjustable_rate_change_date IS NULL
    AND NOT lien1_borrower1_first_name IS NULL
    AND NOT lien1_borrower1_last_name IS NULL
    AND NOT address IS NULL
    AND NOT lien1_lender_name IS NULL
    AND TRIM(address) <> ''
    AND LEFT (fips, 2) IN (
      '01',
      '04',
      '05',
      '06',
      '08',
      '09',
      '10',
      '11',
      '12',
      '13',
      '17',
      '18',
      '22',
      '24',
      '26',
      '27',
      '34',
      '37',
      '39',
      '40',
      '42',
      '45',
      '46',
      '47',
      '48',
      '51',
      '53',
      '56'
    )
)
SELECT
  *
FROM
  RandomizedData
ORDER BY
  "Lead Number";

