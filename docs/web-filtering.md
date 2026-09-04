# EduGuard MDM — Web Filtering & Safe Browsing Architecture

## 1. Technical Honesty: HTTPS Encryption & Android VpnService

Modern web traffic is encrypted via Transport Layer Security (TLS 1.3 / HTTPS). In a standard enterprise mobile environment:
- **Plaintext URL & Query Parameters**: Cannot be inspected or keyword-filtered inside HTTPS packets unless full TLS Man-In-The-Middle (MITM) certificate pinning bypass is enforced.
- **Why MITM is NOT Recommended for School Androids**:
  1. Installs a root CA certificate, introducing severe privacy and legal liabilities.
  2. Breaks modern Android network security configs (Certificate Transparency, HPKP, and strict app pinning).
  3. Slows device bandwidth and causes battery overheating.

## 2. EduGuard MDM Solution: Hybrid DNS & SNI Intercept Architecture

EduGuard MDM implements high-performance, privacy-respecting filtering using a local Android `VpnService`:

```
+-------------------------------------------------------------+
|                     Android Web Browser                     |
+------------------------------+------------------------------+
                               | DNS Query / TCP SYN
                               v
+-------------------------------------------------------------+
|              EduGuard Local VpnService (Tun2Socks)          |
|                                                             |
|  1. Intercepts UDP/TCP Port 53 (DNS):                       |
|     - Inspects requested domain against local Room cache    |
|     - If domain matches Blocked List or Blocked Category:   |
|       Returns 127.0.0.1 (NXDOMAIN / Sinkhole)               |
|       Logs Violation Event locally & sends to backend       |
|                                                             |
|  2. Inspects TLS ClientHello (Port 443):                    |
|     - Parses Server Name Indication (SNI) extension in clear|
|     - Drops connection immediately if SNI domain is blocked |
|                                                             |
|  3. Managed Google Chrome Policies (Managed Configuration): |
|     - URLBlocklist: ["*"]                                   |
|     - URLAllowlist: ["school.edu", "classroom.google.com"]  |
|     - SafeSearch: Enforced                                  |
|     - IncognitoModeAvailability: Disabled                   |
+-------------------------------------------------------------+
```

## 3. Filter Precedence & Sinkhole Workflow
1. Explicit Domain Allow (`*.wikipedia.org`) -> ALLOW
2. Explicit Domain Block (`instagram.com`, `tiktok.com`) -> SINKHOLE & ALERT
3. Categorical Filter (`GAMBLING`, `ADULT`, `SOCIAL_MEDIA`) -> SINKHOLE & ALERT
4. Search Keyword Blocklist (Enforced via Chrome Managed Configurations URL patterns) -> BLOCK
