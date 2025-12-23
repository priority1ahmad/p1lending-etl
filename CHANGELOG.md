# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Full Mortgage Lead Schema (42 columns)**: Updated MASTER_PROCESSED_DB to include comprehensive mortgage data
  - Lead Information: Lead Number, Campaign Date, Lead Campaign, Lead Source, Ref ID
  - Person Data: First Name, Last Name, Co Borrower, Address, City, State, Zip
  - Property Data: Total Units, Owner Occupied, Annual Tax Amount, Assessed Value, Estimated Value
  - First Mortgage: LTV, Loan Type, First Mortgage Type, Amount, Balance, Term, Estimated Payment
  - Second Mortgage: Type, Term, Balance, Has Second Mortgage flag
  - Current Loan: Interest Rate, Lender, ARM Index Type, Origination Date, Rate Adjustment Date
  - Contact (enriched): Phone 1-3, Email 1-3
  - Compliance: In Litigator List, Phone 1-3 DNC flags
- **Enhanced Job Progress Tracking**: Real-time display with detailed metrics
  - Time Remaining: Calculated ETA based on processing speed
  - Elapsed Time: Duration since job start
  - Rows Remaining: Dynamic countdown
  - Batch Progress: Current batch / total batches
  - Upload Indicator: Visual notification during final Snowflake upload
- **Human-Readable Table IDs**: New format `LoanType_MMDDYYYY_XXXXXX` (e.g., `FHA_12182024_847392`)
  - Date format: Month/Day/Year for US-standard display
  - 6 random digits for uniqueness

### Changed
- **ETL Upload Strategy**: Changed from per-batch to single bulk upload at job completion
  - All results accumulated during processing
  - Final upload occurs after all enrichment/validation complete
  - Progress notification: "Uploading all results to Snowflake..."
- **Progress Events**: Enhanced WebSocket events with time estimates and detailed metrics
  - Added `time_remaining` field (formatted: "Xm Ys" or "Xh Ym")
  - Added `elapsed_time` field (seconds)
  - Added `rows_remaining` field
- **ActiveJobMonitor Component**: Enhanced UI with comprehensive progress display
  - Visual upload indicator banner
  - Time remaining and elapsed time metrics
  - Rows remaining counter
  - Batch progress display
- **Table ID Service**: Refactored to generate human-readable IDs with date and random suffix

### Fixed

### Removed
- **File Source Upload Feature** (temporarily disabled, code preserved):
  - Removed "File Sources" navigation item from sidebar
  - Disabled `/file-sources` route in frontend
  - Commented out file_sources and file_uploads API routers
  - All code preserved for future re-enablement (3 locations to uncomment)

---

## [0.1.0] - 2024-12-16

### Added
- Initial project setup with FastAPI backend and React frontend
- ETL pipeline with Snowflake integration
- idiCORE API integration for phone/email enrichment
- CCC Litigator API integration for compliance checking
- DNC database validation
- JWT authentication system
- Celery workers for async job processing
- Dashboard with job monitoring
- Login audit logging
- NTFY push notifications
