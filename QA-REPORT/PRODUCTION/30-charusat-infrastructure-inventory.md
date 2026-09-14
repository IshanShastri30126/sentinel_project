# QA-REPORT: PHASE 30 — CHARUSAT INFRASTRUCTURE DISCOVERY & INVENTORY

PHASE: Phase 30 — CHARUSAT Production Infrastructure Discovery  
STATUS: PASS  
DATE: 2026-09-14  
ENVIRONMENT: [PRODUCTION INFRASTRUCTURE] Target Evaluation — CHARUSAT University Institutional Data Center  
OBJECTIVE: Compile an authoritative, non-fabricated inventory of target CHARUSAT University physical infrastructure, establishing precise measurement protocols and marking unverified campus hardware specifications as UNAVAILABLE pending physical deployment.  
TESTS EXECUTED: On-site audit criteria mapping, measurement protocol validation, and staging vs target topology differentiation.  
FILES CHANGED: None (Infrastructure Discovery & Audit Documentation Phase).  
COMMANDS/TOOLS USED: Discovery audit protocol synthesis, network diagnostic parameter mapping (`ping`, `traceroute`, `iperf3`, `ethtool`, `lscpu`, `free -m`, `pg_settings`).  
MEASUREMENTS:
- Evaluated Infrastructure Categories: 28
- Measured Local Staging Topology Latency: Neon DB RTT ~1,027 ms, Upstash Redis RTT ~304 ms [TEST INFRASTRUCTURE]
- Physical CHARUSAT Production Hardware Verified: 0 (Explicitly marked UNAVAILABLE / UNKNOWN to prevent speculative certification)
- Confidence Level: UNVERIFIED — confirm before use on physical target hardware
BASELINE: Previous documentation contained projected targets (e.g. 8 cores, 16 GB RAM, 1 Gbps) that were not empirically measured on campus hardware.  
RESULT: Complete 28-category infrastructure inventory generated with strict demarcation between verified staging, unverified assumptions, required on-site measurement tools, and 400-user bottleneck risks.  
REGRESSIONS: Zero regressions.  
SECURITY IMPACT: Identifies physical security, network segmentation, and reverse proxy perimeter controls required before campus traffic is routed.  
PERFORMANCE IMPACT: Establishes hard gating criteria to prevent premature performance claims prior to on-campus validation.  
DATA-INTEGRITY IMPACT: Outlines database persistence, storage types, and power redundancy prerequisites to prevent data loss.  
UNRESOLVED ISSUES: Physical hardware access is restricted to on-campus commissioning; all physical metrics remain marked [VERIFY-IN-PRODUCTION].  
EVIDENCE LOCATION: `QA-REPORT/PRODUCTION/30-charusat-infrastructure-inventory.md`  
PASS/FAIL: PASS (All categories inventoried without fabricated values; unverified values explicitly marked UNAVAILABLE).  

---

## 1. Description of Infrastructure Discovery and Audit Methodology

### 1.1. Brief Introduction
Infrastructure discovery is the empirical cataloging and verification of physical and virtual computing resources allocated for production deployment within an enterprise or university datacenter.

### 1.2. Detailed Explanation
Production software readiness cannot be divorced from the physical environment in which it executes. While application performance and query optimization have been empirically certified on local and staging topologies, deploying Sentinel and CTF Wars to the CHARUSAT campus network introduces physical constraints: CPU core architectures, memory bus speeds, enterprise SSD vs HDD storage, network interface controller (NIC) offloading, local Layer-2/Layer-3 switch fabrics, university firewall rules, and uninterrupted power supply (UPS) runtimes.

In accordance with strict engineering standards, this phase explicitly rejects all speculative or fabricated specifications. Where physical access to university hardware is pending, values are certified as `UNAVAILABLE [UNVERIFIED — confirm before use]`, accompanied by the exact CLI command and measurement methodology required to capture ground truth during campus commissioning.

### 1.3. Examples
- Instead of assuming 16 GB of RAM, the system requires executing `free -m` and `cat /proc/meminfo` on the target host during commissioning.
- Instead of assuming a 1 Gbps NIC, the system requires running `ethtool eth0` to verify link speed and duplex mode.
- Instead of assuming 100 database connections, `SELECT name, setting FROM pg_settings WHERE name = 'max_connections';` must be queried directly on the campus PostgreSQL instance.

### 1.4. Advantages
- Prevents catastrophic event-day crashes caused by unverified hardware assumptions.
- Provides university systems administrators with an exact deployment checklist.
- Isolates application-level efficiency from physical network and host constraints.

### 1.5. Disadvantages
- Requires physical presence or secure VPN access to the campus intranet for final sign-off.
- Delays full production certification until on-site hardware is powered and provisioned.

### 1.6. Use Cases
- Institutional deployment planning for university-wide hackathons and CTF competitions.
- Capacity planning for concurrent multi-lab student access (400 active concurrent users).
- Disaster recovery and failover architecture design.

### 1.7. Limitations
- Discovery protocols define how to measure, but cannot measure remote unpowered or unallocated machines without physical network connectivity.

---

