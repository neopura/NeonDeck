"""
Auto-categorization logic for NeonDeck
"""
import re
from typing import Optional

# Categorization rules based on title, URL, and description
CATEGORY_RULES = {
    "Infrastructure": [
        r"proxmox", r"vcenter", r"esxi", r"rancher", r"portainer",
        r"traefik", r"nginx", r"haproxy", r"kubernetes", r"k8s",
        r"docker", r"terraform", r"ansible"
    ],
    "Monitoring": [
        r"grafana", r"prometheus", r"nagios", r"zabbix", r"uptime",
        r"netdata", r"influxdb", r"kibana", r"dashboard.*monitor"
    ],
    "Media": [
        r"plex", r"jellyfin", r"emby", r"kodi", r"sonarr",
        r"radarr", r"prowlarr", r"tautulli", r"overseerr", r"ombi"
    ],
    "Automation": [
        r"n8n", r"home\s*assistant", r"node-red", r"zapier",
        r"airflow", r"jenkins", r"gitlab.*ci", r"github.*actions"
    ],
    "Storage": [
        r"minio", r"nextcloud", r"owncloud", r"synology", r"nas",
        r"s3", r"ceph", r"gluster", r"truenas"
    ],
    "Development": [
        r"gitlab", r"github", r"gitea", r"harbor", r"registry",
        r"vscode", r"jupyter", r"code-server", r"portainer"
    ],
    "Security": [
        r"vault", r"authelia", r"authentik", r"keycloak",
        r"bitwarden", r"vaultwarden", r"firewall", r"pfsense",
        r"opnsense"
    ],
    "Networking": [
        r"unifi", r"pfsense", r"opnsense", r"router",
        r"pihole", r"adguard", r"dns", r"dhcp", r"vpn",
        r"wireguard", r"openvpn"
    ]
}


class ServiceCategorizer:
    """Auto-categorize services based on their metadata"""

    def __init__(self):
        # Compile regex patterns for performance
        self.compiled_rules = {}
        for category, patterns in CATEGORY_RULES.items():
            self.compiled_rules[category] = [
                re.compile(pattern, re.IGNORECASE) for pattern in patterns
            ]

    def categorize(self, title: str, url: str, description: str = None) -> str:
        """
        Determine category for a service
        
        Args:
            title: Page title
            url: Service URL
            description: Page description (optional)
            
        Returns:
            Category name
        """
        # Combine all text for matching
        search_text = f"{title} {url}"
        if description:
            search_text += f" {description}"

        # Check each category's patterns
        category_scores = {}
        for category, patterns in self.compiled_rules.items():
            score = 0
            for pattern in patterns:
                if pattern.search(search_text):
                    score += 1
            if score > 0:
                category_scores[category] = score

        # Return category with highest score
        if category_scores:
            best_category = max(category_scores.items(), key=lambda x: x[1])
            return best_category[0]

        # Default category if no match
        return "Other"

    def get_category_icon(self, category: str) -> str:
        """Get icon name for category"""
        icons = {
            "Infrastructure": "server",
            "Monitoring": "activity",
            "Media": "film",
            "Automation": "zap",
            "Storage": "database",
            "Development": "code",
            "Security": "shield",
            "Networking": "globe",
            "Other": "box"
        }
        return icons.get(category, "box")

    def get_category_color(self, category: str) -> str:
        """Get color for category"""
        colors = {
            "Infrastructure": "#00d9ff",  # cyan
            "Monitoring": "#ff00ff",      # magenta
            "Media": "#b026ff",           # purple
            "Automation": "#ff0080",      # pink
            "Storage": "#0080ff",         # blue
            "Development": "#00ffaa",     # green
            "Security": "#ff4444",        # red
            "Networking": "#00d9ff",      # cyan
            "Other": "#888888"             # gray
        }
        return colors.get(category, "#888888")
