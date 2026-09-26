from utils.pdf_lib import PDFReport


def generate_pdf_report(
    scan_results: dict,
    filename: str = None,
    is_guest: bool = False,
    scan_type: str = "basic",
    scanned_by: str = None
) -> str:
    scan_data = scan_results.get(scan_type, scan_results)
    scanned_by = scanned_by or scan_data.get(
        "scanned_by",
        "guest" if is_guest else "authenticated user"
    )
    target = scan_data.get("target", "Unknown")
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

    if scan_type == "fullscan":
        report.add_key_value_section("Scan Metadata", {
            "Scan Type": SCAN_TITLES.get(scan_type, scan_type.title()),
            "Target": target,
            "Scanned By": scanned_by,
        })

        threat_summary = scan_data.get("threat_summary", {})
        modules = scan_data.get("modules", {})
        nmap_data = modules.get("nmap", {})
        ping_data = modules.get("ping", {})
        nuclei_data = modules.get("nuclei", [])
        shodan_data = modules.get("shodan", {})

        risk = threat_summary.get("threat_level", "info").lower()
        if risk not in ["critical", "high", "medium", "low", "info"]:
            risk = "info"

        # --- Threat Summary ---
        report.add_key_value_section(
            "Threat Summary",
            {
                "Threat Level": threat_summary.get("threat_level", "Unknown"),
                "Details": threat_summary.get("details", ""),
            },
            risk_level=risk,
        )

        # --- Ping / Availability ---
        ping_status = ping_data.get("status", "")
        report.add_key_value_section(
            "Availability Check",
            {
                "Reachable": (
                    "Yes" if ping_status == "reachable"
                    else "No" if ping_status == "unreachable"
                    else "Unknown"
                ),
            },
            risk_level="low" if ping_status == "reachable" else "high"
        )
        if ping_data.get("details"):
            report.add_text_block("Ping Details", ping_data.get("details", ""))

        # --- Nmap / Network Exposure ---
        ports = nmap_data.get("ports", [])
        port_lines = [
            f"{p.get('port', '')} - {p.get('service', '')} ({p.get('state', '')})"
            for p in ports
        ] if ports else ["No open ports detected"]

        report.add_key_value_section(
            "Network Exposure",
            {
                "Detected OS": nmap_data.get("os", "Unknown"),
                "Total Open Ports": len(ports),
            },
            risk_level="high" if ports else "low"
        )
        report.add_text_block("Open Ports Detail", "\n".join(port_lines))

        if nmap_data.get("banner"):
            report.add_text_block("Service Banner", nmap_data.get("banner", ""))

        # --- Shodan ---
        if "error" not in shodan_data:
            report.add_key_value_section(
                "Shodan Intelligence",
                {
                    "IP": shodan_data.get("ip", "N/A"),
                    "Organization": shodan_data.get("org", "N/A"),
                    "OS": shodan_data.get("os", "N/A"),
                    "Hostnames": ", ".join(shodan_data.get("hostnames", [])) or "N/A",
                    "Open Ports": ", ".join(str(p) for p in shodan_data.get("ports", [])) or "N/A",
                    "Known Vulns": ", ".join(shodan_data.get("vulns", [])) or "None",
                },
                risk_level="high" if shodan_data.get("vulns") else "low"
            )
        else:
            report.add_text_block(
                "Shodan Intelligence",
                f"Shodan data unavailable: {shodan_data.get('error', 'Unknown error')}"
            )

        # --- Nuclei Findings ---
        if nuclei_data and not (len(nuclei_data) == 1 and "error" in nuclei_data[0]):
            report.add_key_value_section(
                "Nuclei Scan Summary",
                {"Total Findings": len(nuclei_data)},
                risk_level="high" if any(
                    n.get("severity") in ["high", "critical"] for n in nuclei_data
                ) else "medium"
            )
            for idx, finding in enumerate(nuclei_data, start=1):
                sev = (finding.get("severity") or "info").lower()
                if sev not in ["critical", "high", "medium", "low", "info"]:
                    sev = "info"
                report.add_key_value_section(
                    f"Finding {idx}",
                    {
                        "Template ID": finding.get("template-id", "N/A"),
                        "Severity": finding.get("severity", "info"),
                        "Name": finding.get("name", "N/A"),
                        "Matched At": finding.get("matched-at", "N/A"),
                    },
                    risk_level=sev
                )
                if finding.get("description"):
                    report.add_text_block("Description", finding.get("description", ""))
        else:
            report.add_text_block(
                "Nuclei Findings",
                "No vulnerabilities detected by Nuclei." if not nuclei_data
                else f"Nuclei error: {nuclei_data[0].get('error', '')}"
            )

        return report.output(filename=filename)

    # --- Fallback for any unrecognized scan type ---
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