## 2. Distinction: Cloud Staging Infrastructure vs On-Premises Campus Infrastructure

| Cloud Staging Infrastructure (Current Test Topology) | On-Premises Campus Infrastructure (CHARUSAT Target) |
|---|---|
| Hosted in geographically distant cloud regions (e.g. AWS us-east-1) | Hosted locally within the CHARUSAT University Institutional Data Center |
| High WAN round-trip latency (measured ~1,027 ms to Neon DB) | Ultra-low LAN round-trip latency (projected < 1.0 ms across campus switch fabric) |
| Multi-tenant shared compute subject to hypervisor noisy-neighbor throttling | Dedicated physical host or private VMware/KVM hypervisor slice |
| Ephemeral public IPv4 addresses managed via cloud provider routing | Static internal IPv4 addresses mapped to university DNS (`charusat.ac.in`) |
| REST-based Redis connection over HTTPS (measured ~304 ms) | Native persistent TCP Redis socket connection over campus subnet |
| Connection pooling strictly bounded to compensate for high latency | Connection pool calibrated for sub-millisecond local socket acquisition |
| Subject to trans-continental Internet Service Provider packet drops | Isolated from external transit disruptions for intranet participants |
| Cloud provider handles physical power and hardware failure | Relies on institutional UPS systems, diesel generators, and dual power feeds |
| Storage IOPS throttled by cloud provider burst quotas | Direct NVMe/SATA enterprise SSD read/write operations |
| Perimeter firewall managed by external cloud security groups | Governed by university perimeter firewalls and campus network ACLs |
| Inability to inspect physical switch buffers or NIC queues | Full access to physical switch counters, VLANs, and traffic mirrors |
| Insufficient to certify 400-user concurrent campus load | Mandatory environment required for final 400-user production certification |

---

## 3. Comprehensive CHARUSAT Production Infrastructure Inventory (28 Categories)

Each category is recorded with strict provenance. Where data cannot be empirically measured in this session, it is designated `UNAVAILABLE [UNVERIFIED — confirm before use]`.

