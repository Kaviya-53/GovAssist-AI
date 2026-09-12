import json
import os
import sys
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from auth import hash_password
from eligibility_engine import evaluate_all_schemes_for_user

def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if already seeded
        existing_admin = db.query(models.User).filter(models.User.email == "admin@govassist.in").first()
        if existing_admin:
            print("Database already contains seed data. Refreshing schemes...")
            # We can still proceed or return
        
        # 1. Create or update Admin User
        if not existing_admin:
            admin_user = models.User(
                email="admin@govassist.in",
                hashed_password=hash_password("Admin@123"),
                full_name="Chief Admin Officer",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Created Admin User: admin@govassist.in / Admin@123")
        
        # 2. Create or update Demo Citizen User
        citizen_user = db.query(models.User).filter(models.User.email == "citizen@govassist.in").first()
        if not citizen_user:
            citizen_user = models.User(
                email="citizen@govassist.in",
                hashed_password=hash_password("Citizen@123"),
                full_name="Ramesh Kumar Sharma",
                role="citizen",
                is_active=True
            )
            db.add(citizen_user)
            db.commit()
            db.refresh(citizen_user)

            # Profile for demo citizen
            profile = models.CitizenProfile(
                user_id=citizen_user.id,
                age=28,
                gender="Male",
                state="Uttar Pradesh",
                district="Varanasi",
                occupation="Farmer",
                annual_income=180000.0,
                category="OBC",
                education_level="12th Pass",
                is_disabled=False,
                disability_percentage=0.0,
                is_farmer=True,
                land_holding_hectares=1.5,
                is_student=False,
                is_business_owner=False,
                marital_status="Married",
                bpl_card_holder=False,
                phone_number="+91 9876543210"
            )
            db.add(profile)
            db.commit()
            print("Created Demo Citizen: citizen@govassist.in / Citizen@123")

            # Add sample documents for demo citizen
            sample_docs = [
                models.Document(
                    user_id=citizen_user.id,
                    doc_type="Aadhaar Card",
                    file_name="aadhaar_ramesh_sharma.pdf",
                    file_path=os.path.join(os.path.dirname(__file__), "uploads", "aadhaar_sample.pdf"),
                    file_size=245000,
                    mime_type="application/pdf",
                    ocr_status="completed",
                    raw_text="GOVERNMENT OF INDIA\nUnique Identification Authority of India\nTo: Ramesh Kumar Sharma\nDOB: 15/07/1998\nGender: Male\nAddress: Village Rampur, Varanasi, Uttar Pradesh - 221001\nAadhaar Number: XXXX-XXXX-8921",
                    extracted_data=json.dumps({
                        "name": "Ramesh Kumar Sharma",
                        "dob": "15/07/1998",
                        "age": 28,
                        "gender": "Male",
                        "id_number": "XXXX-XXXX-8921",
                        "state": "Uttar Pradesh",
                        "district": "Varanasi",
                        "confidence_score": 0.95,
                        "missing_fields": [],
                        "validation_warnings": []
                    }),
                    is_verified=True
                ),
                models.Document(
                    user_id=citizen_user.id,
                    doc_type="Income Certificate",
                    file_name="income_cert_2024.pdf",
                    file_path=os.path.join(os.path.dirname(__file__), "uploads", "income_sample.pdf"),
                    file_size=185000,
                    mime_type="application/pdf",
                    ocr_status="completed",
                    raw_text="OFFICE OF TAHSILDAR VARANASI\nINCOME CERTIFICATE\nCertificate No: INC/UP/2024/78192\nCertified that family annual income of Ramesh Kumar Sharma is Rs. 1,80,000 (One Lakh Eighty Thousand Only).",
                    extracted_data=json.dumps({
                        "name": "Ramesh Kumar Sharma",
                        "annual_income": 180000.0,
                        "certificate_number": "INC/UP/2024/78192",
                        "state": "Uttar Pradesh",
                        "district": "Varanasi",
                        "confidence_score": 0.92,
                        "missing_fields": [],
                        "validation_warnings": []
                    }),
                    is_verified=True
                )
            ]
            db.add_all(sample_docs)
            db.commit()

        # 3. Seed Realistic Indian Government Schemes (16 Comprehensive Schemes)
        schemes_data = [
            {
                "name": "Pradhan Mantri Kisan Samman Nidhi",
                "code": "PM-KISAN",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "category": "Agriculture",
                "description": "An initiative by the Government of India that provides income support to all landholding farmer families in the country to supplement their financial needs for procuring various inputs related to agriculture and domestic requirements.",
                "benefits": "₹6,000 per year directly transferred to bank accounts in three equal installments of ₹2,000 every 4 months via Direct Benefit Transfer (DBT).",
                "required_documents": ["Aadhaar Card", "Land Ownership Record (Khatauni/Khasra)", "Bank Account Passbook", "Citizenship / Domicile Certificate"],
                "application_process": "1. Visit the PM-KISAN official portal (pmkisan.gov.in).\n2. Click on 'New Farmer Registration' under Farmers Corner.\n3. Enter Aadhaar number and captcha, choose Rural/Urban.\n4. Fill personal, land record details, and active bank account IFSC.\n5. Submit for state revenue department e-verification.",
                "official_url": "https://pmkisan.gov.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 85,
                    "gender": "All",
                    "max_income": None,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Farmer", "Agriculture"],
                    "requires_farmer": True,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana",
                "code": "PM-JAY",
                "ministry": "Ministry of Health and Family Welfare",
                "category": "Healthcare",
                "description": "The world's largest government-funded health assurance scheme aimed at providing financial protection against catastrophic healthcare expenditure to over 12 crore poor and vulnerable families (approx 55 crore beneficiaries).",
                "benefits": "Cashless health cover of up to ₹5,00,000 per family per year for secondary and tertiary care hospitalization across empanelled public and private hospitals across India.",
                "required_documents": ["Aadhaar Card", "Ration Card (BPL/Antyodaya)", "Income Certificate", "SECC Database Identification"],
                "application_process": "1. Check name in SECC-2011 beneficiary list on mera.pmjay.gov.in.\n2. Visit any nearest Empanelled Health Care Provider (EHCP) or CSC center.\n3. Ayushman Mitra verifies biometric Aadhaar identity.\n4. Instant generation of Ayushman Golden Health Card for cashless treatment.",
                "official_url": "https://pmjay.gov.in",
                "criteria": {
                    "min_age": 0,
                    "max_age": 110,
                    "gender": "All",
                    "max_income": 250000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": True
                }
            },
            {
                "name": "Pradhan Mantri Awas Yojana - Gramin",
                "code": "PMAY-G",
                "ministry": "Ministry of Rural Development",
                "category": "Housing",
                "description": "Flagship rural housing scheme aimed at providing a pucca house with basic amenities to all houseless households and households living in kutcha and dilapidated houses in rural areas.",
                "benefits": "Financial assistance of ₹1,20,000 in plains and ₹1,30,000 in hilly/difficult states for constructing a pucca house, plus 90-95 person-days of unskilled labor support under MGNREGA and ₹12,000 for toilet construction.",
                "required_documents": ["Aadhaar Card", "Bank Account Details", "Kutcha House Certificate / Affidavit", "BPL Ration Card", "MGNREGA Job Card"],
                "application_process": "1. Beneficiaries are identified through SECC-2011 and validated by Gram Sabha.\n2. Block Development Officer (BDO) registers the validated beneficiary on AwaasSoft.\n3. Geo-tagged photographs of existing kutcha site are uploaded.\n4. Installments disbursed directly into bank account upon stage-wise inspection.",
                "official_url": "https://pmayg.nic.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 90,
                    "gender": "All",
                    "max_income": 300000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": True
                }
            },
            {
                "name": "Pradhan Mantri Mudra Yojana",
                "code": "PMMY",
                "ministry": "Ministry of Finance",
                "category": "Employment",
                "description": "Scheme launched to fund the unfunded by providing collateral-free loans up to ₹10 Lakhs to non-corporate, non-farm small/micro enterprises across Shishu, Kishor, and Tarun categories.",
                "benefits": "Collateral-free business credit up to ₹10,00,000 with low interest rates: Shishu (up to ₹50,000), Kishor (₹50,001 to ₹5,00,000), and Tarun (₹5,00,001 to ₹10,00,000) for working capital and equipment.",
                "required_documents": ["Identity Proof (PAN/Aadhaar)", "Proof of Residence", "Business Registration / Trade License", "Past 6 Months Bank Statement", "Project Quotation / Business Plan"],
                "application_process": "1. Prepare business idea and expenditure breakdown.\n2. Apply online via UdyamiMitra portal (udyamimitra.in) or visit nearest PSU/Private bank.\n3. Submit loan application under Shishu, Kishor, or Tarun.\n4. Sanctioned amount is credited to Mudra Card account.",
                "official_url": "https://www.mudra.org.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 65,
                    "gender": "All",
                    "max_income": None,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Business", "Self-Employed", "Entrepreneur", "Vendor", "Other"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": True,
                    "requires_bpl": False
                }
            },
            {
                "name": "Post-Matric Scholarship for SC/ST/OBC Students",
                "code": "PMS-SC-ST-OBC",
                "ministry": "Ministry of Social Justice and Empowerment",
                "category": "Education",
                "description": "Centrally sponsored scholarship scheme designed to provide financial assistance to students belonging to Scheduled Castes, Scheduled Tribes, and Other Backward Classes studying at post-matriculation or post-secondary stages.",
                "benefits": "100% compulsory non-refundable fees reimbursement including tuition fee, examination fee, plus monthly maintenance allowance up to ₹1,200 per month for day scholars and hostellers.",
                "required_documents": ["Caste Certificate", "Income Certificate (Family income < ₹2.5L)", "Previous Year Marksheet", "College Admission Fee Receipt", "Bank Passbook seeded with Aadhaar"],
                "application_process": "1. Register on National Scholarship Portal (scholarships.gov.in).\n2. Complete One Time Registration (OTR) and link DigiLocker.\n3. Fill course details and upload Caste & Income certificates.\n4. Institute verifies application digitally, followed by District/State Welfare Officer.",
                "official_url": "https://scholarships.gov.in",
                "criteria": {
                    "min_age": 15,
                    "max_age": 35,
                    "gender": "All",
                    "max_income": 250000.0,
                    "allowed_categories": ["SC", "ST", "OBC"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Student"],
                    "requires_farmer": False,
                    "requires_student": True,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Sukanya Samriddhi Yojana",
                "code": "SSY",
                "ministry": "Ministry of Women and Child Development",
                "category": "Women Welfare",
                "description": "A government-backed small deposit scheme launched under Beti Bachao Beti Padhao campaign for the welfare of the girl child, offering the highest post-office interest rate and tax exemption under 80C.",
                "benefits": "High compound interest rate (currently 8.2% p.a.), exempt-exempt-exempt (EEE) tax status under Section 80C, matures when the girl turns 21 years of age.",
                "required_documents": ["Birth Certificate of Girl Child", "Identity Proof of Parent/Guardian (Aadhaar/PAN)", "Proof of Address", "Passport-size Photographs"],
                "application_process": "1. Visit any Post Office or authorized commercial bank branch.\n2. Fill SSY Account Opening Form (Form-1).\n3. Submit with child's birth certificate and guardian's KYC.\n4. Deposit initial minimum amount of ₹250 to activate account.",
                "official_url": "https://www.indiapost.gov.in",
                "criteria": {
                    "min_age": 0,
                    "max_age": 10,
                    "gender": "Female",
                    "max_income": None,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Pradhan Mantri Matru Vandana Yojana",
                "code": "PMMVY",
                "ministry": "Ministry of Women and Child Development",
                "category": "Women Welfare",
                "description": "A maternity benefit program providing cash incentive to pregnant women and lactating mothers for first and second live child to compensate for wage loss during pregnancy and ensure nutritious care.",
                "benefits": "Cash incentive of ₹5,000 in two installments for the first child and ₹6,000 for a second girl child directly credited via DBT to mother's Aadhaar-seeded bank account.",
                "required_documents": ["Mother & Husband's Aadhaar Card", "Mother and Child Protection (MCP) Card", "Bank Account Passbook of Mother", "Identity Proof"],
                "application_process": "1. Register at nearest Anganwadi Centre (AWC) or approved health facility within 150 days of pregnancy.\n2. Submit Form 1A along with MCP card copy.\n3. Second installment claimed after child birth registration and initial vaccination cycle.\n4. Can also apply directly via pmmvy.wcd.gov.in portal.",
                "official_url": "https://pmmvy.wcd.gov.in",
                "criteria": {
                    "min_age": 19,
                    "max_age": 45,
                    "gender": "Female",
                    "max_income": 800000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Mahatma Gandhi National Rural Employment Guarantee Scheme",
                "code": "MGNREGA",
                "ministry": "Ministry of Rural Development",
                "category": "Employment",
                "description": "Social security measure that guarantees the 'right to work' by providing at least 100 days of guaranteed wage employment in a financial year to every rural household whose adult members volunteer to do unskilled manual work.",
                "benefits": "100 days of guaranteed wage employment per financial year at statutory state minimum daily wages (approx ₹220 - ₹350 per day), unemployment allowance if work is not allotted within 15 days.",
                "required_documents": ["Aadhaar Card", "Ration Card", "Rural Residence Proof", "Bank / Post Office Account Passbook"],
                "application_process": "1. Submit written or oral application to local Gram Panchayat.\n2. Gram Panchayat verifies residence and issues NREGA Job Card within 15 days.\n3. Submit written work demand indicating preferred dates.\n4. Direct wage payment to bank account within 15 days of muster roll completion.",
                "official_url": "https://nrega.nic.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 70,
                    "gender": "All",
                    "max_income": 200000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Daily Wage", "Farmer", "Unemployed", "Other"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "PM Street Vendor's AtmaNirbhar Nidhi",
                "code": "PM-SVANIDHI",
                "ministry": "Ministry of Housing and Urban Affairs",
                "category": "Employment",
                "description": "A micro-credit facility scheme to provide affordable collateral-free working capital loan to urban, peri-urban, and rural street vendors to resume their livelihoods post-pandemic.",
                "benefits": "Initial working capital loan of ₹10,000 with 7% interest subsidy on timely repayment, second tranche of ₹20,000, and third tranche up to ₹50,000, along with monthly cashback on digital transactions up to ₹100/month.",
                "required_documents": ["Aadhaar Card", "Certificate of Vending / Urban Local Body ID Card", "Bank Account Details", "Mobile Number linked with Aadhaar"],
                "application_process": "1. Check vending survey status on pmsvanidhi.mohua.gov.in.\n2. If not registered, obtain Letter of Recommendation (LoR) from ULB/Town Vending Committee.\n3. Apply online with Aadhaar-eKYC.\n4. Lending institution disburses funds within 7 days.",
                "official_url": "https://pmsvanidhi.mohua.gov.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 65,
                    "gender": "All",
                    "max_income": 300000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Vendor", "Business", "Self-Employed", "Other"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": True,
                    "requires_bpl": False
                }
            },
            {
                "name": "National Social Assistance Programme - Disability Pension (IGNDPS)",
                "code": "NSAP-IGNDPS",
                "ministry": "Ministry of Rural Development",
                "category": "Social Welfare",
                "description": "Indira Gandhi National Disability Pension Scheme provides monthly social pension to persons with severe or multiple disabilities living below the poverty line.",
                "benefits": "Monthly pension of ₹300 - ₹1,000 (Central + matching State contribution) transferred directly into beneficiary's bank account every month.",
                "required_documents": ["Disability Certificate (UDID card showing >= 80% or severe disability)", "BPL Ration Card / Income Certificate", "Aadhaar Card", "Bank Account Passbook"],
                "application_process": "1. Obtain UDID (Unique Disability Identity) card from Chief Medical Officer.\n2. Apply at Block Development Office / Municipal Ward Office or via nsap.nic.in.\n3. Gram Panchayat / Sub-Divisional Committee reviews BPL status.\n4. Monthly pension sanctioned and credited automatically.",
                "official_url": "https://nsap.nic.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 79,
                    "gender": "All",
                    "max_income": 150000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": True,
                    "requires_business": False,
                    "requires_bpl": True
                }
            },
            {
                "name": "Pradhan Mantri Ujjwala Yojana",
                "code": "PMUY",
                "ministry": "Ministry of Petroleum and Natural Gas",
                "category": "Women Welfare",
                "description": "Scheme aimed at making clean cooking fuel (LPG) available to rural and deprived households that were otherwise relying on traditional polluting fuels such as firewood and coal dung cakes.",
                "benefits": "Deposit-free LPG connection for adult woman of BPL household with financial support of ₹1,600 per connection, free first LPG cylinder refill, and free hotplate (stove).",
                "required_documents": ["BPL Ration Card / 14-point declaration", "Aadhaar of Woman Applicant & Adult Family Members", "Bank Account Passbook", "Proof of Address"],
                "application_process": "1. Download form from pmuy.gov.in or collect from nearest LPG distributor (Indane, Bharat Gas, HP).\n2. Submit filled form with woman's Aadhaar and Ration Card.\n3. Distributor performs OMC de-duplication check.\n4. Gas agency delivers cylinder and stove to residence.",
                "official_url": "https://www.pmuy.gov.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 75,
                    "gender": "Female",
                    "max_income": 200000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": True
                }
            },
            {
                "name": "Kisan Credit Card Scheme",
                "code": "KCC",
                "ministry": "Ministry of Agriculture & Farmers Welfare",
                "category": "Agriculture",
                "description": "Provides adequate and timely credit support from the banking system under single window with flexible and simplified procedure to farmers for their cultivation and agriculture-allied activities.",
                "benefits": "Revolving credit limit up to ₹3,00,000 at highly subsidized effective interest rate of 4% per annum (with 3% prompt repayment incentive) and ATM-enabled RuPay Kisan debit card.",
                "required_documents": ["Duly filled KCC Application Form", "Aadhaar / Voter ID", "Land Record Extract (Khasra & Khatauni)", "Cropping Pattern Certificate"],
                "application_process": "1. Approach cooperative bank, RRB, or commercial bank branch where farmer holds savings account.\n2. Submit one-page simplified KCC form.\n3. Bank processes and inspects land records within 14 working days.\n4. Issue RuPay KCC card with sanctioned credit limit.",
                "official_url": "https://agricoop.nic.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 75,
                    "gender": "All",
                    "max_income": None,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Farmer", "Agriculture"],
                    "requires_farmer": True,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "National Means-cum-Merit Scholarship Scheme",
                "code": "NMMSS",
                "ministry": "Ministry of Education",
                "category": "Education",
                "description": "Aims to award scholarships to meritorious students of economically weaker sections to arrest their drop out at class VIII and encourage them to continue study at secondary stage.",
                "benefits": "Scholarship amount of ₹12,000 per annum (₹1,000 per month) from Class IX to Class XII directly credited into student's bank account.",
                "required_documents": ["Class 7th Marksheet (min 55% marks)", "Income Certificate (Family income < ₹3.5 Lakh)", "Caste Certificate if applicable", "Student Aadhaar & Bank Passbook"],
                "application_process": "1. State conducts State Level NMMSS Selection Test for Class VIII students.\n2. Qualifying students register on National Scholarship Portal (scholarships.gov.in).\n3. School headmaster verifies student enrollment.\n4. Funds disbursed annually by Ministry of Education via DBT.",
                "official_url": "https://scholarships.gov.in",
                "criteria": {
                    "min_age": 12,
                    "max_age": 18,
                    "gender": "All",
                    "max_income": 350000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Student"],
                    "requires_farmer": False,
                    "requires_student": True,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Pradhan Mantri Jan Dhan Yojana",
                "code": "PMJDY",
                "ministry": "Ministry of Finance",
                "category": "Social Welfare",
                "description": "National Mission for Financial Inclusion to ensure access to financial services, namely, a basic savings & deposit accounts, remittance, credit, insurance, and pension in an affordable manner.",
                "benefits": "Zero minimum balance savings account, free RuPay debit card with ₹2,00,000 inbuilt accidental insurance cover, and overdraft facility up to ₹10,000 for eligible account holders.",
                "required_documents": ["Aadhaar Card", "PAN or Form 60", "Passport size photograph"],
                "application_process": "1. Visit any Bank branch or Bank Mitra (Business Correspondent).\n2. Fill PMJDY Account Opening Form.\n3. Biometric e-KYC using Aadhaar.\n4. Instant passbook and RuPay debit card issuance without initial deposit.",
                "official_url": "https://pmjdy.gov.in",
                "criteria": {
                    "min_age": 10,
                    "max_age": 100,
                    "gender": "All",
                    "max_income": None,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Atal Pension Yojana",
                "code": "APY",
                "ministry": "Ministry of Finance",
                "category": "Social Welfare",
                "description": "Guaranteed pension scheme for unorganized sector workers administered by PFRDA through the National Pension System (NPS) architecture to provide financial security in old age.",
                "benefits": "Guaranteed minimum monthly pension of ₹1,000, ₹2,000, ₹3,000, ₹4,000 or ₹5,000 per month starting from the age of 60 years based on monthly contribution.",
                "required_documents": ["Aadhaar Card", "Savings Bank Account / Post Office Account", "Mobile Number linked to bank"],
                "application_process": "1. Approach bank branch where savings account is maintained.\n2. Submit APY registration form with auto-debit consent.\n3. Select guaranteed monthly pension slab.\n4. Receive PRAN (Permanent Retirement Account Number) card and SMS confirmation.",
                "official_url": "https://www.npscra.nsdl.co.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 40,
                    "gender": "All",
                    "max_income": 400000.0,
                    "allowed_categories": ["All"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["All"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": False,
                    "requires_bpl": False
                }
            },
            {
                "name": "Stand-Up India Scheme for SC/ST and Women",
                "code": "STANDUP-INDIA",
                "ministry": "Ministry of Finance",
                "category": "Employment",
                "description": "Facilitates bank loans between ₹10 lakh and ₹1 Crore to at least one Scheduled Caste (SC) or Scheduled Tribe (ST) borrower and at least one woman borrower per bank branch for setting up a greenfield enterprise.",
                "benefits": "Composite loan (term loan + working capital) between ₹10,00,000 and ₹1,00,00,000 to cover up to 75% of project cost with margin money convergence.",
                "required_documents": ["Aadhaar / Passport / Voter ID", "Caste Certificate (for SC/ST)", "Detailed Project Report (DPR)", "Pollution Control Clearance / Municipal NOC", "Past 3 Years IT returns if applicable"],
                "application_process": "1. Register on Stand-Up India portal (standupmitra.in).\n2. Choose 'Trainee Borrower' for guidance or 'Ready Borrower' for immediate loan application.\n3. Submit DPR and financial projections to designated bank.\n4. Bank sanctions composite loan with handholding support.",
                "official_url": "https://www.standupmitra.in",
                "criteria": {
                    "min_age": 18,
                    "max_age": 70,
                    "gender": "All",
                    "max_income": None,
                    "allowed_categories": ["SC", "ST"],
                    "allowed_states": ["All"],
                    "allowed_occupations": ["Business", "Self-Employed", "Entrepreneur", "Other"],
                    "requires_farmer": False,
                    "requires_student": False,
                    "requires_disabled": False,
                    "requires_business": True,
                    "requires_bpl": False
                }
            }
        ]

        # Insert or update schemes
        for s_data in schemes_data:
            existing = db.query(models.Scheme).filter(models.Scheme.code == s_data["code"]).first()
            if not existing:
                crit_data = s_data.pop("criteria")
                req_docs_json = json.dumps(s_data.pop("required_documents"))
                scheme_obj = models.Scheme(**s_data, required_documents=req_docs_json)
                db.add(scheme_obj)
                db.commit()
                db.refresh(scheme_obj)

                criteria_obj = models.SchemeCriteria(
                    scheme_id=scheme_obj.id,
                    min_age=crit_data.get("min_age"),
                    max_age=crit_data.get("max_age"),
                    gender=crit_data.get("gender", "All"),
                    max_income=crit_data.get("max_income"),
                    allowed_categories=json.dumps(crit_data.get("allowed_categories", ["All"])),
                    allowed_states=json.dumps(crit_data.get("allowed_states", ["All"])),
                    allowed_occupations=json.dumps(crit_data.get("allowed_occupations", ["All"])),
                    requires_farmer=crit_data.get("requires_farmer", False),
                    requires_student=crit_data.get("requires_student", False),
                    requires_disabled=crit_data.get("requires_disabled", False),
                    requires_business=crit_data.get("requires_business", False),
                    requires_bpl=crit_data.get("requires_bpl", False),
                    min_education=crit_data.get("min_education")
                )
                db.add(criteria_obj)
                db.commit()

        print(f"Successfully seeded {len(schemes_data)} realistic government schemes.")

        # 4. Evaluate schemes for demo citizen to immediately populate metrics
        if citizen_user:
            evaluate_all_schemes_for_user(db, citizen_user)
            print("Evaluated eligibility for demo citizen.")

        print("Database seed completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
