from warcio.archiveiterator import ArchiveIterator
from bs4 import BeautifulSoup


with open("crawl/data.warc.gz","rb") as stream:
    for record in ArchiveIterator(stream):
        if record.rec_type == 'response':
            html = record.content_stream().read()
            soup = BeautifulSoup(html,"html.parser")
            body = soup.find("body")
            if body:
                body = body.text
                words = body.split()
                chunks = []
                for i in range(0, len(words), 100):
                    chunk = words[i:i+120]
                    chunk_joined = " ".join(chunk)
                    chunks.append(chunk_joined)