| # | Infrastructure Category | Current Recorded Value | Source / Provenance | Measurement Method / Tool | Confidence Level | 400-User Impact | Bottleneck Risk |
|---|---|---|---|---|---|---|---|
| 1 | SERVER CPU | UNAVAILABLE | Data Center Provisioning Pending | `lscpu`, `cat /proc/cpuinfo` | UNVERIFIED — confirm before use | Node.js single-thread event loop requires multi-core cluster | High if < 4 physical cores |
| 2 | SERVER RAM | UNAVAILABLE | Data Center Provisioning Pending | `free -h`, `cat /proc/meminfo` | UNVERIFIED — confirm before use | Memory exhaustion under 400 concurrent WebSocket state buffers | High if < 8 GB available |
| 3 | SERVER STORAGE | UNAVAILABLE | Data Center Provisioning Pending | `df -h`, `lsblk` | UNVERIFIED — confirm before use | Log generation and certificate PDF storage allocation | Low if > 50 GB free |
| 4 | STORAGE TYPE | UNAVAILABLE | Data Center Provisioning Pending | `cat /sys/block/*/queue/rotational` (0=SSD, 1=HDD) | UNVERIFIED — confirm before use | Disk I/O wait during heavy database write/WAL sync | Critical if mechanical HDD |
| 5 | NETWORK INTERFACE | UNAVAILABLE | Campus Network Admin Pending | `ip link show`, `ethtool <nic>` | UNVERIFIED — confirm before use | Packet processing throughput and buffer drops | Medium |
| 6 | NETWORK BANDWIDTH | UNAVAILABLE | Campus Network Admin Pending | `iperf3 -s` / `iperf3 -c` | UNVERIFIED — confirm before use | Concurrent asset downloads and WebSocket message delivery | High if < 100 Mbps LAN |
| 7 | INTERNAL NETWORK | UNAVAILABLE | Campus Subnet Specification | `traceroute`, `ip route` | UNVERIFIED — confirm before use | Latency between Application host, PostgreSQL, and Redis | Critical if routed through WAN |
| 8 | SWITCH CAPACITY | UNAVAILABLE | Campus NOC Infrastructure | Switch CLI / SNMP MIBs | UNVERIFIED — confirm before use | Broadcast storm and packet drops during burst submissions | Medium |
| 9 | INTERNET UPLINK | UNAVAILABLE | University ISP Gateway | External speed test / NOC monitoring | UNVERIFIED — confirm before use | External asset loading and Google OAuth token verification | High if ISP outage occurs |
| 10 | DATABASE SERVER | UNAVAILABLE | Dedicated Host vs Containerized | Host OS inspection, `uname -a` | UNVERIFIED — confirm before use | Contention with application processes if co-located | High if shared with app node |
| 11 | DATABASE STORAGE | UNAVAILABLE | Dedicated DB Mount | `df -h /var/lib/postgresql` | UNVERIFIED — confirm before use | Table growth and write-ahead log (WAL) volume saturation | Medium |
| 12 | DATABASE VERSION | UNAVAILABLE (Target: PG 16) | Target System Package Audit | `psql --version`, `SELECT version();` | UNVERIFIED — confirm before use | SQL feature compatibility and query planner behavior | Low if PostgreSQL 15+ |
| 13 | POSTGRESQL max_connections | UNAVAILABLE | PostgreSQL Config (`postgresql.conf`) | `SHOW max_connections;` | UNVERIFIED — confirm before use | Connection pool exhaustion under concurrent API surges | Critical if < 100 connections |
| 14 | REDIS SERVER | UNAVAILABLE (Target: Redis 7.2) | Target System Package Audit | `redis-server --version`, `redis-cli INFO` | UNVERIFIED — confirm before use | Session persistence and distributed lock latency | Critical if REST gateway used |
| 15 | REDIS VERSION | UNAVAILABLE | Target System Package Audit | `redis-cli INFO server` | UNVERIFIED — confirm before use | Command support and memory eviction algorithms | Low if Redis 6.2+ |
| 16 | REVERSE PROXY | UNAVAILABLE (Target: Nginx 1.24+) | Target System Package Audit | `nginx -V` | UNVERIFIED — confirm before use | SSL/TLS handshake offload and WebSocket upgrade handling | High if proxy misconfigured |
| 17 | LOAD BALANCER | UNAVAILABLE | Campus Topology Audit | Network Architecture Review | UNVERIFIED — confirm before use | Traffic distribution across multiple application worker processes | Medium |
| 18 | FIREWALL | UNAVAILABLE | Campus Security Gateway | `iptables -L`, `nft list ruleset`, Hardware WAF | UNVERIFIED — confirm before use | Accidental blocking of CTF competition ports (5001, WS) | Critical if port 5001 blocked |
| 19 | WAF | UNAVAILABLE | Application Layer vs Hardware WAF | Request inspection header audit | UNVERIFIED — confirm before use | False-positive blocking of legitimate CTF payload submissions | High |
| 20 | DNS | UNAVAILABLE (Target: Internal DNS) | Campus Nameserver Audit | `dig @nameserver charusat.ac.in` | UNVERIFIED — confirm before use | Resolution latency for internal services | Low |
| 21 | TLS | UNAVAILABLE | Certificate Authority Audit | `openssl s_client -connect <host>:443` | UNVERIFIED — confirm before use | Browser security warnings and mixed-content blocking | High if self-signed without root |
| 22 | BACKUP | UNAVAILABLE | Automated Backup Script / Cron | `crontab -l`, Storage mount inspection | UNVERIFIED — confirm before use | Rapid recovery in the event of database corruption | Critical |
| 23 | MONITORING | UNAVAILABLE | Prometheus / Grafana / Netdata | Service discovery check | UNVERIFIED — confirm before use | Real-time visibility into CPU, memory, and event-loop lag | High |
| 24 | LOGGING | UNAVAILABLE | Syslog / Logrotate / ELK | `/var/log` disk allocation audit | UNVERIFIED — confirm before use | Disk exhaustion due to unrotated application logs | Medium |
| 25 | REDUNDANCY | UNAVAILABLE | High Availability Setup | Architecture inspection | UNVERIFIED — confirm before use | Service availability in single-node hardware failure | Medium |
| 26 | UPS | UNAVAILABLE | Data Center Facilities | Physical facility inspection | UNVERIFIED — confirm before use | Unscheduled reboot during power fluctuation | High |
| 27 | POWER | UNAVAILABLE | Data Center Facilities | Utility grid + generator verification | UNVERIFIED — confirm before use | Complete system blackout during event day | High |
| 28 | DISASTER RECOVERY | UNAVAILABLE | Institutional DR Policy | Runbook audit | UNVERIFIED — confirm before use | Event recovery time objective (RTO) in major failure | High |

---

## 4. Minimum Target Production Thresholds (Pre-Deployment Gates)

Before the system is permitted to accept live student traffic on event day, on-site measurements must satisfy the following non-negotiable minimum thresholds:

1. **Host CPU**: Minimum 4 physical cores (8 logical threads) dedicated to Sentinel Node.js cluster.
2. **Host RAM**: Minimum 8 GB dedicated RAM (at least 4 GB free headroom during peak operation).
3. **Storage**: Enterprise SSD or NVMe with > 300 IOPS and > 30 GB free space. Mechanical HDDs are strictly prohibited.
4. **Local Subnet RTT**: Application to PostgreSQL < 2.0 ms; Application to Redis < 1.0 ms.
5. **PostgreSQL Configuration**: `max_connections >= 100`, `shared_buffers >= 1GB`.
6. **Reverse Proxy**: Nginx configured with `proxy_http_version 1.1`, `Upgrade $http_upgrade`, `Connection "upgrade"`, and client request buffers >= 10 MB.

---

## 5. Phase Certification Conclusion

Phase 30 is certified as **PASS**. An exhaustive 28-category infrastructure inventory has been compiled without fictitious data. All target campus specifications are formally recorded as `UNAVAILABLE [UNVERIFIED — confirm before use]`, establishing a rigorous, evidence-driven foundation for Phase 31 on-site staging deployment.
