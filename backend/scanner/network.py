"""
Network scanner using nmap
"""
import asyncio
import logging
from typing import List, Dict
import nmap

logger = logging.getLogger(__name__)


class NetworkScanner:
    """Network scanner for discovering hosts and services"""

    def __init__(self, networks: List[str], ports: List[int] = None):
        """
        Initialize network scanner
        
        Args:
            networks: List of CIDR networks to scan (e.g., ["192.168.1.0/24"])
            ports: List of ports to scan (default: common web ports)
        """
        self.networks = networks
        self.ports = ports or [80, 443, 8080, 8443, 3000, 5000, 8000, 9090, 3001, 5001]
        self.nm = nmap.PortScanner()

    async def scan_network(self, network: str) -> List[Dict]:
        """
        Scan a network for hosts with open web ports
        
        Args:
            network: CIDR network to scan
            
        Returns:
            List of discovered hosts with open ports
        """
        logger.info(f"Scanning network: {network}")
        discovered = []

        try:
            # Run nmap scan in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            ports_str = ",".join(map(str, self.ports))
            
            await loop.run_in_executor(
                None,
                lambda: self.nm.scan(
                    hosts=network,
                    arguments=f'-p {ports_str} --open -T4 --host-timeout 30s'
                )
            )

            # Process scan results
            for host in self.nm.all_hosts():
                host_info = {
                    "ip": host,
                    "hostname": self.nm[host].hostname() or host,
                    "state": self.nm[host].state(),
                    "ports": []
                }

                # Check each protocol
                for proto in self.nm[host].all_protocols():
                    ports = self.nm[host][proto].keys()
                    for port in ports:
                        port_info = self.nm[host][proto][port]
                        if port_info['state'] == 'open':
                            host_info["ports"].append({
                                "port": port,
                                "protocol": proto,
                                "service": port_info.get('name', 'unknown'),
                                "state": port_info['state']
                            })

                if host_info["ports"]:
                    discovered.append(host_info)
                    logger.info(f"Found host: {host} with {len(host_info['ports'])} open ports")

        except Exception as e:
            logger.error(f"Error scanning network {network}: {e}")

        return discovered

    async def scan_all_networks(self) -> List[Dict]:
        """
        Scan all configured networks
        
        Returns:
            List of all discovered hosts
        """
        logger.info(f"Starting scan of {len(self.networks)} networks")
        all_hosts = []

        for network in self.networks:
            hosts = await self.scan_network(network)
            all_hosts.extend(hosts)

        logger.info(f"Scan complete. Found {len(all_hosts)} hosts")
        return all_hosts
