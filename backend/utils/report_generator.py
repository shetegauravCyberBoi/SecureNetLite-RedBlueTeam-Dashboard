from utils.pdf_lib import PDFReport


def generate_pdf_report(
    scan_results: dict,
    filename: str = None,
    is_guest: bool = False,
    scan_type: str = "basic",
    scanned_by: str = None
) -> str:
    """
    Unified PDF report generator.
    Fully normalized, safe, and production-ready.
    """

    # ------------------------------------------------------------------
    # Resolve scan payload safely (NO ASSUMPTIONS)
    # ------------------------------------------------------------------
    scan_data = scan_results.get(scan_type, scan_results)

    scanned_by = scanned_by or scan_data.get(
        "scanned_by",
        "guest" if is_guest else "authenticated user"
    )

    target = scan_data.get("target", "Unknown")

    # ------------------------------------------------------------------
    # Resolve report title via scan_type
    # ------------------------------------------------------------------
    SCAN_TITLES = {
        "baseline_health_check": "Baseline Health Check Report",
        "zap_crawler": "ZAP Crawler Report",
        "zap_active_scan": "ZAP Active Scan Report",
        "zap_active": "ZAP Active Scan Report",
        "fullscan": "Fullscan Report",
        "basic": "Basic Scan Report",
    }

    title = SCAN_TITLES.get(
        scan_type,
        f"{scan_type.replace('_', ' ').title()} Report"
    )

    report = PDFReport(title=title)

    # ==========================================================
    # ✅ BASELINE HEALTH CHECK
    # ==========================================================
    if scan_type == "baseline_health_check":

        report.add_key_value_section("Scan Metadata", {
            "Scan Type": "Baseline Health Check",
            "Target": target,
            "Scanned By": scanned_by,
            "Start Time": scan_data.get("scan_metadata", {}).get("start_time"),
            "End Time": scan_data.get("scan_metadata", {}).get("end_time"),
            "Duration (sec)": scan_data.get("scan_metadata", {}).get("duration_seconds"),
        })

        report.add_key_value_section("Asset Overview", scan_data.get("asset", {}))

        availability = scan_data.get("availability", {})
        report.add_key_value_section(
            "Availability Check",
            {
                "Reachable": (
                    "Yes" if availability.get("reachable") is True
                    else "No" if availability.get("reachable") is False
                    else "Unknown"
                )
            },
            risk_level="low" if availability.get("reachable") else "high"
        )

        ping = availability.get("ping", {})
        if ping:
            report.add_text_block("Ping Details", ping.get("details", ""))

        network = scan_data.get("network_exposure", {})
        report.add_key_value_section(
            "Network Exposure",
            {
                "Open Ports": ", ".join(network.get("open_ports", [])) or "None",
                "High Risk Ports": ", ".join(network.get("high_risk_ports", [])) or "None",
                "Management Ports": ", ".join(network.get("management_ports", [])) or "None",
            },
            risk_level="medium" if network.get("open_ports") else "low"
        )

        health = scan_data.get("health_score", {})
        report.add_key_value_section(
            "Overall Health Score",
            {
                "Score": health.get("score"),
                "Status": health.get("status"),
            },
            risk_level="low" if health.get("status") == "Healthy" else "high"
        )

        findings = scan_data.get("findings", [])
        if findings:
            report.add_key_value_section(
                "Findings",
                {f"Issue {i + 1}": f for i, f in enumerate(findings)},
                risk_level="high"
            )
        else:
            report.add_text_block("Findings", "No security issues detected.")

        recommendations = scan_data.get("recommendations", [])
        if recommendations:
            report.add_key_value_section(
                "Recommendations",
                {f"Recommendation {i + 1}": r for i, r in enumerate(recommendations)}
            )

        return report.output(filename=filename)

    # ==========================================================
    # 🕷️ ZAP CRAWLER REPORT
    # ==========================================================
    if scan_type == "zap_crawler":

        report.add_key_value_section("Scan Metadata", {
            "Scan Type": "ZAP Web Crawler",
            "Target": target,
            "Scanned By": scanned_by,
        })

        urls = scan_data.get("urls", [])

        report.add_key_value_section(
            "Discovery Summary",
            {"Discovered URLs": len(urls)},
            risk_level="low"
        )

        report.add_text_block(
            "Discovered Endpoints",
            "\n".join(urls[:100]) if urls else "No URLs discovered during crawl."
        )

        return report.output(filename=filename)

    # ==========================================================
    # ⚔️ ZAP ACTIVE SCAN REPORT
    # ==========================================================
    if scan_type in ["zap_active_scan", "zap_active"]:

        report.add_key_value_section("Scan Metadata", {
            "Scan Type": "ZAP Active Scan",
            "Target": target,
            "Scanned By": scanned_by,
        })

        alerts = scan_data.get("alerts", [])

        report.add_key_value_section(
            "Vulnerability Summary",
            {"Total Findings": len(alerts)},
            risk_level="high" if alerts else "low"
        )

        for idx, alert in enumerate(alerts[:50], start=1):
            risk = (alert.get("risk") or "info").lower()
            if risk not in ["critical", "high", "medium", "low", "info"]:
                risk = "info"

            report.add_key_value_section(
                f"Finding {idx}",
                {
                    "Name": alert.get("alert"),
                    "Risk": alert.get("risk"),
                    "Confidence": alert.get("confidence"),
                    "URL": alert.get("url"),
                    "Parameter": alert.get("param") or "N/A",
                    "CWE ID": alert.get("cweid") or "N/A",
                },
                risk_level=risk
            )

            if alert.get("desc"):
                report.add_text_block("Description", alert.get("desc"))

            if alert.get("solution"):
                report.add_text_block("Remediation", alert.get("solution"))

        if not alerts:
            report.add_text_block(
                "Vulnerability Findings",
                "No exploitable vulnerabilities detected."
            )

        return report.output(filename=filename)

    # ==========================================================
    # 🔒 FULLSCAN / BASIC / LEGACY (FINAL FIX)
    # ==========================================================
    report.add_key_value_section("Scan Metadata", {
        "Scan Type": SCAN_TITLES.get(scan_type, scan_type.title()),
        "Target": target,
        "Scanned By": scanned_by,
    })

    threat_summary = scan_data.get("threat_summary", {})
    nmap_data = scan_data.get("modules", {}).get("nmap", {})
    ping_data = scan_data.get("modules", {}).get("ping", {})

    risk = threat_summary.get("threat_level", "info").lower()
    if risk not in ["critical", "high", "medium", "low", "info"]:
        risk = "info"

    report.add_key_value_section(
        "Threat Summary",
        {
            "Threat Level": threat_summary.get("threat_level", "Unknown"),
            "Detected OS": nmap_data.get("os", "Unknown"),
            "Open Ports": len(nmap_data.get("ports", [])),
            "Ping Reachable": (
                "Yes" if ping_data.get("reachable") is True
                else "No" if ping_data.get("reachable") is False
                else "Unknown"
            ),
        },
        risk_level=risk,
    )

    return report.output(filename=filename)
