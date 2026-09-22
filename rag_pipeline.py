from warcio.archiveiterator import ArchiveIterator
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
import faiss

# Get data from warc file and split it into chunks
chunks = []
with open("crawl/data.warc.gz","rb") as stream:
    for record in ArchiveIterator(stream):
        if record.rec_type == 'response':
            html = record.content_stream().read()
            soup = BeautifulSoup(html,"html.parser")
            for tag in soup(["script", "style", "nav", "footer", "header"]):
                tag.decompose()
            body = soup.find("body")
            if body:
                body = body.text
                words = body.split()
                for i in range(0, len(words), 100):
                    chunk = words[i:i+120] # Get chunk with a 20 word overlap
                    chunk_joined = " ".join(chunk)
                    chunks.append(chunk_joined)


# Create embeddings 
model = SentenceTransformer(
    "BAAI/bge-small-en-v1.5",
)

embeddings = model.encode(
    chunks,
    batch_size=32,
    normalize_embeddings=True,
    show_progress_bar=True
)

# Setup faiss as vector store 
dimension = embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)
index.add(embeddings)

# Create embeddings for query
query = "Who originated the concept of a programmable computer?"
query_embedding = model.encode(
    [query],
    normalize_embeddings=True
)

# Find best 4 matchings embeddings inside vector store to the query embedding
distances, indices = index.search(query_embedding, k=4)
context = []
for i in indices[0]:
    context.append(chunks[i])
context_joined = "\n\n".join(context)

# Create LLM Prompt
prompt = f"""
Answer the question using the provided context.

Context:
{context_joined}

Question:
{query}
"""

print(prompt)