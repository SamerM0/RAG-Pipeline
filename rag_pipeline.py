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
            for tag in soup(["script", "style", "nav", "footer", "header"]): # Remove unnecessary tags
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
    normalize_embeddings=True, # Normalize embeddings for cosine similarity
    show_progress_bar=True
)

# Setup faiss as the vector store 
dimension = embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)
index.add(embeddings)


query = "Who originated the concept of a programmable computer?"
# Create an embedding for query
query_embedding = model.encode(
    [query],
    normalize_embeddings=True 
)

# Find the 4 best matching embeddings inside the vector store
distances, indices = index.search(query_embedding, k=4)
context = []
for i in indices[0]:
    context.append(chunks[i])
context_joined = "\n\n".join(context)

# Create LLM prompt
prompt = f"""
Answer the question using the provided context.

Context:
{context_joined}

Question:
{query}
"""

print(prompt)