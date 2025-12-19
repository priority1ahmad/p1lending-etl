"""
Standard 42-column schema for ETL data and column mapping aliases
"""

from typing import Dict, List

# Standard 42-column schema for mortgage lead data
STANDARD_SCHEMA: List[str] = [
    "first_name",
    "middle_name",
    "last_name",
    "email",
    "phone_1",
    "phone_2",
    "phone_3",
    "address",
    "city",
    "state",
    "zip_code",
    "county",
    "property_type",
    "property_value",
    "mortgage_balance",
    "estimated_equity",
    "loan_type",
    "interest_rate",
    "credit_score",
    "employment_status",
    "annual_income",
    "debt_to_income",
    "bankruptcies",
    "foreclosures",
    "tax_liens",
    "cash_out_amount",
    "loan_purpose",
    "property_use",
    "years_in_home",
    "veteran_status",
    "lead_source",
    "lead_date",
    "lead_id",
    "campaign_id",
    "offer_code",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "notes",
    "custom_field_1",
    "custom_field_2",
    "custom_field_3",
]

# Column aliases mapping - maps common variations to standard column names
# Format: "common_variation": "standard_column_name"
COLUMN_ALIASES: Dict[str, str] = {
    # Name fields
    "firstname": "first_name",
    "fname": "first_name",
    "first": "first_name",
    "given_name": "first_name",
    "middlename": "middle_name",
    "mname": "middle_name",
    "middle": "middle_name",
    "mi": "middle_name",
    "lastname": "last_name",
    "lname": "last_name",
    "last": "last_name",
    "surname": "last_name",
    "family_name": "last_name",
    "full_name": "first_name",  # Will need special handling to split
    "name": "first_name",  # Will need special handling to split
    # Email fields
    "email_address": "email",
    "emailaddress": "email",
    "e_mail": "email",
    "mail": "email",
    # Phone fields
    "phone": "phone_1",
    "phone1": "phone_1",
    "phonenumber": "phone_1",
    "phone_number": "phone_1",
    "primary_phone": "phone_1",
    "home_phone": "phone_1",
    "homephone": "phone_1",
    "phone2": "phone_2",
    "secondary_phone": "phone_2",
    "cell_phone": "phone_2",
    "cellphone": "phone_2",
    "mobile": "phone_2",
    "mobile_phone": "phone_2",
    "phone3": "phone_3",
    "work_phone": "phone_3",
    "workphone": "phone_3",
    "alternate_phone": "phone_3",
    # Address fields
    "street": "address",
    "street_address": "address",
    "address1": "address",
    "address_1": "address",
    "property_address": "address",
    "mailing_address": "address",
    # Location fields
    "city_name": "city",
    "town": "city",
    "state_code": "state",
    "state_abbreviation": "state",
    "st": "state",
    "zip": "zip_code",
    "zipcode": "zip_code",
    "postal_code": "zip_code",
    "postalcode": "zip_code",
    "county_name": "county",
    # Property fields
    "prop_type": "property_type",
    "propertytype": "property_type",
    "property_val": "property_value",
    "propertyvalue": "property_value",
    "home_value": "property_value",
    "homevalue": "property_value",
    "estimated_value": "property_value",
    "mortgage_amt": "mortgage_balance",
    "mortgagebalance": "mortgage_balance",
    "loan_balance": "mortgage_balance",
    "loanbalance": "mortgage_balance",
    "current_balance": "mortgage_balance",
    "equity": "estimated_equity",
    "home_equity": "estimated_equity",
    "homeequity": "estimated_equity",
    # Loan fields
    "loantype": "loan_type",
    "loan": "loan_type",
    "mortgage_type": "loan_type",
    "rate": "interest_rate",
    "interestrate": "interest_rate",
    "current_rate": "interest_rate",
    "apr": "interest_rate",
    "credit": "credit_score",
    "creditscore": "credit_score",
    "fico": "credit_score",
    "fico_score": "credit_score",
    # Financial fields
    "employment": "employment_status",
    "emp_status": "employment_status",
    "income": "annual_income",
    "annualincome": "annual_income",
    "yearly_income": "annual_income",
    "salary": "annual_income",
    "dti": "debt_to_income",
    "debt_income_ratio": "debt_to_income",
    "bankruptcy": "bankruptcies",
    "bankruptcy_flag": "bankruptcies",
    "foreclosure": "foreclosures",
    "foreclosure_flag": "foreclosures",
    "taxliens": "tax_liens",
    "tax_lien": "tax_liens",
    # Loan details
    "cashout": "cash_out_amount",
    "cash_out": "cash_out_amount",
    "cashout_amt": "cash_out_amount",
    "purpose": "loan_purpose",
    "loanpurpose": "loan_purpose",
    "reason": "loan_purpose",
    "prop_use": "property_use",
    "propertyuse": "property_use",
    "occupancy": "property_use",
    "years_home": "years_in_home",
    "time_in_home": "years_in_home",
    "veteran": "veteran_status",
    "military": "veteran_status",
    "vet_status": "veteran_status",
    # Lead tracking
    "source": "lead_source",
    "leadsource": "lead_source",
    "origin": "lead_source",
    "date": "lead_date",
    "leaddate": "lead_date",
    "created_date": "lead_date",
    "submission_date": "lead_date",
    "id": "lead_id",
    "leadid": "lead_id",
    "lead_identifier": "lead_id",
    "campaign": "campaign_id",
    "campaignid": "campaign_id",
    "campaign_name": "campaign_id",
    "offer": "offer_code",
    "offercode": "offer_code",
    "promo_code": "offer_code",
    "utm_src": "utm_source",
    "utmsource": "utm_source",
    "utm_med": "utm_medium",
    "utmmedium": "utm_medium",
    "utm_camp": "utm_campaign",
    "utmcampaign": "utm_campaign",
    # Other fields
    "comments": "notes",
    "note": "notes",
    "description": "notes",
    "remarks": "notes",
    "custom1": "custom_field_1",
    "custom_1": "custom_field_1",
    "custom2": "custom_field_2",
    "custom_2": "custom_field_2",
    "custom3": "custom_field_3",
    "custom_3": "custom_field_3",
}


