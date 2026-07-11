# CeleOne Platform Documentation

## 1. Product Vision
CeleOne is a social mobile ecosystem serving the Celestial Christian community.  
The platform centralizes trusted information, official ECC reforms and decisions, community discussions, media broadcasting, and structured civic participation in one secure digital environment.

Core goals:
- Reduce false information and misinformation ("intoxication") through verified communication channels.
- Improve transparency and public understanding of reforms and official decisions.
- Enable constructive participation through chatrooms, comments, and content discovery.
- Support creators, filmmakers, and musical artists with sustainable monetization.

## 2. Languages and Accessibility
The platform is designed for multilingual access with primary support for:
- Francais
- English
- Yoruba
- Espanol

Additional church/community language support can be expanded through:
- curated content localization
- translator workflow in admin content modules
- UI language selector at the top of the website

## 3. Core Modules

### 3.1 Public and Community Information Module
Purpose:
- Publish trusted news, reforms, official decisions, and church communications.

Main capabilities:
- public posts and structured share previews
- searchable content flows
- social media preview optimization for links (Open Graph/Twitter)

### 3.2 Live Broadcasting Module (TV/WebTV/Radio)
Purpose:
- Provide dedicated live transmission spaces for multiple channels and church media streams.

Main capabilities:
- channel routing (`/:channelName/live`)
- direct stream playback from `channels.streamLink` (HLS m3u8)
- support for Web TV and radio stream positioning inside app ecosystem
- creator/channel request workflow for onboarding new broadcasters

### 3.3 Creator Module (Film-Makers and Artists)
Purpose:
- Help creators publish and monetize songs/videos with transparent payout logic.

Main capabilities:
- creator dashboard
- channel request and management
- upload/publish video and podcast assets
- per-owner channel linking (`channels.ownerId`)
- performance-based payout simulation (admin-level control)

### 3.4 Hymns and Church Documents Module
Purpose:
- Preserve and distribute doctrinal and liturgical resources.

Main capabilities:
- hymn management with language filtering and text search
- rich content editing (`contentHtml`, lyrics/text fields)
- document curation by category/type (example: Biblical Essentials)
- searchable access to church-proven documents

### 3.5 Community Chatroom Module
Purpose:
- Structured community conversation around programs, decisions, and ministry topics.

Main capabilities:
- create/manage chatrooms
- language-aware room setup
- moderation controls in admin tools

### 3.6 Competition and Event Module (Amis de Jesus)
Purpose:
- Manage children Bible competition lifecycle fully in-app.

Recommended lifecycle:
- registration intake
- candidate management
- event scoring and validation
- results publication and searchable result pages

User-facing outcomes:
- participants can register
- families can search candidate/result records
- community can verify official results from trusted source

## 4. Roles and User Modules

### 4.1 Visitor/Public User
- browse public posts and announcements
- view live channels
- access shared resources and official updates

### 4.2 Registered Community User
- participate in chatrooms
- access user-specific modules
- follow trusted updates

### 4.3 Creator (Artist/Film-Maker/Broadcaster)
- submit channel requests
- manage own channel assets
- publish video/podcast entries
- track playable stream links and distribution context

### 4.4 Admin and Moderation
- manage platform requests and approvals
- manage subscriptions and package catalog
- monitor active subscription base and revenue analytics
- manage documents, hymns, chatrooms, and content safety

## 5. Monetization and Revenue Distribution Policy

### 5.1 Subscription Model
Collections used:
- `subscription_packages`  
  fields include: `name`, `price`, `durationDays`, `isActive`, timestamps
- `user_subscriptions`  
  fields include: `uid`, `packageId`, `packageName`, `price`, `startAt`, `endAt`, `status`, timestamps

### 5.2 Professional Payout Algorithm
Admin revenue intelligence computes:
- recognized subscription revenue for selected period
- platform fee and operations reserve
- protected company share (profit floor)
- creator pool allocation
- split by stream/play performance:
  - song pool for artists
  - video pool for filmmakers

Safety objective:
- prevent company loss
- preserve mandatory operating margin
- keep payout model transparent and defendable

### 5.3 Suggested Governance
- lock payout policy values by governance cycle (monthly/quarterly)
- log every payout run snapshot (immutable batch records)
- require dual approval before external disbursement

## 6. Security, Trust, and Information Assurance

### 6.1 Security Principles
- least-privilege Firestore rules
- role-based access controls (admin vs creator vs user)
- strict separation between public and private data paths
- auditable update trails via `updatedAt`

### 6.2 Data Integrity
- official content should be published only through authorized admin workflows
- community-facing modules should clearly distinguish verified vs user-generated content
- content versioning and moderation history recommended for sensitive announcements

### 6.3 Reliable Information Flow
- official decisions/reforms must be tagged and discoverable
- high-priority announcements should use pinned categories
- share previews should always contain clear source identity

## 7. Chatroom Policy Framework

### 7.1 Allowed Use
- respectful discussion about faith, reforms, and programs
- constructive civic and community exchange

### 7.2 Prohibited Use
- defamation, hate speech, harassment
- misinformation campaigns and fake official notices
- abusive spam, impersonation, and illegal content

### 7.3 Enforcement Ladder
- warning
- temporary restriction
- suspension or permanent ban

