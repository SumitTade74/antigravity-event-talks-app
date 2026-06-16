import re
import html
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

app = Flask(__name__)

def clean_html_to_text(html_content):
    # Remove HTML tags
    text = re.sub(r'<[^<]+?>', '', html_content)
    # Decode HTML entities
    text = html.unescape(text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def fetch_release_notes():
    url = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
    try:
        # Request with User-Agent to avoid getting blocked
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        
        # Atom Namespace
        namespace = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', namespace):
            title_elem = entry.find('atom:title', namespace)
            title = title_elem.text if title_elem is not None else 'Unknown Date'
            
            entry_id_elem = entry.find('atom:id', namespace)
            entry_id = entry_id_elem.text if entry_id_elem is not None else ''
            
            updated_elem = entry.find('atom:updated', namespace)
            updated = updated_elem.text if updated_elem is not None else ''
            
            # Find alternate link
            link_elem = entry.find("atom:link[@rel='alternate']", namespace)
            link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            if not link:
                link_elem = entry.find("atom:link", namespace)
                link = link_elem.attrib.get('href', '') if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', namespace)
            content_html = content_elem.text if content_elem is not None else ''
            
            # Split updates within the entry
            updates = []
            if content_html:
                matches = re.findall(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', content_html, re.DOTALL)
                for idx, match in enumerate(matches):
                    update_type = match[0].strip()
                    update_html = match[1].strip()
                    updates.append({
                        'id': f"{entry_id}-{idx}",
                        'type': update_type,
                        'html': update_html,
                        'text': clean_html_to_text(update_html)
                    })
            
            # Fallback if no <h3> tags are found
            if not updates and content_html:
                updates.append({
                    'id': f"{entry_id}-0",
                    'type': 'General',
                    'html': content_html,
                    'text': clean_html_to_text(content_html)
                })
                
            entries.append({
                'title': title,  # Date title (e.g. "June 15, 2026")
                'updated': updated,
                'id': entry_id,
                'link': link,
                'updates': updates
            })
        return {"success": True, "entries": entries}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def api_release_notes():
    data = fetch_release_notes()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5005)
