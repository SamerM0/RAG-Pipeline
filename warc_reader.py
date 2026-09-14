from warcio.archiveiterator import ArchiveIterator
from bs4 import BeautifulSoup

with open("crawl/data.warc.gz","rb") as stream:
    for record in ArchiveIterator(stream):
        if record.rec_type == 'response':
            html = record.content_stream().read()
            soup = BeautifulSoup(html,"html.parser")
            title = soup.find("title")
            if title:
                print(title.text)