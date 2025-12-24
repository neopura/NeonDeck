"""
HTTP probe to detect web interfaces
"""
import asyncio
import logging
from typing import Optional, Dict
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


class HTTPProbe:
    """HTTP/HTTPS probe for web service detection"""

    def __init__(self, timeout: int = 10):
        """
        Initialize HTTP probe
        
        Args:
            timeout: Request timeout in seconds
        """
        self.timeout = timeout

    async def probe_port(self, ip: str, port: int) -> Optional[Dict]:
        """
        Probe a specific port for HTTP/HTTPS service
        
        Args:
            ip: IP address
            port: Port number
            
        Returns:
            Service info dict if web service found, None otherwise
        """
        # Try HTTPS first, then HTTP
        protocols = ['https', 'http']
        
        for protocol in protocols:
            url = f"{protocol}://{ip}:{port}"
            try:
                async with httpx.AsyncClient(verify=False, timeout=self.timeout) as client:
                    response = await client.get(url, follow_redirects=True)
                    
                    if response.status_code < 500:  # Consider anything < 500 as a valid web service
                        # Extract metadata
                        metadata = await self._extract_metadata(response, url)
                        
                        service_info = {
                            "url": metadata.get("canonical_url", url),
                            "protocol": protocol,
                            "ip": ip,
                            "port": port,
                            "status_code": response.status_code,
                            "response_time": int(response.elapsed.total_seconds() * 1000),
                            "title": metadata.get("title", f"{ip}:{port}"),
                            "description": metadata.get("description"),
                            "favicon": metadata.get("favicon"),
                        }
                        
                        logger.info(f"Found web service: {url} (title: {service_info['title']})")
                        return service_info
                        
            except Exception as e:
                logger.debug(f"Failed to probe {url}: {e}")
                continue
        
        return None

    async def _extract_metadata(self, response: httpx.Response, url: str) -> Dict:
        """
        Extract metadata from HTTP response
        
        Args:
            response: HTTP response
            url: Original URL
            
        Returns:
            Metadata dictionary
        """
        metadata = {
            "canonical_url": str(response.url)
        }
        
        try:
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract title
            title_tag = soup.find('title')
            if title_tag:
                metadata["title"] = title_tag.get_text().strip()
            
            # Extract description
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if desc_tag and desc_tag.get('content'):
                metadata["description"] = desc_tag['content'].strip()
            
            # Extract favicon
            favicon_tag = soup.find('link', rel=lambda x: x and 'icon' in x.lower())
            if favicon_tag and favicon_tag.get('href'):
                favicon_url = favicon_tag['href']
                if not favicon_url.startswith('http'):
                    # Convert relative URL to absolute
                    from urllib.parse import urljoin
                    favicon_url = urljoin(str(response.url), favicon_url)
                metadata["favicon"] = favicon_url
            else:
                # Try default favicon location
                from urllib.parse import urlparse
                parsed = urlparse(str(response.url))
                metadata["favicon"] = f"{parsed.scheme}://{parsed.netloc}/favicon.ico"
                
        except Exception as e:
            logger.debug(f"Error extracting metadata from {url}: {e}")
        
        return metadata

    async def probe_multiple(self, hosts: list) -> list:
        """
        Probe multiple hosts concurrently
        
        Args:
            hosts: List of host dicts with 'ip' and 'ports'
            
        Returns:
            List of discovered web services
        """
        tasks = []
        for host in hosts:
            for port_info in host.get("ports", []):
                tasks.append(self.probe_port(host["ip"], port_info["port"]))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out None and exceptions
        services = [r for r in results if r and not isinstance(r, Exception)]
        
        logger.info(f"Probed {len(tasks)} endpoints, found {len(services)} web services")
        return services
