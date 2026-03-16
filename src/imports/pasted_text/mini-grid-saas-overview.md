PRODUCT 5: Mini-Grid Management + Solar Billing SaaS
SaaS for mini-grid operators: billing, metering, customer management, energy distribution.
A. Product Overview
Problem Statement
Sub-Saharan Africa still has ~600 million people lacking electricity (2025). Over 3,000 mini-grids are installed across SSA (grown 6x since 2018), with 9,000 planned. Tanzania has ~109+ operational mini-grids (3.76 MW, 18,000 consumers) and Kenya has ~90+ (110,000 households). The global mini-grid market is $13.1 billion (2025), projected to reach $45.3 billion by 2035 (13.2% CAGR). Yet the primary commercial smart metering competitor, SparkMeter, sold its US operations to Honeywell in 2025 and handed emerging-market operations to a non-profit (EarthSpark) — signaling strategic retreat. SteamaCo, the market leader, merged with Nigeria's Shyft Power Solutions and shifted focus to grid-connected markets. This creates a significant market gap for East Africa mini-grid operators who need reliable, affordable billing and metering software.
Target Users
•	Mini-Grid Operators: Companies running 1–50 solar/hybrid mini-grids in rural East Africa; managing 50–5,000 customer connections per site.
•	Rural Energy Agencies: REA Tanzania, KPLC Kenya — government bodies deploying mini-grids at scale.
•	Solar Home System Companies: M-KOPA (4.8M customers), Sun King (45,000 agents), d.light — PAYG billing system integration.
•	PAYG Operators: Companies using lease-to-own or energy-bundle models needing metering + billing + collection.
Value Proposition
The only East Africa-focused mini-grid SaaS combining PAYG billing, smart meter management, mobile money collection (all EA wallets), USSD customer self-service, and carbon credit data tracking — at $0.15–0.40/meter/month (50–80% below SteamaCo's estimated pricing). Local team, local support, local mobile money integration.
Primary Markets
Launch: Tanzania (largest mini-grid opportunity: REA programs + World Bank funding) → Expand: Kenya (Month 8) → Rwanda, Uganda (Year 2).
B. Competitive Landscape
Competitor	Country	Funding	Key Features	Pricing	Weakness
SteamaCo	UK/Africa	Merger with Shyft (Nov 2024)	Savi meters, Nimbus AMI platform, PAYG, mobile money, 9 languages, AI loss detection	Undisclosed (est. 5–20% of HW cost/yr)	Post-merger focus on Nigeria/grid-connected; no public pricing; enterprise-only
SparkMeter	USA/EarthSpark	~$16M total	Smart meters (NEMSA/UNBS certified), cloud analytics, prepaid, PAYG	Meter margin + SaaS	US ops sold to Honeywell 2025; EarthSpark non-profit taking over emerging markets — strategic retreat
Odyssey Energy	India/Global	BII $7.5M facility	Procurement, financing, monitoring platform; 3,000+ companies	Platform fee	Procurement/financing focus; not a pure billing/metering SaaS
Devergy	Tanzania	Early stage	Custom meters + energy bundle billing (like mobile data packages)	Custom	Vertically integrated; proprietary hardware; not pure SaaS for other operators
PowerGen (AMini)	Kenya/Nigeria	PIDG/IFU platform invest	Proprietary admin platform; SparkMeter/SteamaCo meters	Internal only	Not commercially available SaaS; internal tool only
ENGIE Energy Access	Pan-Africa	ENGIE subsidiary	PAYGO + mini-grid; 2,000 mini-grid target by 2025	Internal	Internal platform; not available to third parties

CREOVA Differentiation
•	SparkMeter Gap: ~1 million meter users need alternative support after SparkMeter's retreat — direct acquisition opportunity.
•	East Africa Focus: SteamaCo focused on Nigeria/grid post-merger; CREOVA owns EA mini-grid SaaS.
•	Integrated Carbon Credit: First platform combining metering + billing + carbon revenue tracking (MWh generated → CO2 offset reporting).
•	Local Team: East Africa-based support vs. UK/India headquarters.
•	Affordable Pricing: $0.15–0.40/meter/month vs. estimated $0.21–0.83 for competitors.
Competitive Moat
The mini-grid sector is undergoing consolidation (SparkMeter exit, SteamaCo merger) creating a window for a new entrant. Operators are locked into metering hardware but need SaaS — a hardware-agnostic platform that works with SteamaCo Savi, SparkMeter Advantage, Hexing, Conlog meters creates stickiness through data migration costs. Carbon credit reporting adds a revenue stream competitors don't offer.
C. Core Features (MVP)
1.	Meter Registration & Device Management: Register smart meters; configure load limits; OTA firmware updates; tamper detection alerts.
2.	PAYG Billing Engine: Prepaid token generation (STS-compliant IEC 62055-41); credit/debit management; tariff configuration.
3.	Mobile Money Collection: M-Pesa, Airtel, Tigo Cash, MTN MoMo integration for payment collection; automated token dispatch upon payment.
4.	USSD/SMS Customer Portal: Customers check balance, buy tokens, report issues via USSD (no smartphone needed).
5.	Operator Dashboard: Web + mobile dashboard: site overview, customer list, revenue, outages, maintenance schedule.
6.	Real-Time Monitoring: Load patterns, power quality metrics, generation vs. consumption, loss detection.
7.	Agent App: Field agents collect cash payments, issue tokens, perform site inspections, report issues.
8.	Automated Alerts: SMS/email alerts for outages, low credit, tamper events, maintenance due.
9.	Revenue Analytics: Collection rate, ARPU per customer, revenue per kWh, daily/monthly reports.
10.	Carbon Credit Data Module: Track MWh generated from solar, calculate CO2 baseline vs. diesel displacement, generate reporting for Verra/Gold Standard certification.
v1.0 vs v2.0
•	v1.0: Meter management, PAYG billing (STS tokens), mobile money collection, USSD customer portal, operator dashboard, basic analytics, SMS alerts.
•	v2.0: AI-powered loss detection, productive-use customer analytics, carbon credit registry integration (Verra/Gold Standard), multi-site portfolio management, STS token vending API, Odyssey procurement integration.
D. Technical Architecture
Tech Stack
Layer	Technology	Rationale
Frontend (Web)	React.js	Operator dashboard; responsive for tablet use in field
Frontend (Mobile)	React Native	Agent app for field operations; offline-capable
Backend	Node.js (Express) + Python (analytics)	Async MQTT processing; Python for ML analytics
IoT Ingestion	AWS IoT Core (MQTT)	~$0.009/meter/month for 1,000 meters; MQTT optimized for low-bandwidth
Database	PostgreSQL (billing/customers) + DynamoDB (meter readings)	Relational for business logic; NoSQL for high-volume time-series
Queue	AWS SQS + Lambda	Async processing of meter events and payment callbacks
Cloud	AWS af-south-1	Closest to EA; IoT Core available
Payments (KE)	M-Pesa Daraja C2B	STK Push for token purchase
Payments (TZ)	ClickPesa + Airtel + Tigo Cash	All TZ mobile wallets
Payments (RW)	MTN MoMo	Rwanda's leading mobile money
SMS/USSD	Africa's Talking	Customer self-service; alerts; token delivery

Key API Integrations
•	AWS IoT Core: aws.amazon.com/iot-core — MQTT broker. $0.08/1M connection-minutes; $1.00/1M messages. Cost for 1,000 meters: ~$9/month.
•	M-Pesa Daraja C2B: developer.safaricom.co.ke — Customer-to-Business STK Push for token purchase.
•	ClickPesa: clickpesa.com — All 4 TZ wallets; 1% Bill Pay fee.
•	MTN MoMo: momodeveloper.mtn.com — 30 APIs; C2B/B2C/B2B for Rwanda/Uganda.
•	Africa's Talking: africastalking.com — USSD for customer self-service; SMS for token delivery and alerts.
•	STS Token Generation: IEC 62055-41 compliant; requires STS Association registration (sts.org.za).
Architecture Diagram
[Smart Meters (Savi/SparkMeter/Hexing)] → [GPRS/GSM → DCU] → [AWS IoT Core (MQTT)]
                                                                    ↓
                                                      [Lambda/Kinesis Processing]
                                                            ↓             ↓
                                                  [DynamoDB Readings] [PostgreSQL Billing]
                                                            ↓
                                                  [REST API → Dashboard + Agent App]
                                                            ↓
                                                  [ClickPesa/Daraja → Customer USSD/SMS]
IoT Communication Protocols
•	Meter → DCU: DLMS/COSEM (IEC 62056), Modbus, M-Bus.
•	DCU → Cloud: MQTT over GPRS/4G (most common); optimized for low bandwidth.
•	STS Token: 20-digit IEC 62055-41 compliant token; NOTE: must use TID Rollover-compliant meters (Nov 2024 event).
•	Data volume: SteamaCo Savi uses <100kB/month per meter — highly optimized for Africa's data costs.
Offline-First Strategy
Agent app works offline for cash collection and token issuance (pre-generated token batch). Meter data buffers locally on DCU during connectivity gaps and transmits when GPRS resumes. Dashboard requires connectivity but caches recent data for offline viewing.
Data Model
Key entities: Operators → Sites → Meters → Customers → Tokens → Payments → MeterReadings → Alerts → MaintenanceLogs → CarbonCredits. Meter readings are time-series (DynamoDB); billing and customer data are relational (PostgreSQL). Carbon credits aggregate MWh generated per site against diesel baseline.
E. Regulatory & Compliance
Requirement	Tanzania	Kenya
Energy Regulator	EWURA (Energy and Water Utilities Regulatory Authority)	EPRA (Energy and Petroleum Regulatory Authority)
Mini-Grid License	<15kW + ≥30 customers: Registration via LOIS. ≥100kW: full tariff review	<1MW: simplified permit. ≥1MW <3MW: EPRA permit. ≥3MW: full license
Tariff Approval	Apply via LOIS before commercial operations; EWURA reviews	Apply within 12 months of EOI; EPRA approves retail tariff
Pre-Development	Letter of Support from Ministry of Energy required	EOI to Cabinet Secretary; decision within 30 days; grants site exclusivity
Construction Standards	Tanzania Bureau of Standards (TBS) mini-grid standards	KEBS electrical standards; Kenya Building Code 2024
Grid Arrival Compensation	Operators eligible IF built to TBS standards, registered, Letter of Support obtained	Regulated; KPLC compensation mechanism
Carbon Credits	Verra ($0.10–0.20/credit) or Gold Standard ($0.15–0.25/credit); setup $5K–50K; 6–15 months	Same standards; AirCarbon Exchange (Kenya) available

Tanzania Mini-Grid Tariffs (2024/25)
Category	Jumeme (TZS/kWh)	PowerGen (TZS/kWh)	Watu & Umeme
Residential (Day)	1,710 (~$0.68)	2,506 (~$1.00)	1,500 (~$0.60)
Business (Day)	1,560 (~$0.62)	—	1,300 (~$0.52)
Productive Use (Day)	1,310 (~$0.52)	941 (~$0.38)	—
F. Revenue Model & Pricing
Revenue Stream	Model	Amount
Per-Meter SaaS Fee	Monthly fee per connected meter	$0.15–0.40/meter/month (competitive vs. est. $0.21–0.83 industry)
Implementation Fee	One-time per-site setup + integration	$500–2,000 per site
Payment Processing	Commission on mobile money collections	0.5–1% on top of mobile money provider fee
Carbon Credit Data	Reporting module subscription for carbon verification	$50–100/site/year
Premium Analytics	Advanced loss detection, load forecasting, predictive maintenance	$0.05–0.10/meter/month add-on

Revenue Projections
Metric	Year 1	Year 2	Year 3
Connected Meters	2,000	15,000	60,000
SaaS Revenue ($0.25/meter/mo avg)	$6K	$45K	$180K
Implementation Fees	$15K	$50K	$100K
Payment Processing	$3K	$20K	$80K
Carbon Credit Module	$2K	$15K	$50K
Total Revenue	$26K	$130K	$410K
Carbon Credit Revenue (Per 50kW Mini-Grid)
•	Annual generation: ~100 MWh; diesel emission factor: ~0.8 tCO2e/MWh
•	Annual credits: ~80 tCO2e
•	At $3/tCO2e (Africa OTC renewable energy): ~$240/year per site
•	At $13/tCO2e (premium Gold Standard): ~$1,040/year per site
•	Net after 30–70% intermediary fees: $72–$728/year per site
Unit Economics
Revenue per meter: $3–5/year SaaS + $0.50–1/year payment processing. Cost per meter: ~$0.50–1/year (AWS IoT Core + compute). Gross margin: 70–80%. CAC per operator: $2,000–5,000 (direct sales). LTV per operator (100 meters × 3 years): $9,000–15,000. LTV:CAC: 3–5x.
G. Go-to-Market Strategy
Launch: Tanzania
Tanzania has 6 registered mini-grid companies, 109+ operational mini-grids, and active REA Results-Based Financing programs. REA launched 20,000 solar home systems for Lake Victoria islands in Feb 2026 with 75% government subsidy. World Bank Kenya Off-Grid Solar Access Project targets 150 new mini-grids. AMDA (Africa Minigrid Developers Association) has 65+ member companies.
First 100 Users (Sites)
1.	Month 1–3: Direct outreach to 6 EWURA-registered companies (Jumeme, Watu & Umeme, PowerGen TZ, Devergy, etc.).
2.	Month 3–5: Pilot with 2 operators covering 5–10 sites each (~500–1,000 meters total).
3.	Month 5–8: AMDA partnership — present at AMDA events; offer free 3-month trial to members.
4.	Month 8–12: Kenya expansion — target PowerGen Kenya, ENGIE EA; World Bank project mini-grids.
Partnership Channels
•	AMDA: 65+ member companies — single partnership provides access to entire mini-grid developer ecosystem.
•	REA Tanzania: Government body implementing RBF programs; potential procurement channel.
•	PowerGen: 13+ years Africa experience; January 2025 raised platform investment for 120MW deployment.
•	ENGIE Energy Access: Targets 2,000 mini-grids across Africa; potential white-label billing partner.
•	M-KOPA: 4.8M PAYG customers; KES 1.2B profit 2024; PAYG billing integration.
•	Sun King: 45,000 agents in 11 African countries; $40M equity from Lightrock (Dec 2025).
H. 12-Month Roadmap
Phase	Timeline	Activities	Milestones
Phase 1: MVP	Months 1–3	Core billing engine; MQTT meter data ingestion; M-Pesa/Airtel integration; USSD customer portal; operator dashboard v1	Prototype live; 1 operator pilot agreement; AWS IoT Core configured
Phase 2: Pilot	Months 4–6	2 operator pilot (500+ meters); STS token vending; agent app; SMS alerts; iterate on operator feedback	500 meters connected; 90%+ collection rate; operator satisfaction validated
Phase 3: Launch	Months 7–9	Commercial launch Tanzania; Kenya pilot; carbon credit data module v1; AMDA partnership activation	2,000 meters; 5 operator contracts; carbon reporting pilot with 2 sites
Phase 4: Scale	Months 10–12	Scale to 5+ operators; advanced analytics (loss detection); multi-site portfolio view; pricing optimization	5,000+ meters on platform; $26K+ revenue; Rwanda/Uganda pipeline
I. Key Risks & Mitigations
Risk	Severity	Mitigation
Hardware fragmentation (different meter brands)	High	Build hardware-agnostic platform supporting DLMS/COSEM, Modbus, STS standards; adapter layer for each meter type
Operator concentration risk (few large customers)	High	Diversify across 10+ operators by Year 2; target both large (PowerGen, ENGIE) and small operators; AMDA network
STS compliance complexity	Medium	Partner with STS-certified token vendor initially; pursue STS Association certification in Year 2
Cellular connectivity in rural areas	Medium	Support LoRaWAN and G3-PLC communication alternatives; buffer data locally on DCU during gaps
Main grid arrival displaces mini-grids	Low	EWURA compensation framework protects operators; transition to grid-connected analytics (SteamaCo model)
J. Budget Estimate
Category	Details	Year 1 Cost
Development Team	2 backend + 1 IoT engineer + 1 mobile + 1 frontend + 1 QA	$160,000–$240,000
IoT Infrastructure	AWS IoT Core + DynamoDB + Lambda + compute	$8,000–$15,000
Cloud (General)	AWS RDS PostgreSQL + S3 + Cloudflare	$8,000–$12,000
STS Certification	STS Association registration + compliance testing	$10,000–$20,000
Mobile Money APIs	ClickPesa + Daraja + MTN MoMo + transaction fees	$3,000–$8,000
SMS/USSD	Africa's Talking (customer self-service + alerts)	$3,000–$5,000
Meter Testing Lab	Test meters from various manufacturers for compatibility	$5,000–$10,000
Regulatory/Legal	EWURA/EPRA consultation + legal counsel	$5,000–$10,000
Sales & BD	Direct sales to operators + AMDA events + travel	$15,000–$25,000
Office/Admin	Dar es Salaam co-working + admin	$6,000–$10,000
TOTAL	—	$223,000–$355,000