All moderation actions should be logged with timestamp and reason.

## 8. Content Policy for Church Documents and Hymns

Required metadata:
- `title`
- `category`
- `type`
- `description`
- content body (`contentHtml` or canonical text field)
- `updatedAt`

Operational rule:
- only validated church-proven documents should be marked as official references
- keep searchable taxonomy to support pastoral and educational usage

## 9. SEO and Distribution Policy
- homepage metadata reflects official mission and trusted information purpose
- post pages include server-rendered social tags for WhatsApp/Facebook/Twitter preview
- media share images should be compressed/normalized for messaging-platform compatibility

## 10. Recommended Operational Checklist

Daily:
- moderation review
- failed stream checks
- high-priority document verification

Weekly:
- subscription and payout model review
- creator content quality audit
- top chatroom compliance review

Monthly:
- payout batch finalization
- policy review and parameter tuning
- transparency report publication

## 11. Future Expansion
- dedicated public result portal for competitions (search by name/ID)
- creator statement pages with payout traceability
- multilingual editorial review workflow
- official document signatures/hashes for authenticity verification



## 12. Spiritual Program Portal
The web portal now includes a spiritual-program module aligned with the mobile app.

Collections used:
- spiritual_years
- spiritual_months
- spiritual_weeks
- spiritual_services
- hymn_programs
- special_celebrations
- service_schedules
- spiritual_bookmarks

Public web flow:
- browse current week
- browse by year and month
- read weekly Bible theme and scripture references
- review service schedule and special celebrations
- read hymn programs attached to a week

Admin web flow:
- dedicated admin page at /admin/spiritual-program
- create year, month, week, service, hymn program, celebration, and regular schedule
- mark one current week as active
- delete nested records when needed
- publish or unpublish celebrations

## 13. Mobile App Module Coverage Addendum
This section reconciles the platform description with the current `D:\celeOneApp` module inventory and related function reports. The earlier description covered the web-facing core, but the mobile app contains additional active and planned modules that must be represented in the project description.

### 13.1 Messaging, Groups, Calls, and Notifications
- private and group discussions
- group information pages and chatroom administration
- typing, presence, delivery/read receipts, reactions, replies, edit/delete metadata, and media messages
- socket/local-first messaging target with local SQLite outbox, relay queues, reconnect drain, and push wake notifications
- WebRTC call flow using socket signaling, direct P2P media when possible, and TURN fallback
- notifications and quick reply handling

### 13.2 Discovery, Social, and Recommendations
- global search across pages, functions, and tools
- social/community pages and post details
- interaction tracking and optional personalized feed ranking
- optional Redis/Firestore feed cache and optional BigQuery analytics export
- recommendation diversification to reduce repeated creators or topics

### 13.3 Media and Device Experience
- live TV, radio, media streaming, playlists, films, series, worship, gospel music, and cantiques
- player controls for quality, speed, subtitles, audio options, watchlist, downloads, sharing, reactions, and reporting playback issues
- Smart TV pairing, linked device state, and cast-to-TV controls

### 13.4 GPS, Parish, and Church Services
- parish map, nearby parishes, GPS guidance, visit planner, and visit history
- church directory, service times, worship schedules, shepherd directory, dioceses/districts, worldwide branches, and official contacts
- admin management of parishes, church services, and GPS coordinates

### 13.5 Heritage and Spiritual Formation
- church history, founder biography, historical timeline, key moments, world expansion, archive photos, and historical videos
- theme of the week and spiritual calendar
- feast days, weekly programs, services, hymn programs, celebrations, and schedules

### 13.6 Member Services, Academy, and Donations
- digital member card, member verification, counsel/accompaniment requests, profile, settings, subscriptions, and help
- academy courses, doctrine courses, Sunday school, evangelism/practical training, video lessons, exams, and certificates
- donation projects, receipts, and donation history

### 13.7 Jeunesse, Gamification, and Alerts
- Jeunesse / Amis de Jesus registration, concours settings, result search, weekly quiz, quiz history, and admin Jeunesse tools
- quiz ranking, badges, youth leaderboard, and participation rewards
- urgent announcements, regional alerts, crisis information, and urgent prayer notifications

### 13.8 Professional Skills and Collaboration
- verified professional profiles
- professional categories and skill groups
- collaboration/support tickets
- admin management for skills, groups, categories, and tickets

### 13.9 Admin Coverage
The app-side admin modules include:
- dashboard, posts, events, streaming, documents, cantiques, drawer pages, users, profiles, pending requests, platform requests, packages, subscriptions, TV channels, chatrooms, reports, statistics, parishes, church services, heritage, calendar, academy, alerts, donations, Jeunesse, professional skills, and theme of week administration.

### 13.10 Current Web Exposure Notes
- Public links to the creator panel, chatroom creation, and Jeunesse pages may be hidden on the web portal while the platform keeps their mobile/admin data workflows available.
- Documentation should distinguish between platform capabilities, mobile app capabilities, admin-only capabilities, and public web routes.
- The revenue model PDF/PPT in `D:\celeOneApp\reports` should be summarized in a separate business appendix if investor or governance documentation is needed.
- Messaging migration details should remain in a technical architecture appendix because that area changes faster than the public product description.