def normalize_column_name(column_name: str) -> str:
    """
    Normalize a column name for matching.
    Converts to lowercase, removes special characters, and strips whitespace.

    Args:
        column_name: Raw column name from file

    Returns:
        Normalized column name
    """
    if not column_name:
        return ""

    # Convert to lowercase and strip whitespace
    normalized = column_name.lower().strip()

    # Replace common separators with underscores
    normalized = normalized.replace(" ", "_").replace("-", "_").replace(".", "_")

    # Remove special characters except underscores
    normalized = "".join(c for c in normalized if c.isalnum() or c == "_")

    # Remove multiple consecutive underscores
    while "__" in normalized:
        normalized = normalized.replace("__", "_")

    # Remove leading/trailing underscores
    normalized = normalized.strip("_")

    return normalized


def get_standard_column(column_name: str) -> str:
    """
    Map a column name to its standard schema equivalent.

    Args:
        column_name: Raw column name from file

    Returns:
        Standard column name, or original normalized name if no match found
    """
    normalized = normalize_column_name(column_name)

    # Check if it's already a standard column
    if normalized in STANDARD_SCHEMA:
        return normalized

    # Check aliases
    if normalized in COLUMN_ALIASES:
        return COLUMN_ALIASES[normalized]

    # Return the normalized name if no match (will be treated as custom field)
    return normalized


def validate_schema_mapping(column_mapping: Dict[str, str]) -> Dict[str, List[str]]:
    """
    Validate a column mapping configuration.

    Args:
        column_mapping: Dictionary mapping file columns to standard columns

    Returns:
        Dictionary with 'valid' and 'invalid' keys containing column lists
    """
    valid_columns = []
    invalid_columns = []

    for file_col, standard_col in column_mapping.items():
        if standard_col in STANDARD_SCHEMA:
            valid_columns.append(file_col)
        else:
            invalid_columns.append(file_col)

    return {
        "valid": valid_columns,
        "invalid": invalid_columns,
    }
